import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from backend.models.database import Base

class SafetyIncident(Base):
    """
    SQLAlchemy Database Model for Safety Incident Reports.
    Represents industrial hazards, safety logs, and incident metrics.
    """
    __tablename__ = "safety_incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    # Category of the incident (e.g., Chemical, Electrical, Mechanical, Slippage, PPE Violation)
    category = Column(String(50), nullable=False, index=True)
    
    # Severity and Likelihood fields for Risk Matrix calculations
    severity = Column(String(20), nullable=False)    # Low, Medium, High, Critical
    likelihood = Column(String(20), nullable=False)  # Rare, Possible, Likely, Certain
    
    # Numerical risk rating (often severity_score * likelihood_score)
    risk_score = Column(Float, nullable=True)
    
    # Administrative tracking
    department = Column(String(50), nullable=False, index=True)
    reporter = Column(String(100), nullable=False)
    status = Column(String(20), default="Open", nullable=False) # Open, In Progress, Resolved, Closed
    
    # Resolutions & Actions
    mitigation_action = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    def to_dict(self):
        """Helper to convert database model to dictionary representation."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "severity": self.severity,
            "likelihood": self.likelihood,
            "risk_score": self.risk_score,
            "department": self.department,
            "reporter": self.reporter,
            "status": self.status,
            "mitigation_action": self.mitigation_action,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
