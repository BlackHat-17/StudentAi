"""
Complete RAG system for handwritten PDFs
Integrates OCR + Vector Search + Local LLM
Uses the same architecture as genai module with handwritten PDF support
"""
import os
import sys
from typing import List, Tuple, Dict
from ocr.run_ocr import process_pdf

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import ollama


# ── Config ────────────────────────────────────────────────────────────────────

COLLECTION_NAME = "handwritten_notes"
EMBED_MODEL     = "sentence-transformers/all-mpnet-base-v2"
CHUNK_SIZE      = 500
CHUNK_OVERLAP   = 100
TOP_K           = 3

# Global store and embeddings (initialized on first load)
_store = None
_embeddings = None
_pdf_loaded = None


# ── Bootstrap (OCR → chunk → embed → store) ──────────────────────────────────

def build_vector_store(pdf_path: str, preprocess: bool = True) -> tuple[QdrantVectorStore, HuggingFaceEmbeddings]:
    """Load handwritten PDF, OCR, chunk, embed, and store in Qdrant."""
    
    # 1. OCR Processing
    print(f"[1/4] OCR Processing: {pdf_path}")
    ocr_results = process_pdf(pdf_path, preprocess)
    
    # Convert to LangChain documents
    documents = []
    for result in ocr_results:
        doc = Document(
            page_content=result['text'],
            metadata={
                'page': result['page'],
                'confidence': result.get('confidence', 0),
                'source': pdf_path
            }
        )
        documents.append(doc)
    print(f"      → {len(documents)} page(s) processed")
    
    # 2. Chunk
    print("[2/4] Splitting into chunks ...")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        add_start_index=True,
    )
    splits = splitter.split_documents(documents)
    print(f"      → {len(splits)} chunk(s) created")
    
    # 3. Embed (model loaded once and reused)
    print(f"[3/4] Loading embedding model: {EMBED_MODEL}")
    embeddings  = HuggingFaceEmbeddings(model_name=EMBED_MODEL)
    vector_size = len(embeddings.embed_query("probe"))
    print(f"      → vector size: {vector_size}")
    
    # 4. Store
    print("[4/4] Building Qdrant vector store ...")
    client = QdrantClient(":memory:")
    
    if not client.collection_exists(COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
    
    store = QdrantVectorStore(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding=embeddings,
    )
    store.add_documents(documents=splits)
    print("      → store ready\n")
    return store, embeddings


# ── Search helpers ────────────────────────────────────────────────────────────

def search_simple(store: QdrantVectorStore, query: str, k: int = TOP_K) -> List[Document]:
    """Return the top-k most relevant chunks for a query."""
    return store.similarity_search(query, k=k)


def search_with_score(
    store: QdrantVectorStore, query: str, k: int = TOP_K
) -> List[Tuple[Document, float]]:
    """Return (chunk, cosine-score) pairs — higher score = more similar."""
    return store.similarity_search_with_score(query, k=k)


def search_by_vector(
    store: QdrantVectorStore,
    embeddings: HuggingFaceEmbeddings,
    query: str,
    k: int = TOP_K,
) -> List[Document]:
    """Embed the query first, then search by raw vector."""
    vector = embeddings.embed_query(query)
    return store.similarity_search_by_vector(vector, k=k)


def make_retriever(store: QdrantVectorStore, k: int = TOP_K):
    """
    Returns a LangChain retriever that supports .invoke() and .batch().
    Compatible with LCEL chains (e.g., retriever | prompt | llm).
    """
    return store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": k},
    )


# ── Main search functions for chat interface ──────────────────────────────────

def load_pdf(pdf_path: str, preprocess: bool = True):
    """Load a handwritten PDF and build vector store."""
    global _store, _embeddings, _pdf_loaded
    
    _store, _embeddings = build_vector_store(pdf_path, preprocess)
    _pdf_loaded = pdf_path


def search(query: str, k: int = TOP_K) -> List[str]:
    """
    Main search function that returns text chunks for a given query.
    """
    global _store
    
    if _store is None:
        raise ValueError("No PDF loaded. Call load_pdf() first.")
    
    results = search_simple(_store, query, k)
    return [doc.page_content for doc in results]


