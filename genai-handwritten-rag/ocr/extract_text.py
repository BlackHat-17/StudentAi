"""
Basic text extraction from PDFs (no OCR - for typed PDFs only)
Uses PyMuPDF to extract text directly
"""
import fitz  # PyMuPDF
from typing import Dict


def extract_text_basic(pdf_path: str, page_num: int) -> Dict:
    """
    Extract text directly from PDF (works for typed PDFs).
    For handwritten PDFs, this will return empty/minimal text.
    """
    doc = fitz.open(pdf_path)
    page = doc[page_num - 1]  # 0-indexed
    text = page.get_text()
    doc.close()
    
    return {
        "page": page_num,
        "text": text.strip(),
        "confidence": 100.0,  # Direct extraction = 100% confidence
        "method": "direct_extraction"
    }


def extract_text_tesseract(image, page_num: int) -> Dict:
    """
    Placeholder - OCR disabled for basic testing.
    """
    return {
        "page": page_num,
        "text": "",
        "confidence": 0,
        "method": "ocr_disabled"
    }


def extract_text_with_confidence(image, page_num: int) -> Dict:
    """
    Placeholder - OCR disabled for basic testing.
    """
    return {
        "page": page_num,
        "text": "",
        "confidence": 0,
        "method": "ocr_disabled"
    }
