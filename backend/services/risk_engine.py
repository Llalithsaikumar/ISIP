"""
Unified Risk Engine for Industrial Safety Intelligence Platform (ISIP)

Combines two ML models into a single risk assessment pipeline:
    1. RandomForestRegressor (model.pkl)  — Predicts a base risk score (0-100)
       from all sensor and operational features.
    2. IsolationForest (anomaly_model.pkl) — Produces an anomaly score indicating
       how far the reading deviates from learned normal patterns.

The two scores are blended using a weighted formula:
    final_risk = 0.7 * predicted_risk + 0.3 * anomaly_risk

Risk Level Classification:
    0  - 25  : LOW
    26 - 50  : MEDIUM
    51 - 75  : HIGH
    76 - 100 : CRITICAL

Input Format (dict):
    {
        "temperature":    float,  # 20-120 (degrees C)
        "gas_level":      float,  # 0-100  (ppm)
        "humidity":       float,  # 10-100 (percent)
        "vibration":      float,  # 0-100  (mm/s)
        "worker_count":   int,    # 1-50
        "shift":          str,    # "day" or "night"
        "ppe_compliance": int     # 0 or 1
    }

Output Format (dict):
    {
        "predicted_risk": float,      # Raw RF regression output (0-100)
        "anomaly_risk":   float,      # Normalized anomaly score (0-100)
        "final_risk":     float,      # Weighted composite (0-100)
        "risk_level":     str         # LOW / MEDIUM / HIGH / CRITICAL
    }
"""

import os
import joblib
import numpy as np
import pandas as pd
from backend.utils.logging import logger
from backend.services.anomaly_detection import detect_anomaly

# ---------------------------------------------------------------------------
# Default model paths (relative to the project root)
# ---------------------------------------------------------------------------
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

RF_MODEL_PATH = os.path.join(DATA_DIR, "model.pkl")
ENCODER_PATH = os.path.join(DATA_DIR, "encoder.pkl")

# ---------------------------------------------------------------------------
# Risk level thresholds
# ---------------------------------------------------------------------------
RISK_LEVELS = [
    (25,  "LOW"),
    (50,  "MEDIUM"),
    (75,  "HIGH"),
    (100, "CRITICAL"),
]

# Blending weights for the composite risk formula
WEIGHT_PREDICTED = 0.7
WEIGHT_ANOMALY = 0.3

# ---------------------------------------------------------------------------
# Required input keys and their expected types / ranges
# ---------------------------------------------------------------------------
REQUIRED_KEYS = {
    "temperature":    (float, int),
    "gas_level":      (float, int),
    "humidity":       (float, int),
    "vibration":      (float, int),
    "worker_count":   (float, int),
    "shift":          (str,),
    "ppe_compliance": (float, int),
}

# Feature order that the RandomForest model was trained on
# (must match the column order from train_model.py)
RF_FEATURE_ORDER = [
    "temperature",
    "gas_level",
    "humidity",
    "vibration",
    "worker_count",
    "shift",          # Will be label-encoded before inference
    "ppe_compliance",
]

# Features used by the IsolationForest anomaly detector
ANOMALY_FEATURES = ["temperature", "gas_level", "humidity", "vibration"]


# ---------------------------------------------------------------------------
# Model Loader (Singleton Cache)
# ---------------------------------------------------------------------------
_rf_model = None
_label_encoders = None


def _load_rf_model():
    """
    Loads the RandomForestRegressor and its associated LabelEncoders from disk.
    Uses module-level caching so the deserialization happens only once.

    Raises:
        FileNotFoundError: If model.pkl or encoder.pkl do not exist and
                           cannot be auto-generated.
    """
    global _rf_model, _label_encoders

    if _rf_model is not None and _label_encoders is not None:
        return _rf_model, _label_encoders

    # Verify model files exist
    if not os.path.exists(RF_MODEL_PATH):
        raise FileNotFoundError(
            f"RandomForest model not found at {RF_MODEL_PATH}. "
            "Run train_model.py first to train and export the model."
        )
    if not os.path.exists(ENCODER_PATH):
        raise FileNotFoundError(
            f"LabelEncoder file not found at {ENCODER_PATH}. "
            "Run train_model.py first to train and export encoders."
        )

    logger.info(f"Loading RandomForest model from: {RF_MODEL_PATH}")
    _rf_model = joblib.load(RF_MODEL_PATH)

    logger.info(f"Loading LabelEncoders from: {ENCODER_PATH}")
    _label_encoders = joblib.load(ENCODER_PATH)

    logger.info("Risk engine models loaded successfully.")
    return _rf_model, _label_encoders


# ---------------------------------------------------------------------------
# Input Validation
# ---------------------------------------------------------------------------

