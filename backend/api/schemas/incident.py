from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class IncidentBase(BaseModel):
    title: str = Field(..., max_length=100, description="Title of the incident")
    description: str = Field(..., description="Details of what happened")
    category: str = Field(..., description="Incident category (e.g. Mechanical, PPE Violation)")
    severity: str = Field(..., description="Severity category (Low, Medium, High, Critical)")
    likelihood: str = Field(..., description="Likelihood category (Rare, Possible, Likely, Certain)")
    department: str = Field(..., description="Associated department")
    reporter: str = Field(..., description="Person reporting the incident")

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdateStatus(BaseModel):
    status: str = Field(..., description="Tracking state: Open, In Progress, Resolved, Closed")
    mitigation_action: Optional[str] = Field(None, description="Corrective actions taken to resolve safety issue")

class IncidentResponse(IncidentBase):
    id: int
    risk_score: Optional[float] = None
    status: str
    mitigation_action: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Enable SQLAlchemy model compatibility
    model_config = ConfigDict(from_attributes=True)
