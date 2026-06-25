import json
from typing import Dict, Any, List
from backend.utils.config import settings
from backend.utils.logging import logger
from backend.api.schemas.rca import RCAResponse

class RootCauseAnalysisAgent:
    """
    RCA Agent responsible for parsing environmental parameters, ML risk models,
    and active rule alerts to diagnose the root cause of safety issues.
    """
    @staticmethod
    def analyze_root_cause(
        telemetry: Dict[str, Any],
        risk_score: float,
        anomaly_score: float,
        alerts: List[Dict[str, Any]]
    ) -> RCAResponse:
        ppe_status = "COMPLIANT" if telemetry.get("ppe_compliance") == 1 else "NON-COMPLIANT"
        
        # Check Gemini API Key configuration
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "placeholder_key" and len(settings.GEMINI_API_KEY) > 10:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                from langchain_core.prompts import ChatPromptTemplate
                
                llm = ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash",
                    temperature=0.2,
                    google_api_key=settings.GEMINI_API_KEY
                )
                
                prompt = ChatPromptTemplate.from_messages([
                    ("system", (
                        "You are an AI-powered Root Cause Analysis (RCA) Safety Agent in an industrial plant.\n"
                        "Your task is to analyze telemetry readings, composite risk outputs, IsolationForest anomaly scores, "
                        "and triggered safety alerts to output a structured Root Cause Analysis report.\n\n"
                        "You must diagnose the core failure, identify contributing factors, suggest immediate mitigation actions, "
                        "recommend long-term preventive steps, and assign an overall priority level (LOW, MEDIUM, HIGH, CRITICAL).\n"
                        "Use safety engineering logic: machinery failures, ventilation issues, safety compliance bypasses, or fatigue factors."
                    )),
                    ("human", (
                        "Incident Data:\n"
                        "- Telemetry:\n"
                        "  * Temp: {temp} C\n"
                        "  * Gas: {gas} ppm\n"
                        "  * Humidity: {humidity}%\n"
                        "  * Vibration: {vibration} mm/s\n"
                        "  * Worker Count: {workers}\n"
                        "  * Shift: {shift}\n"
                        "  * PPE Status: {ppe_status}\n"
                        "- Composite Prediction Risk: {risk_score}%\n"
                        "- IsolationForest Anomaly Score: {anomaly_score}%\n"
                        "- Active Alarms: {alerts}\n\n"
                        "Perform the root cause analysis."
                    ))
                ])
                
                structured_llm = llm.with_structured_output(RCAResponse)
                chain = prompt | structured_llm
                
                logger.info("Calling Gemini API for Root Cause Analysis...")
                response = chain.invoke({
                    "temp": telemetry.get("temperature"),
                    "gas": telemetry.get("gas_level"),
                    "humidity": telemetry.get("humidity"),
                    "vibration": telemetry.get("vibration"),
                    "workers": telemetry.get("worker_count"),
                    "shift": telemetry.get("shift"),
                    "ppe_status": ppe_status,
                    "risk_score": risk_score,
                    "anomaly_score": anomaly_score,
                    "alerts": json.dumps(alerts)
                })
                return response
            except Exception as e:
                logger.error(f"Error calling Gemini API for RCA: {str(e)}. Falling back to mock generator.")
        
        # Fallback Mock Generator
        logger.warning("Using Offline Mock Root Cause Analysis fallback.")
        
        temp = telemetry.get("temperature", 25.0)
        gas = telemetry.get("gas_level", 10.0)
        vibration = telemetry.get("vibration", 15.0)
        ppe_compliance = telemetry.get("ppe_compliance", 1)
        
        # Simple logical diagnostics
        causes = []
        factors = []
        immediate = []
        preventive = []
        
        if gas > 85:
            causes.append("gaseous containment or pipeline seal leakage")
            factors.append("Pipeline gasket failure or mechanical exhaust scrubber malfunction.")
            immediate.append("Sound safety sirens and evacuate the zone immediately.")
            immediate.append("Enable auxiliary industrial fans and local ventilation loops.")
            preventive.append("Execute scheduled valve inspections and seal replacements across gas transport channels.")
        
        if temp > 100:
            causes.append("severe mechanical overheating of core machinery components")
            factors.append("High machinery friction or coolant fluid level depletion.")
            immediate.append("Trigger emergency LOTO (Lockout-Tagout) shutdown of overheating equipment.")
            immediate.append("Apply local cooling containment measures.")
            preventive.append("Overhaul machine cooling loops and install automated thermal cutoffs.")
            
        if ppe_compliance == 0:
            causes.append("safety protocol breach with workers unequipped with PPE")
            factors.append("Lack of visual check supervision or safety entry gates bypass.")
            immediate.append("Halt operations in the immediate vicinity and clear non-compliant workers.")
            preventive.append("Install automated computer-vision cameras at entry checkpoints to check helmets and vests.")
            
        if vibration > 75:
            causes.append("unbalanced machine oscillation (vibration fatigue)")
            factors.append("Structural misalignment or structural anchoring looseness.")
            immediate.append("Reduce operating load on high-vibration equipment.")
            preventive.append("Inspect turbine alignment and tighten anchoring structural bolts.")
            
        # Fallback default
        if not causes:
            root_cause = "Operations running within nominal standard safety limits with minor telemetry drifts."
            contributing = ["Standard background noise or sensor calibration variation."]
            immediate = ["Acknowledge telemetry warning and monitor sensor trends."]
            preventive = ["Perform routine calibration audits on environmental sensors."]
            priority = "LOW"
        else:
            root_cause = f"Critical threshold breach caused by " + " compound with ".join(causes) + "."
            contributing = factors
            priority = "CRITICAL" if (risk_score > 75 or gas > 85 or temp > 100) else "HIGH"
            
        # Ensure at least some default actions
        if not immediate:
            immediate.append("Dispatch a safety officer to perform local spot checks.")
        if not preventive:
            preventive.append("Refreshen plant-wide safety guidelines during morning briefs.")
            
        return RCAResponse(
            root_cause=root_cause,
            contributing_factors=contributing,
            immediate_actions=immediate,
            preventive_actions=preventive,
            priority=priority
        )
