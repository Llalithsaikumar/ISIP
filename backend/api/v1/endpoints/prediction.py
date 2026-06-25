from fastapi import APIRouter, Depends
from backend.api.schemas.prediction import (
    RiskEvaluationRequest,
    RiskEvaluationResponse,
    ForecastRequest,
    ForecastResponse
)
from backend.api.deps import get_prediction_service
from backend.services.prediction_service import PredictionService

router = APIRouter()

@router.post("/evaluate", response_model=RiskEvaluationResponse)
def evaluate_risk(
    payload: RiskEvaluationRequest,
    predictor: PredictionService = Depends(get_prediction_service)
):
    """
    Evaluates safety risk matrix classes using a pre-trained Scikit-Learn RandomForest classifier.
    Injects plant location, incident category, severity, and likelihood to predict outcomes.
    """
    result = predictor.evaluate_incident_risk(
        category=payload.category,
        department=payload.department,
        severity=payload.severity,
        likelihood=payload.likelihood
    )
    return result

@router.post("/forecast", response_model=ForecastResponse)
def evaluate_hazard_forecast(
    payload: ForecastRequest,
    predictor: PredictionService = Depends(get_prediction_service)
):
    """
    Predicts composite risk levels 5, 10, and 15 minutes into the future
    based on a rolling historical risk stream.
    """
    result = predictor.forecast_hazard_risk(
        risk_history=payload.risk_history,
        interval_seconds=payload.interval_seconds
    )
    return result
