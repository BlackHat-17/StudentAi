"""
Convert PDF pages to images for OCR processing
Uses PyMuPDF (fitz) - no poppler required
"""
import fitz  # PyMuPDF
from typing import List
from PIL import Image
import io


def pdf_to_images(pdf_path: str, dpi: int = 300) -> List[Image.Image]:
    """
    Convert PDF to list of PIL Images using PyMuPDF.
    Higher DPI = better quality but slower processing.
    """
    print(f"Converting PDF to images (DPI={dpi})...")
    
    # Open PDF
    pdf_document = fitz.open(pdf_path)
    images = []
    
    # Calculate zoom factor for desired DPI (default PDF is 72 DPI)
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    
    # Convert each page to image
    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]
        pix = page.get_pixmap(matrix=mat)
        
        # Convert to PIL Image
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))
        images.append(img)
    
    pdf_document.close()
    print(f"  → {len(images)} page(s) converted")
    return images
