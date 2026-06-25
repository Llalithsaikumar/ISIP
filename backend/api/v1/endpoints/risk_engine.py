"""
FastAPI endpoint for the unified Risk Engine.

POST /predict
    Accepts sensor telemetry data, runs the combined RandomForest +
    IsolationForest risk pipeline, and returns a structured risk assessment.

This endpoint is the primary inference gateway for the React frontend
and any external integrations consuming safety predictions.
"""

from fastapi import APIRouter, HTTPException, status
from backend.api.schemas.risk_engine import RiskPredictionRequest, RiskPredictionResponse
from backend.services.risk_engine import calculate_risk
from backend.services.alert_engine import check_alerts
from backend.utils.logging import logger

router = APIRouter()


@router.post(
    "/predict",
    response_model=RiskPredictionResponse,
    summary="Run unified safety risk assessment",
    description=(
        "Accepts 7 sensor/operational parameters and returns a composite "
        "risk score blending RandomForest regression (70%) with IsolationForest "
        "anomaly detection (30%). Includes a categorical risk level classification "
        "and checks for rule-based safety alerts."
    ),
    responses={
        200: {
            "description": "Successful risk assessment",
            "content": {
                "application/json": {
                    "example": {
                        "predicted_risk": 82.0,
                        "anomaly_risk": 90.0,
                        "final_risk": 85.0,
                        "risk_level": "CRITICAL",
                        "alerts": [
                          {
                            "alert_type": "GAS_LEAK",
                            "severity": "CRITICAL",
                            "message": "Critical toxic/combustible gas concentration detected: 80.00 ppm"
                          }
                        ]
                    }
                }
            },
        },
        422: {"description": "Validation error — missing or out-of-range fields"},
        500: {"description": "Internal model inference failure"},
    },
)
def predict_risk(payload: RiskPredictionRequest):
    """
    Unified safety risk prediction endpoint.

    Pipeline:
        1. Pydantic validates all input fields (types, ranges, enums).
        2. The validated payload is forwarded to the risk engine.
        3. The risk engine runs RandomForest + IsolationForest inference.
        4. Rule-based checks are evaluated by the alert engine.
        5. A weighted composite score, risk level, and active alerts are returned.
    """
    logger.info(
        f"POST /predict — Incoming request: "
        f"temp={payload.temperature}, gas={payload.gas_level}, "
        f"humidity={payload.humidity}, vibration={payload.vibration}, "
        f"workers={payload.worker_count}, shift={payload.shift}, "
        f"ppe={payload.ppe_compliance}"
    )

    try:
        # Convert Pydantic model to the dict format expected by calculate_risk()
        input_data = {
            "temperature": payload.temperature,
            "gas_level": payload.gas_level,
            "humidity": payload.humidity,
            "vibration": payload.vibration,
            "worker_count": payload.worker_count,
            "shift": payload.shift,
            "ppe_compliance": payload.ppe_compliance,
        }

        result = calculate_risk(input_data)
        
        # Check for safety alerts based on rules
        active_alarms = check_alerts(input_data, final_risk=result["final_risk"])
        result["alerts"] = active_alarms

        logger.info(
            f"POST /predict — Result: "
            f"predicted={result['predicted_risk']}, "
            f"anomaly={result['anomaly_risk']}, "
            f"final={result['final_risk']}, "
            f"level={result['risk_level']}, "
            f"alerts={len(active_alarms)}"
        )

        return result

    except ValueError as e:
        # Input validation errors from the risk engine layer
        logger.warning(f"POST /predict — Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    except FileNotFoundError as e:
        # Model files missing on disk
        logger.error(f"POST /predict — Model not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "ML model files are missing. Please run train_model.py and "
                "anomaly_detection.py before starting the server."
            ),
        )

    except RuntimeError as e:
        # Unexpected inference failures
        logger.error(f"POST /predict — Runtime error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model inference error: {str(e)}",
        )

    except Exception as e:
        # Catch-all for any other unhandled errors
        logger.critical(f"POST /predict — Unhandled exception: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal error occurred during risk assessment.",
        )
