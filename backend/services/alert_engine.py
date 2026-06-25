"""
Safety Alert Engine — Industrial Safety Intelligence Platform (ISIP)

This service evaluates incoming sensor telemetry and risk engine predictions against
predefined industrial safety thresholds to generate real-time alarms.
Supports multiple simultaneous alerts.
"""

from typing import Dict, Any, List, Optional
from backend.utils.logging import logger

# Threshold values
GAS_THRESHOLD = 85.0
TEMP_THRESHOLD = 100.0
PPE_VIOLATION_VAL = 0
RISK_THRESHOLD = 75.0


def check_alerts(telemetry: Dict[str, Any], final_risk: Optional[float] = None) -> List[Dict[str, str]]:
    """
    Evaluates safety rules on telemetry and risk data.
    Returns a list of active alerts, supporting multiple simultaneous issues.

    Rules:
    - Gas Level > 85 ppm          -> CRITICAL Alert (type: GAS_LEAK)
    - Temperature > 100 C         -> CRITICAL Alert (type: THERMAL_EXCESS)
    - PPE Missing (compliance=0)  -> HIGH Alert     (type: PPE_VIOLATION)
    - Final Risk Score > 75%      -> CRITICAL Alert (type: COMPOSITE_RISK)

    Args:
        telemetry: Dict containing sensor readings (gas_level, temperature, ppe_compliance).
        final_risk: Optional pre-calculated risk score from the risk engine.

    Returns:
        List of Alert dictionaries matching:
        {
            "alert_type": str,
            "severity": str,
            "message": str
        }
    """
    active_alerts = []

    # Rule 1: Gas Level Check
    gas = telemetry.get("gas_level")
    if gas is not None:
        try:
            gas_val = float(gas)
            if gas_val > GAS_THRESHOLD:
                active_alerts.append({
                    "alert_type": "GAS_LEAK",
                    "severity": "CRITICAL",
                    "message": f"Critical toxic/combustible gas concentration detected: {gas_val:.2f} ppm (Threshold: {GAS_THRESHOLD} ppm)"
                })
        except (ValueError, TypeError):
            logger.warning(f"Invalid gas_level value in alert evaluation: {gas}")

    # Rule 2: Temperature Check
    temp = telemetry.get("temperature")
    if temp is not None:
        try:
            temp_val = float(temp)
            if temp_val > TEMP_THRESHOLD:
                active_alerts.append({
                    "alert_type": "THERMAL_EXCESS",
                    "severity": "CRITICAL",
                    "message": f"Critical equipment temperature detected: {temp_val:.2f} C (Threshold: {TEMP_THRESHOLD} C)"
                })
        except (ValueError, TypeError):
            logger.warning(f"Invalid temperature value in alert evaluation: {temp}")

    # Rule 3: PPE Compliance Check
    ppe = telemetry.get("ppe_compliance")
    if ppe is not None:
        try:
            ppe_val = int(ppe)
            if ppe_val == PPE_VIOLATION_VAL:
                active_alerts.append({
                    "alert_type": "PPE_VIOLATION",
                    "severity": "HIGH",
                    "message": "Mandatory Personal Protective Equipment (PPE) protocol breach detected in operations sector."
                })
        except (ValueError, TypeError):
            logger.warning(f"Invalid ppe_compliance value in alert evaluation: {ppe}")

    # Rule 4: Final Risk Score Check
    if final_risk is not None:
        try:
            risk_val = float(final_risk)
            if risk_val > RISK_THRESHOLD:
                active_alerts.append({
                    "alert_type": "COMPOSITE_RISK",
                    "severity": "CRITICAL",
                    "message": f"Critical composite risk hazard levels calculated: {risk_val:.2f}% (Threshold: {RISK_THRESHOLD}%)"
                })
        except (ValueError, TypeError):
            logger.warning(f"Invalid final_risk value in alert evaluation: {final_risk}")

    if active_alerts:
        logger.info(f"Alert Engine generated {len(active_alerts)} active alarms.")

    return active_alerts


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  ISIP ALERT ENGINE -- TEST CASES")
    print("=" * 60)

    test_scenarios = [
        {
            "name": "Normal Safe Telemetry",
            "telemetry": {"temperature": 45.0, "gas_level": 12.0, "ppe_compliance": 1},
            "final_risk": 15.0
        },
        {
            "name": "PPE Violation",
            "telemetry": {"temperature": 50.0, "gas_level": 20.0, "ppe_compliance": 0},
            "final_risk": 35.0
        },
        {
            "name": "Gas Leak & Thermal Synergy (Multiple Alerts)",
            "telemetry": {"temperature": 105.0, "gas_level": 92.0, "ppe_compliance": 1},
            "final_risk": 78.0
        },
        {
            "name": "All Hazards Triggered (Max Alerts)",
            "telemetry": {"temperature": 118.0, "gas_level": 98.0, "ppe_compliance": 0},
            "final_risk": 95.0
        }
    ]

    for scenario in test_scenarios:
        print(f"\nScenario: {scenario['name']}")
        print(f"  Inputs: Telemetry={scenario['telemetry']}, Risk={scenario['final_risk']}")
        alerts = check_alerts(scenario["telemetry"], scenario["final_risk"])
        
        if not alerts:
            print("  Alerts: [ None ]")
        else:
            for idx, alert in enumerate(alerts, 1):
                print(f"  Alert {idx}:")
                print(f"    * Type    : {alert['alert_type']}")
                print(f"    * Severity: {alert['severity']}")
                print(f"    * Message : {alert['message']}")

    print("\n" + "=" * 60)
