"""
Basic PDF text extraction pipeline (no OCR - for typed PDFs)
"""
import fitz  # PyMuPDF
from typing import List, Dict


def process_pdf(pdf_path: str, preprocess: bool = True) -> List[Dict]:
    """
    Basic text extraction from PDF (works for typed PDFs).
    No OCR or image processing needed.
    
    Args:
        pdf_path: Path to PDF file
        preprocess: Ignored in basic mode
    
    Returns:
        List of dicts with extracted text and metadata per page
    """
    print(f"\n{'='*60}")
    print(f"Processing: {pdf_path}")
    print(f"{'='*60}\n")
    
    # Open PDF
    doc = fitz.open(pdf_path)
    
    results = []
    for page_num in range(len(doc)):
        print(f"Processing page {page_num + 1}/{len(doc)}...")
        
        page = doc[page_num]
        text = page.get_text()
        
        result = {
            "page": page_num + 1,
            "text": text.strip(),
            "confidence": 100.0,  # Direct extraction = 100% confidence
            "method": "direct_extraction"
        }
        results.append(result)
        
        print(f"  → Extracted {len(result['text'])} chars")
    
    doc.close()
    
    print(f"\n{'='*60}")
    print(f"Completed: {len(results)} pages processed")
    print(f"{'='*60}\n")
    
    return results


def save_extracted_text(results: List[Dict], output_path: str):
    """Save extracted text to a file."""
    with open(output_path, 'w', encoding='utf-8') as f:
        for result in results:
            f.write(f"\n--- Page {result['page']} ---\n")
            f.write(result['text'])
            f.write("\n")
    
    print(f"Saved extracted text to: {output_path}")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python run_ocr.py <pdf_path> [output_txt_path]")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "extracted_text.txt"
    
    results = process_pdf(pdf_path)
    save_extracted_text(results, output_path)