def search_with_scores(query: str, k: int = TOP_K) -> List[Tuple[str, float, Dict]]:
    """
    Search function that returns text chunks with confidence scores and metadata.
    Returns list of (text, score, metadata) tuples where lower score = more similar.
    """
    global _store
    
    if _store is None:
        raise ValueError("No PDF loaded. Call load_pdf() first.")
    
    results = search_with_score(_store, query, k)
    return [(doc.page_content, score, doc.metadata) for doc, score in results]


def answer_question(query: str, llm_model: str = "phi3") -> Dict:
    """
    Generate answer using local LLM with retrieved context.
    Returns dict with answer and source information.
    """
    # Search for relevant context
    results = search_with_scores(query)
    
    # Prepare context
    context = "\n\n".join([chunk for chunk, _, _ in results])
    
    # Generate answer
    prompt = f"""Answer the question using ONLY the context below.
If the answer is not in the context, say: "I don't have enough information."

Context:
{context}

Question: {query}

Answer:"""
    
    try:
        response = ollama.chat(
            model=llm_model,
            messages=[{"role": "user", "content": prompt}],
            options={
                "num_gpu": 0,           # Force CPU mode
                "num_ctx": 4096,        # Context window (input + output)
                "num_predict": 1000,     # Max output tokens
                "temperature": 0.7,     # Creativity (0.0-1.0)
                "top_k": 40,            # Token sampling
                "top_p": 0.9            # Nucleus sampling
            }
        )
        answer_text = response["message"]["content"]
    except Exception as e:
        # Fallback if Ollama fails
        print(f"\n⚠️  Ollama error: {e}")
        print("Returning context only (LLM unavailable)\n")
        answer_text = f"[LLM Error] Based on the retrieved context:\n\n{context[:500]}..."
    
    return {
        "answer": answer_text,
        "context": results,
        "sources": [
            {
                "page": meta.get('page', '?'),
                "confidence": score,
                "ocr_confidence": meta.get('confidence', 0),
                "text": chunk[:200]
            }
            for chunk, score, meta in results
        ]
    }


# ── Pretty printer ────────────────────────────────────────────────────────────

def print_results(query: str, results: List[Document]) -> None:
    print(f"Query : {query}")
    print("-" * 60)
    for i, doc in enumerate(results, 1):
        src  = doc.metadata.get("source", "?")
        page = doc.metadata.get("page", "?")
        conf = doc.metadata.get("confidence", 0)
        print(f"  [{i}] page={page}  ocr_conf={conf:.1f}%")
        print(f"       {doc.page_content[:300].strip()}")
        print()


def print_scored(query: str, results: List[Tuple[Document, float]]) -> None:
    print(f"Query : {query}  (with scores)")
    print("-" * 60)
    for i, (doc, score) in enumerate(results, 1):
        page = doc.metadata.get("page", "?")
        ocr_conf = doc.metadata.get("confidence", 0)
        print(f"  [{i}] page={page}  similarity={score:.4f}  ocr_conf={ocr_conf:.1f}%")
        print(f"       {doc.page_content[:300].strip()}")
        print()


# ── Main (for testing) ────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: python rag_system.py <pdf_path> [query]")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    # Load PDF
    load_pdf(pdf_path)
    
    # Test queries
    if len(sys.argv) > 2:
        query = " ".join(sys.argv[2:])
        print("=" * 60)
        print("SEARCH WITH SCORES")
        print("=" * 60)
        results = search_with_score(_store, query)
        print_scored(query, results)
    else:
        # Demo queries
        queries = [
            "What is the main topic?",
            "What are the key points?",
        ]
        
        for query in queries:
            print("=" * 60)
            print(f"Query: {query}")
            print("=" * 60)
            result = answer_question(query)
            print(f"\nAnswer: {result['answer']}\n")
            print("Sources:")
            for src in result['sources']:
                print(f"  - Page {src['page']} (similarity: {src['confidence']:.4f})")


if __name__ == "__main__":
    main()
