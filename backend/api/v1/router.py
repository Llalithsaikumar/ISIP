from fastapi import APIRouter
from backend.api.v1.endpoints.incidents import router as incidents_router
from backend.api.v1.endpoints.prediction import router as prediction_router
from backend.api.v1.endpoints.chat import router as chat_router
from backend.api.v1.endpoints.risk_engine import router as risk_engine_router
from backend.api.v1.endpoints.demo import router as demo_router

api_router = APIRouter()

# Include endpoints with relevant tag categories
api_router.include_router(incidents_router, prefix="/incidents", tags=["Incidents"])
api_router.include_router(prediction_router, prefix="/prediction", tags=["Risk Prediction"])
api_router.include_router(chat_router, prefix="/chat", tags=["Safety Assistant RAG"])
api_router.include_router(demo_router, prefix="/demo", tags=["Demo Mode"])

# Unified risk engine — mounts POST /api/v1/predict
api_router.include_router(risk_engine_router, tags=["Risk Engine"])


