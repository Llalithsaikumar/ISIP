"""
Anomaly Detection Module for Industrial Safety Intelligence Platform (ISIP)

Uses scikit-learn's IsolationForest algorithm to detect anomalous sensor readings
in industrial environments. IsolationForest works by randomly selecting a feature
and then randomly selecting a split value between the max and min values of that
feature. Anomalies require fewer splits to isolate, resulting in shorter path
lengths in the tree structure — this is the core intuition behind the algorithm.

Features used for anomaly detection:
    - temperature  : Equipment / ambient temperature (°C)
    - gas_level    : Toxic or combustible gas concentration (ppm)
    - humidity     : Relative humidity percentage (%)
    - vibration    : Machine oscillation intensity (mm/s)

Outputs:
    - anomaly_score : Continuous score where lower (more negative) = more anomalous
    - is_anomaly    : Boolean flag indicating whether the reading is anomalous
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from backend.utils.logging import logger

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------

# Features used by the IsolationForest model for anomaly detection
ANOMALY_FEATURES = ["temperature", "gas_level", "humidity", "vibration"]

# Default paths relative to the backend working directory
DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "anomaly_model.pkl"
)
DEFAULT_DATASET_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "industrial_safety.csv"
)

# IsolationForest hyperparameters
# contamination: expected proportion of anomalies in the dataset (~5%)
# n_estimators: number of base estimators (isolation trees) in the ensemble
# max_samples: number of samples drawn to train each base estimator
# random_state: seed for reproducibility
CONTAMINATION = 0.05
N_ESTIMATORS = 100
MAX_SAMPLES = "auto"
RANDOM_STATE = 42


# ---------------------------------------------------------------------------
# Training Function
# ---------------------------------------------------------------------------

def train_anomaly_model(
    dataset_path: str = DEFAULT_DATASET_PATH,
    model_path: str = DEFAULT_MODEL_PATH,
) -> IsolationForest:
    """
    Trains an IsolationForest model on historical sensor telemetry data.

    The model learns the "normal" distribution of sensor readings so it can
    flag future readings that deviate significantly as anomalous.

    Args:
        dataset_path: Absolute path to the industrial_safety.csv file.
        model_path:   Absolute path where the trained model will be serialized.

    Returns:
        The fitted IsolationForest model instance.

    Raises:
        FileNotFoundError: If the source CSV dataset does not exist.
    """
    logger.info("Starting IsolationForest anomaly detection model training...")

    # 1. Load the source dataset
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(
            f"Training dataset not found at {dataset_path}. "
            "Run generate_dataset.py first to create industrial_safety.csv."
        )

    df = pd.read_csv(dataset_path)
    logger.info(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns.")

    # 2. Extract only the sensor features relevant to anomaly detection
    #    We intentionally exclude categorical columns (shift, ppe_compliance)
    #    and the target variable (risk_score) — the model should learn purely
    #    from raw sensor telemetry patterns.
    X = df[ANOMALY_FEATURES].copy()
    logger.info(f"Selected features for training: {ANOMALY_FEATURES}")

    # 3. Validate that no null values exist in the selected features
    null_counts = X.isnull().sum()
    if null_counts.any():
        logger.warning(f"Null values detected in features:\n{null_counts[null_counts > 0]}")
        X = X.dropna()
        logger.info(f"Dropped null rows. Remaining: {len(X)} rows.")

    # 4. Initialize and fit the IsolationForest model
    #    - contamination=0.05 tells the model that ~5% of historical readings
    #      are expected to be anomalous, which calibrates the decision threshold.
    #    - n_estimators=100 builds 100 isolation trees for robust ensemble voting.
    #    - random_state=42 ensures reproducible results across runs.
    model = IsolationForest(
        n_estimators=N_ESTIMATORS,
        contamination=CONTAMINATION,
        max_samples=MAX_SAMPLES,
        random_state=RANDOM_STATE,
        n_jobs=-1,  # Use all available CPU cores for parallel tree construction
    )

    model.fit(X)
    logger.info("IsolationForest model fitting complete.")

    # 5. Log training summary statistics
    #    decision_function returns the anomaly score for training data:
    #    negative scores indicate anomalies, positive scores indicate normal points.
    train_scores = model.decision_function(X)
    train_predictions = model.predict(X)
    n_anomalies = (train_predictions == -1).sum()
    n_normal = (train_predictions == 1).sum()

    logger.info(
        f"Training Summary — Normal: {n_normal}, Anomalies: {n_anomalies} "
        f"({n_anomalies / len(X) * 100:.2f}%)"
    )
    logger.info(
        f"Score Statistics — Mean: {train_scores.mean():.4f}, "
        f"Std: {train_scores.std():.4f}, "
        f"Min: {train_scores.min():.4f}, Max: {train_scores.max():.4f}"
    )

    # 6. Serialize the trained model to disk using joblib
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(model, model_path)
    logger.info(f"Anomaly detection model saved to: {model_path}")

    return model


# ---------------------------------------------------------------------------
# Model Loader (Singleton Pattern)
# ---------------------------------------------------------------------------

# Module-level cache to avoid reloading the model on every inference call
_cached_model: IsolationForest | None = None


def _load_model(model_path: str = DEFAULT_MODEL_PATH) -> IsolationForest:
    """
    Loads the serialized IsolationForest model from disk.
    If the model file does not exist, triggers automatic training
    from the dataset as a self-healing fallback.

    Uses a module-level cache so the model is loaded only once per process.

    Args:
        model_path: Absolute path to the anomaly_model.pkl file.

    Returns:
        The loaded (or freshly trained) IsolationForest model.
    """
    global _cached_model

    if _cached_model is not None:
        return _cached_model

    if os.path.exists(model_path):
        logger.info(f"Loading anomaly model from: {model_path}")
        _cached_model = joblib.load(model_path)
        logger.info("Anomaly detection model loaded successfully.")
    else:
        # Self-healing: automatically train the model if .pkl is missing
        logger.warning(
            f"Anomaly model not found at {model_path}. "
            "Training a new model automatically..."
        )
        _cached_model = train_anomaly_model(model_path=model_path)

    return _cached_model


# ---------------------------------------------------------------------------
# Inference Function
# ---------------------------------------------------------------------------

def detect_anomaly(input_data: dict) -> dict:
    """
    Evaluates a single sensor reading against the trained IsolationForest model
    and returns an anomaly assessment.

    How it works:
        1. The input dictionary is validated for required feature keys.
        2. Feature values are assembled into a NumPy array matching the
           training feature order.
        3. The model's `decision_function` computes a continuous anomaly score:
           - Negative scores → anomalous (farther from normal distribution)
           - Positive scores → normal (within learned distribution)
        4. The model's `predict` method returns:
           -  1 = normal reading
           - -1 = anomalous reading
        5. The raw anomaly score is normalized to a [0, 1] scale where:
           - 0.0 = completely normal
           - 1.0 = extreme anomaly

    Args:
        input_data: Dictionary with sensor reading values, e.g.:
            {
                "temperature": 95.0,
                "gas_level": 88.5,
                "humidity": 30.0,
                "vibration": 92.0
            }

    Returns:
        Dictionary containing the anomaly assessment:
            {
                "anomaly_score": float,  # Normalized 0-1 score (higher = more anomalous)
                "is_anomaly": bool       # True if the reading is flagged as anomalous
            }

    Raises:
        ValueError: If any required feature key is missing from input_data.
    """
    # 1. Validate that all required feature keys are present
    missing_keys = [key for key in ANOMALY_FEATURES if key not in input_data]
    if missing_keys:
        raise ValueError(
            f"Missing required feature keys in input_data: {missing_keys}. "
            f"Expected keys: {ANOMALY_FEATURES}"
        )

    # 2. Load the trained model (uses cached version after first call)
    model = _load_model()

    # 3. Assemble input features into a 2D NumPy array
    #    Shape must be (1, n_features) for a single-sample prediction.
    feature_values = pd.DataFrame(
        [[float(input_data[feat]) for feat in ANOMALY_FEATURES]],
        columns=ANOMALY_FEATURES,
    )

    # 4. Compute the raw anomaly score using decision_function
    #    The IsolationForest decision_function returns the anomaly score
    #    of the input samples. The lower the score, the more abnormal.
    #    Negative scores represent outliers, positive scores represent inliers.
    raw_score = model.decision_function(feature_values)[0]

    # 5. Predict anomaly label: 1 = normal, -1 = anomaly
    prediction = model.predict(feature_values)[0]
    is_anomaly = bool(prediction == -1)

    # 6. Normalize the raw score to a human-readable 0-1 scale
    #    IsolationForest scores typically range from about -0.5 to 0.5.
    #    We apply a sigmoid-like normalization:
    #      - Clamp raw score to [-0.5, 0.5]
    #      - Map to [0, 1] where 1.0 = most anomalous
    clamped = np.clip(raw_score, -0.5, 0.5)
    normalized_score = round(float(1.0 - (clamped + 0.5)), 4)

    logger.info(
        f"Anomaly Detection — Input: {input_data}, "
        f"Raw Score: {raw_score:.4f}, "
        f"Normalized: {normalized_score:.4f}, "
        f"Is Anomaly: {is_anomaly}"
    )

    return {
        "anomaly_score": normalized_score,
        "is_anomaly": is_anomaly,
    }


# ---------------------------------------------------------------------------
# CLI Entry Point — Train and test the model when run directly
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Train the model from the generated dataset
    trained_model = train_anomaly_model()

    # Run test predictions on sample sensor readings
    print("\n" + "=" * 55)
    print("  ANOMALY DETECTION — SAMPLE PREDICTIONS")
    print("=" * 55)

    test_cases = [
        # Normal operating conditions
        {
            "label": "Normal Operation",
            "data": {"temperature": 55.0, "gas_level": 20.0, "humidity": 50.0, "vibration": 30.0},
        },
        # Moderately elevated readings
        {
            "label": "Elevated Gas + Temperature",
            "data": {"temperature": 90.0, "gas_level": 75.0, "humidity": 40.0, "vibration": 50.0},
        },
        # Extreme anomaly: all sensors at dangerous levels
        {
            "label": "Critical Anomaly (All High)",
            "data": {"temperature": 119.0, "gas_level": 99.0, "humidity": 98.0, "vibration": 99.0},
        },
        # Edge case: very low readings (unusual inactivity)
        {
            "label": "Suspicious Inactivity (All Low)",
            "data": {"temperature": 20.5, "gas_level": 0.5, "humidity": 10.5, "vibration": 0.5},
        },
    ]

    for case in test_cases:
        result = detect_anomaly(case["data"])
        flag = "[!] ANOMALY" if result["is_anomaly"] else "[OK] NORMAL"
        print(f"\n  [{flag}] {case['label']}")
        print(f"    Input     : {case['data']}")
        print(f"    Score     : {result['anomaly_score']}")
        print(f"    Is Anomaly: {result['is_anomaly']}")

    print("\n" + "=" * 55)
