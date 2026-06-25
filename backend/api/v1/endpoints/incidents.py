from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.models.database import get_db
from backend.api.schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdateStatus
from backend.api.schemas.incident_report import IncidentReportRequest, IncidentReportResponse
from backend.api.schemas.rca import RCARequest, RCAResponse
from backend.services.incident_service import IncidentService
from backend.services.incident_report import IncidentReportGenerator
from backend.services.rca_agent import RootCauseAnalysisAgent

router = APIRouter()

@router.get("/", response_model=List[IncidentResponse])
def read_incidents(db: Session = Depends(get_db)):
    """
    Retrieve all safety incidents logged in the database.
    """
    return IncidentService.get_all_incidents(db)

@router.get("/metrics", response_model=Dict[str, Any])
def read_incident_metrics(db: Session = Depends(get_db)):
    """
    Calculate and return safety metric aggregations for the dashboard.
    """
    return IncidentService.get_dashboard_metrics(db)

@router.post("/ai-report", response_model=IncidentReportResponse)
def generate_ai_incident_report(payload: IncidentReportRequest):
    """
    Generate an AI Safety Incident Report (Summary, Root Cause, Actions, and SOP)
    based on current risk metrics and telemetry parameters.
    """
    try:
        report = IncidentReportGenerator.generate_report(
            final_risk=payload.final_risk,
            temperature=payload.temperature,
            gas_level=payload.gas_level,
            ppe_compliance=payload.ppe_compliance
        )
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {str(e)}"
        )

@router.post("/rca", response_model=RCAResponse)
def evaluate_root_cause(payload: RCARequest):
    """
    Invokes the AI Root Cause Analysis (RCA) Agent to diagnose the primary cause
    of elevated risks, identify contributing factors, and suggest actions.
    """
    try:
        result = RootCauseAnalysisAgent.analyze_root_cause(
            telemetry=payload.telemetry.model_dump(),
            risk_score=payload.risk_score,
            anomaly_score=payload.anomaly_score,
            alerts=[alert.model_dump() for alert in payload.alerts]
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Root cause analysis failed: {str(e)}"
        )

@router.get("/{incident_id}", response_model=IncidentResponse)
def read_incident(incident_id: int, db: Session = Depends(get_db)):
    """
    Fetch details of a single safety incident by primary ID.
    """
    incident = IncidentService.get_incident_by_id(db, incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found."
        )
    return incident

@router.post("/", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(incident_in: IncidentCreate, db: Session = Depends(get_db)):
    """
    Log a new safety incident, hazardous condition, or audit report.
    Calculates safety risk ratings and persists the data.
    """
    return IncidentService.create_incident(db, incident_in.model_dump())

@router.put("/{incident_id}/status", response_model=IncidentResponse)
def update_incident_status(
    incident_id: int,
    status_update: IncidentUpdateStatus,
    db: Session = Depends(get_db)
):
    """
    Update safety incident mitigation status (e.g. resolve, close, or document remediation).
    """
    updated_incident = IncidentService.update_incident_status(
        db=db,
        incident_id=incident_id,
        status=status_update.status,
        mitigation_action=status_update.mitigation_action
    )
    if not updated_incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found."
        )
    return updated_incident