def _validate_input(input_data: dict) -> None:
    """
    Validates that the input dictionary contains all required keys with
    correct types and reasonable value ranges.

    Args:
        input_data: The raw sensor reading dictionary.

    Raises:
        ValueError: If any key is missing, has the wrong type, or is out of
                    expected bounds.
    """
    # Check for missing keys
    missing = [k for k in REQUIRED_KEYS if k not in input_data]
    if missing:
        raise ValueError(
            f"Missing required input keys: {missing}. "
            f"Expected: {list(REQUIRED_KEYS.keys())}"
        )

    # Check types
    for key, expected_types in REQUIRED_KEYS.items():
        val = input_data[key]
        if not isinstance(val, expected_types):
            raise ValueError(
                f"Invalid type for '{key}': got {type(val).__name__}, "
                f"expected one of {[t.__name__ for t in expected_types]}."
            )

    # Range validations for numeric fields
    bounds = {
        "temperature":    (20, 120),
        "gas_level":      (0, 100),
        "humidity":       (10, 100),
        "vibration":      (0, 100),
        "worker_count":   (1, 50),
        "ppe_compliance": (0, 1),
    }

    for key, (lo, hi) in bounds.items():
        val = input_data[key]
        if not (lo <= val <= hi):
            raise ValueError(
                f"Value for '{key}' is out of range: {val}. "
                f"Expected [{lo}, {hi}]."
            )

    # Validate shift values
    if input_data["shift"] not in ("day", "night"):
        raise ValueError(
            f"Invalid value for 'shift': '{input_data['shift']}'. "
            "Expected 'day' or 'night'."
        )


# ---------------------------------------------------------------------------
# Risk Level Classifier
# ---------------------------------------------------------------------------

def _classify_risk_level(score: float) -> str:
    """
    Maps a numeric risk score (0-100) to a categorical risk level label.

    Thresholds:
        0  - 25  : LOW
        26 - 50  : MEDIUM
        51 - 75  : HIGH
        76 - 100 : CRITICAL

    Args:
        score: Composite risk score in range [0, 100].

    Returns:
        Risk level string: "LOW", "MEDIUM", "HIGH", or "CRITICAL".
    """
    for threshold, level in RISK_LEVELS:
        if score <= threshold:
            return level
    # Fallback for edge cases above 100 (after rounding)
    return "CRITICAL"


# ---------------------------------------------------------------------------
# Core Risk Calculation Function
# ---------------------------------------------------------------------------

