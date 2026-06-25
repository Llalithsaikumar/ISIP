from pydantic import BaseModel, Field
from typing import List, Dict, Any
from backend.api.schemas.risk_engine import AlertResponse
from backend.api.schemas.incident_report import IncidentReportResponse
from backend.api.schemas.incident import IncidentResponse

class DemoScenarioRequest(BaseModel):
    """
    Input schema to run a demo scenario.
    """
    scenario: str = Field(..., description="The scenario key: 'gas_leak', 'machine_overheating', 'ppe_violation', 'combined_catastrophe'")

class DemoScenarioInfo(BaseModel):
    """
    Metadata information for available demo scenarios.
    """
    key: str
    title: str
    description: str
    target_zone: str
    expected_hazards: List[str]

class DemoRunResponse(BaseModel):
    """
    Aggregated response returned after successfully executing a demo scenario.
    """
    telemetry: Dict[str, Any] = Field(..., description="Telemetry parameters evaluated by risk engine")
    alerts: List[AlertResponse] = Field(..., description="Active warnings triggered by this scenario")
    incident_report: IncidentReportResponse = Field(..., description="Generated Safety Incident Report & RCA")
    logged_incident: IncidentResponse = Field(..., description="The persisted Safety Incident record from the database")
