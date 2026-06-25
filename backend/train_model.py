import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from backend.utils.logging import logger

def train_safety_risk_model(
    data_path: str = "./backend/data/industrial_safety.csv",
    model_output_path: str = "./backend/data/model.pkl",
    encoder_output_path: str = "./backend/data/encoder.pkl",
    chart_output_path: str = "./backend/data/feature_importance.png"
):
    """
    Loads safety telemetry dataset, trains a RandomForestRegressor, 
    evaluates performance metrics, and exports serialized weights and importance charts.
    """
    logger.info("Initializing RandomForest regression training pipeline...")
    
    # 1. Load Dataset
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Missing source dataset at {data_path}. Run generate_dataset.py first.")
        
    df = pd.read_csv(data_path)
    logger.info(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns.")

    # 2. Encode Categorical Variables
    # The only categorical variable is 'shift' (day/night)
    logger.info("Encoding categorical attributes...")
    label_encoders = {}
    categorical_cols = ["shift"]
    
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le
        logger.info(f"Encoded '{col}' mapping: {dict(zip(le.classes_, le.transform(le.classes_)))}")

    # Define features and target label
    X = df.drop(columns=["risk_score"])
    y = df["risk_score"]
    feature_names = X.columns.tolist()

    # 3. Train / Test Split (80% Train, 20% Evaluation Test)
    logger.info("Splitting dataset into train and test evaluation splits (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    # 4. Train RandomForestRegressor Model
    # Setting hyper-parameters for optimal fit and memory footprints
    logger.info("Fitting RandomForestRegressor model (n_estimators=50, max_depth=15)...")
    model = RandomForestRegressor(
        n_estimators=50,
        max_depth=15,
        random_state=42,
        n_jobs=-1  # Use all available CPU cores
    )
    model.fit(X_train, y_train)
    logger.info("Model fitting complete.")

    # 5. Evaluate Performance Metrics
    logger.info("Evaluating predictions on evaluation test split...")
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)

    print("\n=========================================")
    print("      MODEL PERFORMANCE EVALUATION       ")
    print("=========================================")
    print(f"Mean Absolute Error (MAE)  : {mae:.4f}")
    print(f"Mean Squared Error (MSE)    : {mse:.4f}")
    print(f"Root Mean Sq. Error (RMSE)  : {rmse:.4f}")
    print(f"R-squared Score (R²)        : {r2:.4f}")
    print("=========================================\n")

    # 6. Save Model and Encoder weights
    logger.info("Saving serialized weights to disk...")
    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    os.makedirs(os.path.dirname(encoder_output_path), exist_ok=True)
    
    # Save files using joblib (optimized for scikit-learn models)
    joblib.dump(model, model_output_path)
    joblib.dump(label_encoders, encoder_output_path)
    
    logger.info(f"Model saved to: {model_output_path}")
    logger.info(f"Encoders saved to: {encoder_output_path}")

    # 7. Print Feature Importances
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    print("Feature Importances Ranking:")
    for f in range(X.shape[1]):
        print(f"{f + 1}. {feature_names[indices[f]]:<16} : {importances[indices[f]]:.4f}")
    print("")

    # 8. Generate and Save Feature Importance Graph
    logger.info("Generating feature importance bar graph...")
    
    # Apply modern premium dark styling
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Color palette matching safety brand (Indigo to Emerald)
    colors = plt.cm.viridis(np.linspace(0.3, 0.8, len(feature_names)))
    
    sorted_features = [feature_names[i] for i in indices]
    sorted_importances = importances[indices]
    
    bars = ax.barh(sorted_features[::-1], sorted_importances[::-1], color=colors, edgecolor='none', height=0.6)
    
    # Customizing axes and grids
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#334155')
    ax.spines['bottom'].set_color('#334155')
    ax.tick_params(colors='#94a3b8', labelsize=10)
    ax.grid(axis='x', linestyle='--', alpha=0.2, color='#475569')
    
    # Titles and labels
    ax.set_title('ISIP Safety Model - Feature Importance Ratings', fontsize=14, fontweight='bold', color='#f8fafc', pad=20)
    ax.set_xlabel('Relative Importance Weight', fontsize=11, fontweight='medium', color='#94a3b8', labelpad=10)
    
    # Add values on the bar caps
    for bar in bars:
        width = bar.get_width()
        ax.text(
            width + 0.01,
            bar.get_y() + bar.get_height()/2,
            f'{width:.3f}',
            ha='left',
            va='center',
            color='#cbd5e1',
            fontsize=9,
            fontweight='bold'
        )

    plt.tight_layout()
    plt.savefig(chart_output_path, dpi=300, bbox_inches='tight')
    plt.close()
    logger.info(f"Saved feature importance chart to: {chart_output_path}")

if __name__ == "__main__":
    # Configure path relative to root directory
    base_dir = os.path.dirname(os.path.dirname(__file__)) # Go up to ISIP/
    data_csv = os.path.join(base_dir, "backend", "data", "industrial_safety.csv")
    model_out = os.path.join(base_dir, "backend", "data", "model.pkl")
    encoder_out = os.path.join(base_dir, "backend", "data", "encoder.pkl")
    chart_out = os.path.join(base_dir, "backend", "data", "feature_importance.png")
    
    train_risk_model = train_safety_risk_model(
        data_path=data_csv,
        model_output_path=model_out,
        encoder_output_path=encoder_out,
        chart_output_path=chart_out
    )
