import datetime
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from backend.services.risk_engine import calculate_risk
from backend.services.alert_engine import check_alerts
from backend.services.incident_report import IncidentReportGenerator
from backend.services.incident_service import IncidentService
from backend.utils.logging import logger
from backend.api.schemas.demo import DemoScenarioInfo

# Define scenario specifications
SCENARIO_PRESETS = {
    "gas_leak": {
        "telemetry": {
            "temperature": 85.0,
            "gas_level": 95.0,
            "humidity": 55.0,
            "vibration": 20.0,
            "worker_count": 12,
            "shift": "night",
            "ppe_compliance": 1
        },
        "incident_log": {
            "title": "Spontaneous Pipeline Flange Seal Degradation",
            "description": "A sudden rise in hazardous gas concentrations detected in Sector 2 (Boiler Room). The ambient sensor reports gas levels exceeded 95 ppm. Immediate evacuation of non-essential personnel is initiated.",
            "category": "Chemical",
            "severity": "Critical",
            "likelihood": "Certain",
            "department": "Boiler Room",
            "reporter": "Automated Demo System",
            "status": "Open",
            "mitigation_action": "Sounded safety sirens and evacuated the zone immediately. Enabled auxiliary industrial fans."
        }
    },
    "machine_overheating": {
        "telemetry": {
            "temperature": 115.0,
            "gas_level": 25.0,
            "humidity": 45.0,
            "vibration": 85.0,
            "worker_count": 8,
            "shift": "day",
            "ppe_compliance": 1
        },
        "incident_log": {
            "title": "Turbine Core Mechanical Thermal Runaway",
            "description": "High mechanical vibration triggers thermal excess on Turbine #4 bearing housing. Temperature exceeded the critical 100°C threshold, posing mechanical seizure and safety risk.",
            "category": "Mechanical",
            "severity": "Critical",
            "likelihood": "Certain",
            "department": "Generator Hall",
            "reporter": "Automated Demo System",
            "status": "Open",
            "mitigation_action": "Triggered emergency LOTO (Lockout-Tagout) shutdown of overheating equipment."
        }
    },
    "ppe_violation": {
        "telemetry": {
            "temperature": 50.0,
            "gas_level": 15.0,
            "humidity": 50.0,
            "vibration": 15.0,
            "worker_count": 22,
            "shift": "day",
            "ppe_compliance": 0
        },
        "incident_log": {
            "title": "Operations Zone PPE Compliance Audit Failure",
            "description": "Automated optical safety barrier flags safety vest and helmet violation for workers in operations Zone C. Work halt command dispatched until compliance is verified.",
            "category": "PPE Violation",
            "severity": "High",
            "likelihood": "Likely",
            "department": "Loading Bay",
            "reporter": "Automated Demo System",
            "status": "Open",
            "mitigation_action": "Halted operations in the immediate vicinity and cleared non-compliant workers."
        }
    },
    "combined_catastrophe": {
        "telemetry": {
            "temperature": 118.0,
            "gas_level": 97.0,
            "humidity": 35.0,
            "vibration": 92.0,
            "worker_count": 35,
            "shift": "night",
            "ppe_compliance": 0
        },
        "incident_log": {
            "title": "Compound Reactor Overheat and Scrubber Valve Failure",
            "description": "Catastrophic co-occurring failure: critical reactor temperature exceeds 115°C, gas containment pressure relief valve breaches reporting 97 ppm gas levels, while workers are found in zone without correct safety PPE gear.",
            "category": "Combined Catastrophe",
            "severity": "Critical",
            "likelihood": "Certain",
            "department": "Secondary Reactor",
            "reporter": "Automated Demo System",
            "status": "Open",
            "mitigation_action": "Sounded safety sirens, evacuated the zone, triggered reactor emergency shutdown, and halted operations."
        }
    }
}

