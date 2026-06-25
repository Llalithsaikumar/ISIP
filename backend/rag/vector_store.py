import os
from typing import List
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from backend.utils.config import settings
from backend.utils.logging import logger

# Try loading Gemini embeddings; use FakeEmbeddings if Gemini key is not set/invalid
try:
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "placeholder_key" and len(settings.GEMINI_API_KEY) > 10:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=settings.GEMINI_API_KEY)
        logger.info("Using GoogleGenerativeAIEmbeddings for vector store.")
    else:
        from langchain_community.embeddings import FakeEmbeddings
        embeddings = FakeEmbeddings(size=settings.VECTOR_DB_DIMENSION)
        logger.warning("GEMINI_API_KEY is not configured or is placeholder. Using FakeEmbeddings (for scaffolding/testing).")
except Exception as e:
    logger.error(f"Error initializing embeddings: {str(e)}. Falling back to FakeEmbeddings.")
    from langchain_community.embeddings import FakeEmbeddings
    embeddings = FakeEmbeddings(size=settings.VECTOR_DB_DIMENSION)

class VectorStoreManager:
    """
    Manages building, saving, loading, and searching the FAISS index
    used to retrieve safety regulations and manuals.
    """
    def __init__(self, index_path: str = settings.FAISS_INDEX_PATH):
        self.index_path = index_path
        self.db = None
        
        # Load vector database if exists
        if os.path.exists(index_path):
            self.load_index()
        else:
            logger.info("FAISS vector database index does not exist yet. It will be initialized when documents are uploaded.")

    def add_documents(self, documents: List[Document]):
        """Creates or appends documents to the FAISS index and persists it."""
        try:
            if not self.db:
                self.db = FAISS.from_documents(documents, embeddings)
            else:
                self.db.add_documents(documents)
            
            # Persist to disk
            os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
            self.db.save_local(self.index_path)
            logger.info(f"Successfully added {len(documents)} docs and saved FAISS index to {self.index_path}")
        except Exception as e:
            logger.error(f"Error adding documents to FAISS index: {str(e)}")
            raise e

    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        """
        Queries FAISS for top-k matching document chunks.
        Returns empty list if DB is not initialized.
        """
        if not self.db:
            logger.warning("FAISS vector DB has not been initialized. Query returns empty.")
            return []
        
        try:
            results = self.db.similarity_search(query, k=k)
            logger.info(f"Vector search returned {len(results)} matches for query: '{query}'")
            return results
        except Exception as e:
            logger.error(f"Error during similarity search: {str(e)}")
            return []

    def load_index(self):
        """Loads FAISS index from disk."""
        try:
            # allow_dangerous_deserialization=True is required for loading pickled FAISS databases
            self.db = FAISS.load_local(self.index_path, embeddings, allow_dangerous_deserialization=True)
            logger.info(f"Loaded FAISS vector index from {self.index_path}")
        except Exception as e:
            logger.error(f"Failed to load FAISS index from {self.index_path}: {str(e)}. Initializing new database.")
            self.db = None