def calculate_risk(input_data: dict) -> dict:
    """
    Runs the full risk assessment pipeline on a single sensor reading.

    Pipeline Steps:
        1. Validate input data for completeness, types, and ranges.
        2. Encode categorical variables (shift: day/night -> 0/1).
        3. Run RandomForestRegressor inference to get predicted_risk (0-100).
        4. Run IsolationForest inference to get anomaly_score (0-1).
        5. Scale the anomaly score to 0-100 for uniform blending.
        6. Compute the final weighted composite risk score.
        7. Classify the composite score into a risk level label.

    Args:
        input_data: Dictionary containing all 7 sensor/operational features.

    Returns:
        Dictionary with predicted_risk, anomaly_risk, final_risk, and risk_level.

    Raises:
        ValueError: If input validation fails.
        FileNotFoundError: If required model files are not found on disk.
        RuntimeError: If model inference encounters an unexpected error.
    """
    # ------------------------------------------------------------------
    # Step 1: Validate input data
    # ------------------------------------------------------------------
    try:
        _validate_input(input_data)
    except ValueError as e:
        logger.error(f"Input validation failed: {e}")
        raise

    # ------------------------------------------------------------------
    # Step 2: Load models (cached after first call)
    # ------------------------------------------------------------------
    try:
        rf_model, label_encoders = _load_rf_model()
    except FileNotFoundError as e:
        logger.error(f"Model loading failed: {e}")
        raise

    # ------------------------------------------------------------------
    # Step 3: Prepare features for RandomForest prediction
    # ------------------------------------------------------------------
    try:
        # Build a DataFrame row matching the training feature order
        row = {}
        for feat in RF_FEATURE_ORDER:
            if feat == "shift":
                # Encode 'shift' using the saved LabelEncoder (day=0, night=1)
                encoder = label_encoders.get("shift")
                if encoder is None:
                    raise RuntimeError(
                        "LabelEncoder for 'shift' not found in encoder.pkl."
                    )
                row[feat] = encoder.transform([input_data[feat]])[0]
            else:
                row[feat] = float(input_data[feat])

        # Create a single-row DataFrame with correct column names
        # to avoid sklearn feature-name warnings
        rf_input = pd.DataFrame([row], columns=RF_FEATURE_ORDER)

    except Exception as e:
        logger.error(f"Feature preparation failed: {e}")
        raise RuntimeError(f"Feature preparation error: {e}") from e

    # ------------------------------------------------------------------
    # Step 4: RandomForest regression prediction (predicted_risk: 0-100)
    # ------------------------------------------------------------------
    try:
        predicted_risk_raw = rf_model.predict(rf_input)[0]
        # Clamp to valid range in case of minor extrapolation drift
        predicted_risk = float(np.clip(predicted_risk_raw, 0.0, 100.0))
        logger.debug(f"RF predicted risk: {predicted_risk:.2f}")
    except Exception as e:
        logger.error(f"RandomForest prediction failed: {e}")
        raise RuntimeError(f"RF prediction error: {e}") from e

    # ------------------------------------------------------------------
    # Step 5: IsolationForest anomaly detection (anomaly_score: 0-1)
    # ------------------------------------------------------------------
    try:
        anomaly_input = {feat: input_data[feat] for feat in ANOMALY_FEATURES}
        anomaly_result = detect_anomaly(anomaly_input)
        # anomaly_score is normalized to [0, 1] by detect_anomaly
        anomaly_score_normalized = anomaly_result["anomaly_score"]
        # Scale to 0-100 for uniform blending with the RF prediction
        anomaly_risk = float(anomaly_score_normalized * 100.0)
        logger.debug(
            f"Anomaly score: {anomaly_score_normalized:.4f} "
            f"(scaled to {anomaly_risk:.2f}/100)"
        )
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}")
        raise RuntimeError(f"Anomaly detection error: {e}") from e

    # ------------------------------------------------------------------
    # Step 6: Compute the weighted composite risk score
    # ------------------------------------------------------------------
    #   final_risk = 0.7 * predicted_risk + 0.3 * anomaly_risk
    #
    #   Rationale:
    #     - The RF model captures learned feature interactions and accounts
    #       for all 7 input dimensions, so it receives the higher weight.
    #     - The anomaly detector adds a safety net by boosting the score
    #       when sensor readings fall outside historical norms.
    final_risk = round(
        WEIGHT_PREDICTED * predicted_risk + WEIGHT_ANOMALY * anomaly_risk,
        2,
    )
    final_risk = float(np.clip(final_risk, 0.0, 100.0))

    # ------------------------------------------------------------------
    # Step 7: Classify into a risk level label
    # ------------------------------------------------------------------
    risk_level = _classify_risk_level(final_risk)

    logger.info(
        f"Risk Engine Result -- "
        f"Predicted: {predicted_risk:.2f}, "
        f"Anomaly: {anomaly_risk:.2f}, "
        f"Final: {final_risk:.2f}, "
        f"Level: {risk_level}"
    )

    return {
        "predicted_risk": round(predicted_risk, 2),
        "anomaly_risk": round(anomaly_risk, 2),
        "final_risk": final_risk,
        "risk_level": risk_level,
    }


# ---------------------------------------------------------------------------
# CLI Entry Point — Run sample risk evaluations
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  ISIP RISK ENGINE -- SAMPLE EVALUATIONS")
    print("=" * 60)

    test_cases = [
        {
            "label": "Safe Conditions (Low Risk)",
            "data": {
                "temperature": 35.0, "gas_level": 10.0, "humidity": 50.0,
                "vibration": 15.0, "worker_count": 5, "shift": "day",
                "ppe_compliance": 1,
            },
        },
        {
            "label": "Moderate Conditions (Medium Risk)",
            "data": {
                "temperature": 70.0, "gas_level": 50.0, "humidity": 60.0,
                "vibration": 45.0, "worker_count": 20, "shift": "day",
                "ppe_compliance": 1,
            },
        },
        {
            "label": "Elevated Danger (High Risk)",
            "data": {
                "temperature": 100.0, "gas_level": 80.0, "humidity": 40.0,
                "vibration": 70.0, "worker_count": 35, "shift": "night",
                "ppe_compliance": 0,
            },
        },
        {
            "label": "Extreme Danger (Critical Risk)",
            "data": {
                "temperature": 118.0, "gas_level": 98.0, "humidity": 95.0,
                "vibration": 97.0, "worker_count": 48, "shift": "night",
                "ppe_compliance": 0,
            },
        },
    ]

    for case in test_cases:
        print(f"\n  --- {case['label']} ---")
        try:
            result = calculate_risk(case["data"])
            print(f"    Predicted Risk : {result['predicted_risk']:.2f}")
            print(f"    Anomaly Risk   : {result['anomaly_risk']:.2f}")
            print(f"    Final Risk     : {result['final_risk']:.2f}")
            print(f"    Risk Level     : {result['risk_level']}")
        except Exception as e:
            print(f"    ERROR: {e}")

    print("\n" + "=" * 60)