SCENARIO_METADATA = [
    DemoScenarioInfo(
        key="gas_leak",
        title="Scenario 1: Gas Leak",
        description="Simulates a pipeline rupture leaking combustible gases. Triggers CRITICAL GAS_LEAK alarm.",
        target_zone="Zone B - Boiler Room",
        expected_hazards=["Gas Leak Alert", "Composite Risk Warning"]
    ),
    DemoScenarioInfo(
        key="machine_overheating",
        title="Scenario 2: Machine Overheating",
        description="Simulates bearing failure and thermal runaway on generator turbines. Triggers CRITICAL THERMAL_EXCESS alarm.",
        target_zone="Zone A - Generator Hall",
        expected_hazards=["Thermal Warning", "Vibration Alert", "Composite Risk Warning"]
    ),
    DemoScenarioInfo(
        key="ppe_violation",
        title="Scenario 3: PPE Violation",
        description="Simulates non-compliant staff entering operations area without helmet and vest. Triggers HIGH PPE_VIOLATION alarm.",
        target_zone="Zone C - Loading Bay 3",
        expected_hazards=["PPE Violation Alert"]
    ),
    DemoScenarioInfo(
        key="combined_catastrophe",
        title="Scenario 4: Combined Catastrophic Event",
        description="Simulates co-occurring thermal runaway, combustible gas leak, and active PPE compliance breaches. Triggers ALL safety alarms simultaneously.",
        target_zone="Zone D - Secondary Reactor",
        expected_hazards=["Gas Leak Alert", "Thermal Warning", "Vibration Alert", "PPE Violation Alert", "Composite Risk Warning"]
    )
]

class DemoModeService:
    """
    Manages Demo Mode scenario presets and executes the unified safety assessment chain.
    """

    @staticmethod
    def get_available_scenarios() -> List[DemoScenarioInfo]:
        """
        Returns metadata for all available demo scenarios.
        """
        return SCENARIO_METADATA

    @staticmethod
    def run_scenario(scenario_key: str, db: Session) -> Dict[str, Any]:
        """
        Loads the scenario parameters, evaluates risk/anomaly/alerts,
        generates the AI Incident report & RCA, saves the incident to the database,
        and returns the consolidated outcomes.
        """
        logger.info(f"Executing Demo Mode scenario: {scenario_key}")
        
        if scenario_key not in SCENARIO_PRESETS:
            raise ValueError(f"Unknown scenario key: {scenario_key}. Choose from: {list(SCENARIO_PRESETS.keys())}")
            
        preset = SCENARIO_PRESETS[scenario_key]
        telemetry_inputs = preset["telemetry"]
        
        # 1. Run Risk Engine evaluation
        risk_result = calculate_risk(telemetry_inputs)
        final_risk = risk_result["final_risk"]
        
        # 2. Check for alerts
        alerts_list = check_alerts(telemetry_inputs, final_risk)
        
        # 3. Generate AI Safety Incident report & RCA
        report = IncidentReportGenerator.generate_report(
            final_risk=final_risk,
            temperature=telemetry_inputs["temperature"],
            gas_level=telemetry_inputs["gas_level"],
            ppe_compliance=telemetry_inputs["ppe_compliance"]
        )
        
        # 4. Save Safety Incident in SQLite DB
        incident_log_data = preset["incident_log"].copy()
        # Override the risk score in the incident log with the exact ML-evaluated risk score
        # Scale risk score to a 0-16 risk matrix score range for consistency or save out of 100
        incident_log_data["risk_score"] = final_risk
        
        # Create safety incident record
        logged_incident = IncidentService.create_incident(db, incident_log_data)
        logger.info(f"Demo Mode logged incident successfully in database (ID: {logged_incident.id})")
        
        # Add risk/anomaly score details to the telemetry dict returned to frontend
        full_telemetry = telemetry_inputs.copy()
        full_telemetry.update({
            "risk_score": final_risk,
            "anomaly_score": risk_result["anomaly_risk"],
            "risk_level": risk_result["risk_level"]
        })
        
        return {
            "telemetry": full_telemetry,
            "alerts": alerts_list,
            "incident_report": report,
            "logged_incident": logged_incident
        }
