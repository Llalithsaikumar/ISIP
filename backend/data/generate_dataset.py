import os
import numpy as np
import pandas as pd
from backend.utils.logging import logger

def generate_industrial_safety_dataset(
    output_path: str = "./industrial_safety.csv", 
    num_rows: int = 100000, 
    seed: int = 42
):
    """
    Generates a realistic synthetic dataset for industrial safety monitoring.
    Uses reproducible random seeding, realistic safety rules, and validation checks.
    """
    logger.info(f"Initializing safety dataset generation. Target rows: {num_rows}, Seed: {seed}")
    
    # Set reproducible seed for numpy random generators
    np.random.seed(seed)

    # 1. Generate Raw Parameters
    # Temperature: float between 20°C and 120°C
    temperature = np.random.uniform(20.0, 120.0, num_rows)
    
    # Gas Level: float between 0 ppm and 100 ppm
    gas_level = np.random.uniform(0.0, 100.0, num_rows)
    
    # Humidity: float between 10% and 100%
    humidity = np.random.uniform(10.0, 100.0, num_rows)
    
    # Vibration: float between 0 mm/s and 100 mm/s (representing machine oscillation)
    vibration = np.random.uniform(0.0, 100.0, num_rows)
    
    # Worker Count: int between 1 and 50 in the sector zone
    worker_count = np.random.randint(1, 51, num_rows)
    
    # Shift: categorical (day/night) with 60% day, 40% night probability
    shift = np.random.choice(["day", "night"], size=num_rows, p=[0.6, 0.4])
    
    # PPE Compliance: binary (0 = Non-compliant, 1 = Compliant) with 90% compliance baseline
    ppe_compliance = np.random.choice([0, 1], size=num_rows, p=[0.1, 0.9])

    # 2. Calculate Risk Score (0-100) using Industrial Safety Rules
    logger.info("Computing risk scores based on domain safety logic...")
    
    # Normalizing inputs to [0, 1] for relative weight calculation
    temp_norm = (temperature - 20) / 100.0
    gas_norm = gas_level / 100.0
    vib_norm = vibration / 100.0
    worker_norm = (worker_count - 1) / 49.0
    
    # Base risk score starts from 5.0 (minimal floor background hazard level)
    base_score = 5.0
    
    # Rule 1: High gas + high temperature interaction (combustible/toxic risk synergy)
    # If both temp and gas are high, risk rises non-linearly
    gas_temp_synergy = temp_norm * gas_norm * 45.0  # Up to +45 risk points
    
    # Rule 2: Vibration hazard (heavy equipment mechanical fatigue)
    vibration_contrib = vib_norm * 15.0  # Up to +15 risk points
    
    # Rule 3: Missing PPE compliance (severe safety violation)
    # Adds a flat +20 risk penalty if any workers are violating PPE mandates
    ppe_penalty = (1 - ppe_compliance) * 20.0  # Up to +20 risk points
    
    # Rule 4: Night shift hazard (fatigue and lower response times)
    shift_penalty = np.where(shift == "night", 5.0, 0.0)  # Up to +5 risk points
    
    # Rule 5: Worker density exposure
    # Higher worker count under hazardous conditions (vibration or gas) compounds total exposure
    exposure_factor = worker_norm * (gas_norm * 0.5 + vib_norm * 0.5) * 10.0  # Up to +10 risk points

    # Calculate raw score summing components
    raw_risk = base_score + gas_temp_synergy + vibration_contrib + ppe_penalty + shift_penalty + exposure_factor
    
    # Add minor Gaussian noise to model real-world variances and telemetry noise
    noise = np.random.normal(0, 1.5, num_rows)
    risk_score = raw_risk + noise
    
    # Clip risk score strictly to range [0.0, 100.0]
    risk_score = np.clip(risk_score, 0.0, 100.0)

    # 3. Create DataFrame
    df = pd.DataFrame({
        "temperature": np.round(temperature, 2),
        "gas_level": np.round(gas_level, 2),
        "humidity": np.round(humidity, 2),
        "vibration": np.round(vibration, 2),
        "worker_count": worker_count,
        "shift": shift,
        "ppe_compliance": ppe_compliance,
        "risk_score": np.round(risk_score, 2)
    })

    # 4. Data Validation Checks
    logger.info("Starting automated dataset validation checks...")
    
    # Check 1: Row count
    assert len(df) == num_rows, f"Validation Failed: Expected {num_rows} rows, got {len(df)}"
    
    # Check 2: Value boundaries
    assert df["temperature"].between(20, 120).all(), "Validation Failed: temperature value out of bounds"
    assert df["gas_level"].between(0, 100).all(), "Validation Failed: gas_level value out of bounds"
    assert df["humidity"].between(10, 100).all(), "Validation Failed: humidity value out of bounds"
    assert df["vibration"].between(0, 100).all(), "Validation Failed: vibration value out of bounds"
    assert df["worker_count"].between(1, 50).all(), "Validation Failed: worker_count value out of bounds"
    assert set(df["shift"].unique()) == {"day", "night"}, "Validation Failed: Invalid values in shift column"
    assert set(df["ppe_compliance"].unique()).issubset({0, 1}), "Validation Failed: Invalid values in ppe_compliance"
    assert df["risk_score"].between(0, 100).all(), "Validation Failed: risk_score value out of bounds"
    
    # Check 3: Null values
    assert not df.isnull().any().any(), "Validation Failed: Null values detected in dataset"
    
    logger.info("All data validation checks passed successfully!")

    # 5. Export to CSV
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    logger.info(f"Successfully generated and saved safety dataset to: {output_path}")
    
    # Print summary statistics for inspection
    print("\nDataset Summary Statistics:")
    print(df.describe())
    print("\nSample Rows:")
    print(df.head(5))

if __name__ == "__main__":
    # Configure local workspace path relative to root directory
    output_csv = os.path.join(os.path.dirname(__file__), "industrial_safety.csv")
    generate_industrial_safety_dataset(output_path=output_csv)
