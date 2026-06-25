import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from backend.utils.logging import logger

class SafetyRiskPredictor:
    """
    Handles training, saving, loading, and inference of Scikit-Learn ML models
    to predict incident risk ratings or severity categories.
    """
    def __init__(self, model_path: str = "./data/safety_risk_model.joblib"):
        self.model_path = model_path
        self.model = None
        self.label_encoders = {}
        self.is_trained = False
        
        # Load existing model if path exists
        if os.path.exists(self.model_path):
            self.load_model()
        else:
            logger.warning(f"ML Model file not found at {self.model_path}. Initializing dummy model training fallback.")
            self._train_fallback_model()

    def _train_fallback_model(self):
        """
        Train a basic fallback RandomForest classifier to ensure API doesn't fail
        when run for the first time without a pre-trained joblib file.
        """
        logger.info("Training fallback ML model...")
        
        # Dummy historical safety incident dataset
        data = {
            'category': ['Chemical', 'Electrical', 'Mechanical', 'Slippage', 'PPE Violation'] * 20,
            'department': ['Operations', 'Maintenance', 'Warehouse', 'Logistics', 'R&D'] * 20,
            'severity_input': ['Low', 'Medium', 'High', 'Critical', 'Low'] * 20,
            'likelihood_input': ['Rare', 'Possible', 'Likely', 'Certain', 'Rare'] * 20,
            'risk_class': [0, 1, 2, 3, 0] * 20 # 0=Low, 1=Medium, 2=High, 3=Critical risk class
        }
        
        df = pd.DataFrame(data)
        
        # Encode categorical variables
        categorical_cols = ['category', 'department', 'severity_input', 'likelihood_input']
        for col in categorical_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
            self.label_encoders[col] = le
            
        X = df[categorical_cols]
        y = df['risk_class']
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=10, random_state=42)
        self.model.fit(X, y)
        self.is_trained = True
        
        # Ensure parent folder exists
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        # Save model and encoders
        self.save_model()
        logger.info(f"Fallback model trained and saved to {self.model_path}")

    def predict_risk(self, category: str, department: str, severity: str, likelihood: str) -> dict:
        """
        Predict safety risk class and return class index with probability mapping.
        """
        if not self.is_trained or not self.model:
            raise ValueError("ML Model has not been trained or loaded.")

        # Prepare inputs with label encoders. Handle unseen labels gracefully.
        inputs = {}
        features = {
            'category': category,
            'department': department,
            'severity_input': severity,
            'likelihood_input': likelihood
        }

        for col, value in features.items():
            le = self.label_encoders.get(col)
            if not le:
                inputs[col] = 0
                continue
            
            # Safe transform for unseen label
            if value in le.classes_:
                inputs[col] = le.transform([value])[0]
            else:
                # Assign default class index 0 if not present
                inputs[col] = 0

        # Run model prediction
        input_df = pd.DataFrame([inputs])
        prediction_class = int(self.model.predict(input_df)[0])
        probabilities = self.model.predict_proba(input_df)[0].tolist()
        
        risk_labels = ["Low Risk", "Medium Risk", "High Risk", "Critical Risk"]
        predicted_label = risk_labels[prediction_class] if prediction_class < len(risk_labels) else "Unknown"

        return {
            "risk_class_id": prediction_class,
            "predicted_risk_label": predicted_label,
            "confidence_score": float(np.max(probabilities)),
            "all_probabilities": dict(zip(risk_labels, probabilities))
        }

    def save_model(self):
        """Serializes current model and label encoders to disk."""
        payload = {
            "model": self.model,
            "label_encoders": self.label_encoders
        }
        joblib.dump(payload, self.model_path)
        logger.info(f"Model successfully saved to {self.model_path}")

    def load_model(self):
        """Deserializes model and encoders from disk."""
        try:
            payload = joblib.load(self.model_path)
            self.model = payload["model"]
            self.label_encoders = payload["label_encoders"]
            self.is_trained = True
            logger.info(f"ML Model successfully loaded from {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to load ML Model from {self.model_path}: {str(e)}")
            self._train_fallback_model()
