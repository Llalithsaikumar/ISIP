import os
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from backend.utils.logging import logger

class DocumentProcessor:
    """
    Handles file ingestion (PDF, text) and document chunking
    to prepare documents for the FAISS vector database.
    """
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len
        )

    def load_and_split_file(self, file_path: str) -> List[Document]:
        """
        Loads document content and splits it into logical chunks.
        Supports PDF and text files.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        ext = os.path.splitext(file_path)[-1].lower()
        content = ""
        
        try:
            if ext == ".pdf":
                content = self._parse_pdf(file_path)
            elif ext in [".txt", ".md"]:
                content = self._parse_text(file_path)
            else:
                raise ValueError(f"Unsupported file format: {ext}")
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {str(e)}")
            raise e

        # Create LangChain Document schema
        metadata = {"source": os.path.basename(file_path)}
        docs = [Document(page_content=content, metadata=metadata)]
        
        # Split into smaller chunks
        chunks = self.text_splitter.split_documents(docs)
        logger.info(f"Successfully split document {file_path} into {len(chunks)} chunks.")
        return chunks

    def _parse_pdf(self, file_path: str) -> str:
        """Helper to extract text from PDFs using PyPDF2."""
        text = ""
        try:
            import PyPDF2
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page_num in range(len(reader.pages)):
                    page = reader.pages[page_num]
                    text_content = page.extract_text()
                    if text_content:
                        text += text_content + "\n"
        except ImportError:
            logger.error("PyPDF2 is not installed. PDF parsing will fail.")
            raise ImportError("PyPDF2 is required to parse PDF files. Run 'pip install PyPDF2'.")
        return text

    def _parse_text(self, file_path: str) -> str:
        """Helper to extract text from plaintext files."""
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
