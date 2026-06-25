import json
from typing import Dict, Any
from backend.utils.config import settings
from backend.utils.logging import logger
from backend.api.schemas.incident_report import IncidentReportResponse
from backend.services.alert_engine import check_alerts
from backend.services.rca_agent import RootCauseAnalysisAgent

class IncidentReportGenerator:
    """
    Service responsible for generating structured Safety Incident Reports.
    It integrates directly with the AI Root Cause Analysis (RCA) Agent to formulate diagnoses.
    """
    @staticmethod
    def generate_report(
        final_risk: float,
        temperature: float,
        gas_level: float,
        ppe_compliance: int
    ) -> IncidentReportResponse:
        logger.info("Initializing Safety Incident Report Generation...")
        
        # 1. Structure telemetry dictionary representing the conditions
        telemetry = {
            "temperature": temperature,
            "gas_level": gas_level,
            "humidity": 50.0,
            "vibration": 15.0,
            "worker_count": 5,
            "shift": "day",
            "ppe_compliance": ppe_compliance
        }
        
        # 2. Evaluate active warnings/alerts using the Alert Engine
        active_alerts = check_alerts(telemetry, final_risk)
        
        # 3. Call the Root Cause Analysis Agent
        rca_result = RootCauseAnalysisAgent.analyze_root_cause(
            telemetry=telemetry,
            risk_score=final_risk,
            anomaly_score=final_risk * 0.9, # Approximate anomaly score from regressor
            alerts=active_alerts
        )
        
        # 4. Formulate the incident summary statement
        summary = (
            f"Safety Incident flagged with composite risk score of {final_risk}%. "
            f"Priority class assigned: {rca_result.priority}. "
            f"The primary root cause of this incident has been diagnosed as: '{rca_result.root_cause}'."
        )
        
        # 5. Formulate standard SOP recommendations
        sop_rule = rca_result.preventive_actions[0] if rca_result.preventive_actions else "Monitor sensor telemetry continuously."
        recommended_sop = (
            f"Standard Operating Procedure (SOP) Updates:\n"
            f"1. Emergency Alert: Stop work immediately if priority reaches {rca_result.priority}.\n"
            f"2. Primary Remediation: Execute immediate actions: {', '.join(rca_result.immediate_actions)}.\n"
            f"3. Prevention Protocol: Implement long-term control: {sop_rule}"
        )
        
        return IncidentReportResponse(
            incident_summary=summary,
            root_cause_analysis=rca_result.root_cause,
            immediate_actions=rca_result.immediate_actions,
            preventive_actions=rca_result.preventive_actions,
            recommended_sop=recommended_sop
        )
