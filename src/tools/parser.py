import os
from docling.document_converter import DocumentConverter

def parse_agreement(file_path: str) -> str:
    """
    Parses an uploaded agreement (Raw Text, PDF, or Image) and returns it as structured Markdown.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    # Handle raw text directly for speed and simplicity
    if ext in ['.txt', '.md']:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    # Handle PDFs and Images via Docling
    # Docling handles OCR and structural parsing automatically
    converter = DocumentConverter()
    result = converter.convert(file_path)
    
    return result.document.export_to_markdown()
