# Handwritten PDF Q&A System
**Gen AI Hackathon 2026 - Document Intelligence Track**

A complete RAG (Retrieval Augmented Generation) system that reads handwritten PDFs, understands them, and answers questions based only on the notes.

## Features

✅ **OCR for Handwritten Text** - Extracts text from handwritten PDFs using Tesseract  
✅ **Local Vector Database** - Stores embeddings in Qdrant (in-memory)  
✅ **Semantic Search** - Finds relevant context using sentence transformers  
✅ **Local LLM** - Generates answers using Ollama (no cloud AI)  
✅ **Source References** - Shows page numbers and confidence scores  
✅ **Honest Responses** - Says "I don't have enough information" when appropriate  
✅ **Works Offline** - Everything runs locally after PDF upload

## System Requirements

- Python 3.8+
- Tesseract OCR installed
- Ollama installed with mistral model
- 8GB+ RAM recommended

## Installation

### 1. Install Tesseract OCR

**Windows:**
```cmd
# Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
# Add to PATH: C:\Program Files\Tesseract-OCR
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

**Mac:**
```bash
brew install tesseract
```

### 2. Install Ollama & Pull Model

```bash
# Install from: https://ollama.ai
ollama pull mistral
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

## Usage

### For Handwritten PDFs (Hackathon Solution)

```bash
cd genai-handwritten-rag
python chat.py path/to/handwritten_notes.pdf
```

### For Typed PDFs (Original Module)

```bash
cd genai
python chat.py
```

## How It Works

1. **PDF → Images** - Converts PDF pages to high-res images (300 DPI)
2. **Preprocessing** - Denoises, enhances contrast, binarizes for better OCR
3. **OCR** - Extracts text using Tesseract with confidence scores
4. **Chunking** - Splits text into 500-char chunks with 100-char overlap
5. **Embedding** - Creates vector embeddings using sentence-transformers
6. **Storage** - Stores in Qdrant vector database (in-memory)
7. **Search** - Finds top-3 most relevant chunks using cosine similarity
8. **Answer** - Generates response using local Ollama mistral model
9. **Display** - Shows answer with page references and confidence scores

## Project Structure

```
├── genai/                          # Typed PDF module
│   ├── chat.py                     # Chat interface
│   └── query_engine.py             # RAG search engine
│
├── genai-handwritten-rag/          # Handwritten PDF module (MAIN)
│   ├── ocr/
│   │   ├── pdf_to_image.py         # PDF → Images
│   │   ├── preprocess.py           # Image enhancement
│   │   ├── extract_text.py         # OCR with Tesseract
│   │   └── run_ocr.py              # Complete OCR pipeline
│   ├── rag_system.py               # RAG system class
│   ├── chat.py                     # Interactive Q&A interface
│   └── data/
│       └── sample_notes.pdf        # Test PDF
│
├── requirements.txt                # Python dependencies
└── README.md                       # This file
```

## Demo Flow

1. **Load PDF:**
   ```
   python chat.py sample_notes.pdf
   ```

2. **System processes:**
   - OCR extracts text from handwriting
   - Creates embeddings and vector store
   - Ready for questions

3. **Ask questions:**
   ```
   Question: What is photosynthesis?
   
   --- Retrieved Context ---
   [1] Page 1 | Confidence: 0.2341
       Photosynthesis is the process by which plants...
   
   Answer:
   Photosynthesis is the process by which plants convert 
   sunlight into chemical energy.
   
   Sources:
   [1] Page 1 (confidence: 0.2341)
   ```

## Scoring Criteria Alignment

| Criteria | Implementation | Weight |
|----------|---------------|--------|
| **Correct Answers** | Local LLM with context-only responses | 40% |
| **RAG Workflow** | Complete OCR → Embed → Search → Generate pipeline | 20% |
| **Bonus Features** | Confidence scores, source references | 20% |
| **UI Design** | Clean CLI with formatted output | 10% |
| **Presentation** | Clear code structure, documentation | 10% |

## Bonus Features Implemented

✅ **Confidence Scores** - Shows similarity scores for each retrieved chunk  
✅ **Source References** - Displays exact page numbers  
✅ **Clean Code** - Well-organized, documented modules  
✅ **Preprocessing** - Handles messy handwriting better

## Rules Compliance

✅ Local OCR (Tesseract)  
✅ Local database (Qdrant in-memory)  
✅ Local LLM (Ollama mistral)  
✅ Works offline after PDF upload  
✅ No cloud AI for answer generation  
✅ No model training/fine-tuning  

## Testing with New PDFs

During demo, to test with a new PDF:

```bash
python chat.py new_handwritten_notes.pdf
```

The system will:
1. Process the new PDF (takes 30-60 seconds)
2. Build new vector store
3. Ready for questions from judges

## Troubleshooting

**Tesseract not found:**
```bash
# Add to PATH or set manually in extract_text.py:
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

**Ollama connection error:**
```bash
# Start Ollama service
ollama serve
```

**Low OCR accuracy:**
- Increase DPI in `pdf_to_image.py` (default: 300)
- Adjust preprocessing parameters in `preprocess.py`

## Team Info

- **Duration:** 6 hours
- **Team Size:** 2-4 members
- **Hardware:** Any laptop/PC

---

**Build Smart. Retrieve Precisely. Answer Honestly.**
