from pydantic import BaseModel, Field
from typing import List

class RCASimTelemetry(BaseModel):
    temperature: float = Field(..., description="Observed equipment temperature in Celsius")
    gas_level: float = Field(..., description="Observed gas level concentration in ppm")
    humidity: float = Field(..., description="Observed relative humidity percentage")
    vibration: float = Field(..., description="Observed machinery vibration in mm/s")
    worker_count: int = Field(..., description="Active headcount in the affected zone")
    shift: str = Field(..., description="Operating shift: day or night")
    ppe_compliance: int = Field(..., description="PPE compliance status (1 = compliant, 0 = non-compliant)")

class RCALegacyAlert(BaseModel):
    alert_type: str = Field(..., description="Type of alert triggered")
    severity: str = Field(..., description="Severity level of alert")
    message: str = Field(..., description="Warning message statement")

class RCARequest(BaseModel):
    telemetry: RCASimTelemetry = Field(..., description="Environmental and operational sensor readings")
    risk_score: float = Field(..., description="Blended composite prediction risk score (0-100)")
    anomaly_score: float = Field(..., description="IsolationForest anomaly score (0-100)")
    alerts: List[RCALegacyAlert] = Field(default=[], description="List of active warnings triggered by rules engine")

class RCAResponse(BaseModel):
    root_cause: str = Field(..., description="Main root cause description of the incident")
    contributing_factors: List[str] = Field(..., description="List of contributing circumstances or failures")
    immediate_actions: List[str] = Field(..., description="Immediate containment actions required")
    preventive_actions: List[str] = Field(..., description="Long-term preventive recommendations")
    priority: str = Field(..., description="Calculated priority level: LOW, MEDIUM, HIGH, CRITICAL")
