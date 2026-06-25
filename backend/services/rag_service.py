import os
from typing import List, Dict, Any
from backend.rag.document_processor import DocumentProcessor
from backend.rag.vector_store import VectorStoreManager
from backend.rag.chain import RAGSafetyChain
from backend.utils.logging import logger

class RAGService:
    """
    RAG Service orchestrating text splitting, vector indexing,
    and conversational search queries.
    """
    def __init__(self):
        self.doc_processor = DocumentProcessor()
        self.vector_store = VectorStoreManager()
        self.rag_chain = RAGSafetyChain(self.vector_store)

    def ingest_document(self, file_path: str) -> Dict[str, Any]:
        """
        Parses, splits, and indexes an uploaded file in the FAISS vector database.
        """
        logger.info(f"Ingesting document: {file_path}")
        try:
            chunks = self.doc_processor.load_and_split_file(file_path)
            self.vector_store.add_documents(chunks)
            return {
                "success": True,
                "message": f"Successfully ingested {os.path.basename(file_path)}",
                "chunks_count": len(chunks)
            }
        except Exception as e:
            logger.error(f"Failed to ingest document: {str(e)}")
            return {
                "success": False,
                "message": f"Ingestion error: {str(e)}",
                "chunks_count": 0
            }

    def query_safety_assistant(self, question: str) -> Dict[str, Any]:
        """
        Queries the safety intelligence chatbot about regulations or procedures.
        """
        logger.info(f"RAG query request: '{question}'")
        return self.rag_chain.answer_query(question)
