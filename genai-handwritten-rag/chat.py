"""
Interactive chat interface for handwritten PDF Q&A
Uses the same architecture as genai/chat.py with OCR support
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rag_system import load_pdf, search_with_scores, answer_question


def main():
    if len(sys.argv) < 2:
        print("Usage: python chat.py <pdf_path>")
        print("\nExample:")
        print("  python chat.py data/sample_notes.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    # Check if file exists
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)
    
    # Initialize system
    print("\n" + "="*60)
    print("Handwritten PDF Q&A System")
    print("="*60 + "\n")
    
    try:
        load_pdf(pdf_path)
    except Exception as e:
        print(f"Error loading PDF: {e}")
        sys.exit(1)
    
    print("\n" + "="*60)
    print("Chat system ready! Ask questions about your notes.")
    print("Type 'quit' or 'exit' to stop.")
    print("="*60 + "\n")
    
    # Chat loop
    while True:
        question = input("\nQuestion: ").strip()
        
        if question.lower() in ['quit', 'exit', 'q']:
            print("\nGoodbye!")
            break
        
        if not question:
            continue
        
        try:
            # Generate answer
            result = answer_question(question)
            
            print("\n" + "-"*60)
            print("Answer:")
            print("-"*60)
            print(result['answer'])
            
            print("\n" + "-"*60)
            print("Sources:")
            print("-"*60)
            for i, source in enumerate(result['sources'], 1):
                print(f"[{i}] Page {source['page']} (similarity: {source['confidence']:.4f}, OCR: {source['ocr_confidence']:.1f}%)")
            
        except Exception as e:
            print(f"\nError: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    main()
