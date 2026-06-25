from pydantic import BaseModel, Field
from typing import List

class IncidentReportRequest(BaseModel):
    final_risk: float = Field(..., description="Calculated final blended risk percentage (0-100)")
    temperature: float = Field(..., description="Observed equipment temperature in Celsius")
    gas_level: float = Field(..., description="Observed gas level concentration in ppm")
    ppe_compliance: int = Field(..., description="PPE compliance status (1 for compliant, 0 for non-compliant)")

class IncidentReportResponse(BaseModel):
    incident_summary: str = Field(..., description="A concise summary of the incident")
    root_cause_analysis: str = Field(..., description="Analysis of the root causes of the incident")
    immediate_actions: List[str] = Field(..., description="Immediate mitigation steps taken or required")
    preventive_actions: List[str] = Field(..., description="Long-term preventive actions recommended to prevent recurrence")
    recommended_sop: str = Field(..., description="Recommended Standard Operating Procedure (SOP) updates or protocols")
