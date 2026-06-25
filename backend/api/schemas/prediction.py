from pydantic import BaseModel, Field
from typing import Dict, List

class RiskEvaluationRequest(BaseModel):
    category: str = Field(..., example="Chemical", description="Hazard category")
    department: str = Field(..., example="Warehouse", description="Plant location/department")
    severity: str = Field(..., example="High", description="Subjective severity: Low, Medium, High, Critical")
    likelihood: str = Field(..., example="Possible", description="Subjective likelihood: Rare, Possible, Likely, Certain")

class RiskEvaluationResponse(BaseModel):
    risk_class_id: int = Field(..., description="Encoded risk classification index")
    predicted_risk_label: str = Field(..., description="ML classification label (e.g., High Risk)")
    confidence_score: float = Field(..., description="Probability output confidence level")
    all_probabilities: Dict[str, float] = Field(..., description="Confidence probabilities mapped across all risk labels")

class ForecastRequest(BaseModel):
    risk_history: List[float] = Field(..., description="Chronological risk scores history")
    interval_seconds: float = Field(2.0, description="Interval in seconds between consecutive points")

class ForecastResponse(BaseModel):
    risk_now: float = Field(..., description="Observed risk now")
    risk_5min: float = Field(..., description="Predicted risk 5 minutes from now")
    risk_10min: float = Field(..., description="Predicted risk 10 minutes from now")
    risk_15min: float = Field(..., description="Predicted risk 15 minutes from now")
    forecast: str = Field(..., description="Forecasting advisory statement")
