from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from backend.models.safety_incident import SafetyIncident
from backend.utils.logging import logger

class IncidentService:
    """
    Business logic layer for creating, reading, updating, and analyzing 
    safety incidents in the database.
    """
    
    @staticmethod
    def get_all_incidents(db: Session) -> List[SafetyIncident]:
        """Fetch all incidents from the database."""
        return db.query(SafetyIncident).all()

    @staticmethod
    def get_incident_by_id(db: Session, incident_id: int) -> Optional[SafetyIncident]:
        """Fetch a specific incident by ID."""
        return db.query(SafetyIncident).filter(SafetyIncident.id == incident_id).first()

    @staticmethod
    def create_incident(db: Session, incident_data: Dict[str, Any]) -> SafetyIncident:
        """Create and persist a new safety incident report."""
        logger.info(f"Logging new safety incident: {incident_data.get('title')}")
        
        # Calculate a basic risk score if not provided:
        # Simple risk matrix: Severity (Low=1, Med=2, High=3, Critical=4) * Likelihood (Rare=1, Possible=2, Likely=3, Certain=4)
        if not incident_data.get("risk_score"):
            severity_map = {"Low": 1.0, "Medium": 2.0, "High": 3.0, "Critical": 4.0}
            likelihood_map = {"Rare": 1.0, "Possible": 2.0, "Likely": 3.0, "Certain": 4.0}
            
            sev_val = severity_map.get(incident_data.get("severity", "Low"), 1.0)
            lik_val = likelihood_map.get(incident_data.get("likelihood", "Rare"), 1.0)
            incident_data["risk_score"] = float(sev_val * lik_val)
            
        new_incident = SafetyIncident(
            title=incident_data["title"],
            description=incident_data["description"],
            category=incident_data["category"],
            severity=incident_data["severity"],
            likelihood=incident_data["likelihood"],
            risk_score=incident_data["risk_score"],
            department=incident_data["department"],
            reporter=incident_data["reporter"],
            status=incident_data.get("status", "Open"),
            mitigation_action=incident_data.get("mitigation_action", "")
        )
        
        db.add(new_incident)
        db.commit()
        db.refresh(new_incident)
        return new_incident

    @staticmethod
    def update_incident_status(db: Session, incident_id: int, status: str, mitigation_action: Optional[str] = None) -> Optional[SafetyIncident]:
        """Update the tracking status or resolution description of an incident."""
        db_incident = db.query(SafetyIncident).filter(SafetyIncident.id == incident_id).first()
        if not db_incident:
            return None
            
        db_incident.status = status
        if mitigation_action is not None:
            db_incident.mitigation_action = mitigation_action
            
        db.commit()
        db.refresh(db_incident)
        logger.info(f"Updated incident ID {incident_id} to status: {status}")
        return db_incident

    @staticmethod
    def get_dashboard_metrics(db: Session) -> Dict[str, Any]:
        """
        Calculates aggregate statistics for the dashboard.
        """
        total_incidents = db.query(SafetyIncident).count()
        
        # Calculate status breakdown
        status_counts = db.query(
            SafetyIncident.status, func.count(SafetyIncident.id)
        ).group_by(SafetyIncident.status).all()
        status_breakdown = {status: count for status, count in status_counts}
        
        # Calculate category breakdown
        cat_counts = db.query(
            SafetyIncident.category, func.count(SafetyIncident.id)
        ).group_by(SafetyIncident.category).all()
        category_breakdown = {cat: count for cat, count in cat_counts}
        
        # Calculate average risk score
        avg_risk = db.query(func.avg(SafetyIncident.risk_score)).scalar() or 0.0
        
        # High Risk Count (Risk Score >= 9.0)
        high_risk_count = db.query(SafetyIncident).filter(SafetyIncident.risk_score >= 9.0).count()

        return {
            "total_incidents": total_incidents,
            "avg_risk_score": round(float(avg_risk), 2),
            "high_risk_alerts": high_risk_count,
            "status_breakdown": status_breakdown,
            "category_breakdown": category_breakdown
        }
