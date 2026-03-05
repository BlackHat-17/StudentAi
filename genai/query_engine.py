"""
search.py — RAG Search Module
Stack: LangChain · HuggingFace Embeddings · Qdrant · RecursiveCharacterTextSplitter

Usage:
    python search.py                        # runs example queries
    python search.py "your question here"   # single CLI query
"""

import sys
import os
from typing import List, Tuple

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams


# ── Config ────────────────────────────────────────────────────────────────────

PDF_PATH        = "kebo111.pdf"  # Relative path from project root
COLLECTION_NAME = "problem_docs"
EMBED_MODEL     = "sentence-transformers/all-mpnet-base-v2"
CHUNK_SIZE      = 1000
CHUNK_OVERLAP   = 200
TOP_K           = 3   # results returned per query

# Global store and embeddings (initialized on first search)
_store = None
_embeddings = None


# ── Bootstrap (load → chunk → embed → store) ─────────────────────────────────

def build_vector_store(pdf_path: str) -> tuple[QdrantVectorStore, HuggingFaceEmbeddings]:
    """Load PDF, chunk it, embed, and insert into an in-memory Qdrant store."""
    
    # Resolve relative path from project root
    if not os.path.isabs(pdf_path):
        # Go up one level from genai directory to project root
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        pdf_path = os.path.join(project_root, pdf_path)

    # 1. Load
    print(f"[1/4] Loading PDF: {pdf_path}")
    loader = PyPDFLoader(pdf_path)
    docs   = loader.load()
    print(f"      → {len(docs)} page(s) loaded")

    # 2. Chunk
    print("[2/4] Splitting into chunks ...")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        add_start_index=True,
    )
    splits = splitter.split_documents(docs)
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


# ── Main search function for chat interface ──────────────────────────────────

def search(query: str, k: int = TOP_K) -> List[str]:
    """
    Main search function that returns text chunks for a given query.
    Initializes the vector store on first call.
    """
    global _store, _embeddings
    
    if _store is None:
        _store, _embeddings = build_vector_store(PDF_PATH)
    
    results = search_simple(_store, query, k)
    return [doc.page_content for doc in results]


def search_with_scores(query: str, k: int = TOP_K) -> List[Tuple[str, float]]:
    """
    Search function that returns text chunks with confidence scores.
    Initializes the vector store on first call.
    Returns list of (text, score) tuples where higher score = more similar.
    """
    global _store, _embeddings
    
    if _store is None:
        _store, _embeddings = build_vector_store(PDF_PATH)
    
    results = search_with_score(_store, query, k)
    return [(doc.page_content, score) for doc, score in results]


# ── Pretty printer ────────────────────────────────────────────────────────────

def print_results(query: str, results: List[Document]) -> None:
    print(f"Query : {query}")
    print("-" * 60)
    for i, doc in enumerate(results, 1):
        src  = doc.metadata.get("source", "?")
        page = doc.metadata.get("page", "?")
        print(f"  [{i}] source={src}  page={page}")
        print(f"       {doc.page_content[:300].strip()}")
        print()


def print_scored(query: str, results: List[Tuple[Document, float]]) -> None:
    print(f"Query : {query}  (with scores)")
    print("-" * 60)
    for i, (doc, score) in enumerate(results, 1):
        print(f"  [{i}] score={score:.4f}")
        print(f"       {doc.page_content[:300].strip()}")
        print()


# ── Main ──────────────────────────────────────────────────────────────

def main():
    store, embeddings = build_vector_store(PDF_PATH)

    # 1. Simple similarity search
    q1 = "What is the problem statement?"
    print("=" * 60)
    print("1. SIMPLE SIMILARITY SEARCH")
    print("=" * 60)
    print_results(q1, search_simple(store, q1))

    # 2. Search with cosine scores
    q2 = "What are the objectives?"
    print("=" * 60)
    print("2. SEARCH WITH SCORES")
    print("=" * 60)
    print_scored(q2, search_with_score(store, q2))

    # 3. Vector-based search
    q3 = "What technologies or tools are mentioned?"
    print("=" * 60)
    print("3. VECTOR-BASED SEARCH")
    print("=" * 60)
    print_results(q3, search_by_vector(store, embeddings, q3))

    # 4. Batch retrieval via LangChain retriever
    batch_queries = [
        "What is the problem statement?",
        "What is the expected output?",
        "Who are the stakeholders?",
    ]
    print("=" * 60)
    print("4. BATCH RETRIEVAL (LangChain retriever)")
    print("=" * 60)
    retriever     = make_retriever(store)
    batch_results = retriever.batch(batch_queries)
    for query, docs in zip(batch_queries, batch_results):
        print_results(query, docs)

    # 5. Optional: single query from CLI
    if len(sys.argv) > 1:
        cli_query = " ".join(sys.argv[1:])
        print("=" * 60)
        print("5. CLI QUERY")
        print("=" * 60)
        print_results(cli_query, search_simple(store, cli_query))


if __name__ == "__main__":
    main()