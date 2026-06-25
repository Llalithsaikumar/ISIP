"""
FastAPI Application Entry Point — Industrial Safety Intelligence Platform (ISIP)

This module configures:
    - CORS middleware for React frontend connections
    - SQLAlchemy table initialization
    - API router registration (versioned under /api/v1 and root-level /predict)
    - Health check and model status endpoints
    - Swagger/ReDoc documentation (enabled in DEBUG mode)
"""

import os
import sys

# Ensure the project root is on sys.path so that 'from backend.x' imports
# work when this script is run from the backend/ directory (e.g., cd backend; python main.py).
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.utils.config import settings
from backend.utils.logging import logger
from backend.models.database import engine, Base
from backend.api.v1.router import api_router
from backend.api.v1.endpoints.risk_engine import router as risk_engine_router


# ---------------------------------------------------------------------------
# Application Lifespan (startup / shutdown hooks)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application startup and shutdown events.
    Startup: initializes database tables and verifies model files.
    Shutdown: logs clean exit.
    """
    # ---- STARTUP ----
    logger.info(f"Starting {settings.APP_NAME} v1.0.0...")

    # Initialize SQLAlchemy database tables
    try:
        logger.info("Initializing database schemas...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas initialized successfully.")
    except Exception as e:
        logger.critical(f"Failed to initialize database tables: {e}")

    # Check that ML model files are available
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    model_files = {
        "model.pkl": "RandomForest risk predictor",
        "encoder.pkl": "LabelEncoder (shift)",
        "anomaly_model.pkl": "IsolationForest anomaly detector",
    }
    for filename, description in model_files.items():
        path = os.path.join(data_dir, filename)
        if os.path.exists(path):
            logger.info(f"  [OK] {description}: {filename}")
        else:
            logger.warning(f"  [MISSING] {description}: {filename} — /predict will auto-train on first call")

    logger.info(f"API documentation available at: http://localhost:8000/docs")
    logger.info(f"Application startup complete.")

    yield  # Application is running

    # ---- SHUTDOWN ----
    logger.info(f"Shutting down {settings.APP_NAME}. Goodbye.")


# ---------------------------------------------------------------------------
# FastAPI Application Instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Backend API for the AI-Powered Industrial Safety Intelligence Platform (ISIP). "
        "Provides safety incident logging, ML-based risk prediction, anomaly detection, "
        "and a RAG-powered AI safety advisor."
    ),
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Middleware Configuration
# ---------------------------------------------------------------------------

# CORS: Allow the React frontend (port 3000) and any origin in development.
# In production, restrict allow_origins to your deployed frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Router Registration
# ---------------------------------------------------------------------------

# Versioned API — all endpoints under /api/v1/
#   POST /api/v1/predict          (risk engine)
#   GET  /api/v1/incidents/       (incident CRUD)
#   POST /api/v1/prediction/evaluate (legacy classifier)
#   POST /api/v1/chat/query      (RAG assistant)
app.include_router(api_router, prefix=settings.API_V1_STR)

# Convenience shortcut — mount /predict at the root level
# so the frontend can call POST /predict directly without the /api/v1 prefix.
app.include_router(risk_engine_router, tags=["Risk Engine (Root)"])


# ---------------------------------------------------------------------------
# Health & Status Endpoints
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health Check"])
def root():
    """
    Root endpoint — confirms the service is running.
    Used by load balancers, uptime monitors, and container orchestrators.
    """
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health Check"])
def health_check():
    """
    Detailed health check endpoint.
    Returns application configuration, model availability, and debug mode.
    """
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    model_status = {}
    for filename in ["model.pkl", "encoder.pkl", "anomaly_model.pkl"]:
        path = os.path.join(data_dir, filename)
        model_status[filename] = "loaded" if os.path.exists(path) else "missing"

    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": "1.0.0",
        "debug_mode": settings.DEBUG,
        "api_v1_path": settings.API_V1_STR,
        "models": model_status,
    }


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )

