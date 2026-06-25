"""
Pydantic schemas for the unified Risk Engine endpoint (POST /predict).

Defines strict validation rules for sensor telemetry input and
structured response models matching the risk_engine output format.
"""

from pydantic import BaseModel, Field
from typing import Literal, List, Optional


class RiskPredictionRequest(BaseModel):
    """
    Input schema for the /predict endpoint.
    Each field maps directly to a column in the industrial_safety dataset
    that both the RandomForest and IsolationForest models were trained on.
    """
    temperature: float = Field(
        ...,
        ge=20, le=120,
        description="Equipment / ambient temperature in degrees Celsius (20-120).",
        json_schema_extra={"example": 90}
    )
    gas_level: float = Field(
        ...,
        ge=0, le=100,
        description="Toxic or combustible gas concentration in ppm (0-100).",
        json_schema_extra={"example": 80}
    )
    humidity: float = Field(
        ...,
        ge=10, le=100,
        description="Relative humidity percentage (10-100).",
        json_schema_extra={"example": 75}
    )
    vibration: float = Field(
        ...,
        ge=0, le=100,
        description="Machine oscillation intensity in mm/s (0-100).",
        json_schema_extra={"example": 60}
    )
    worker_count: int = Field(
        ...,
        ge=1, le=50,
        description="Number of workers in the sector zone (1-50).",
        json_schema_extra={"example": 25}
    )
    shift: Literal["day", "night"] = Field(
        ...,
        description="Current work shift: 'day' or 'night'.",
        json_schema_extra={"example": "night"}
    )
    ppe_compliance: Literal[0, 1] = Field(
        ...,
        description="PPE compliance flag: 0 = non-compliant, 1 = compliant.",
        json_schema_extra={"example": 0}
    )


class AlertResponse(BaseModel):
    """
    Represents an individual safety alert triggered by threshold violations.
    """
    alert_type: str = Field(..., description="Alert classification type (e.g. GAS_LEAK, PPE_VIOLATION)")
    severity: str = Field(..., description="Severity level: HIGH or CRITICAL")
    message: str = Field(..., description="Detailed description of the threshold violation")


class RiskPredictionResponse(BaseModel):
    """
    Output schema returned by the /predict endpoint.
    Contains the individual model scores, the blended composite,
    and a categorical risk level classification.
    """
    predicted_risk: float = Field(
        ...,
        description="RandomForest regression output (0-100)."
    )
    anomaly_risk: float = Field(
        ...,
        description="IsolationForest anomaly score scaled to 0-100."
    )
    final_risk: float = Field(
        ...,
        description="Weighted composite: 0.7 * predicted + 0.3 * anomaly (0-100)."
    )
    risk_level: str = Field(
        ...,
        description="Categorical risk label: LOW / MEDIUM / HIGH / CRITICAL."
    )
    alerts: Optional[List[AlertResponse]] = Field(
        default=[],
        description="List of active warnings triggered during evaluation."
    )

