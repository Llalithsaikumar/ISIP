from sqlalchemy.orm import Session
from fastapi import Depends
from backend.models.database import get_db
from backend.services.prediction_service import PredictionService
from backend.services.rag_service import RAGService

# Singletons for service caching
_prediction_service = None
_rag_service = None

def get_prediction_service() -> PredictionService:
    """Dependency injection wrapper to get or initialize the Prediction Service."""
    global _prediction_service
    if _prediction_service is None:
        _prediction_service = PredictionService()
    return _prediction_service

def get_rag_service() -> RAGService:
    """Dependency injection wrapper to get or initialize the RAG Service."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
