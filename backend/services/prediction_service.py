from backend.models.ml_models import SafetyRiskPredictor
from backend.utils.config import settings
from backend.utils.logging import logger

class PredictionService:
    """
    Service to process incident parameters and run ML evaluations.
    Uses the Scikit-Learn predictor.
    """
    def __init__(self):
        # Initialize the predictor singleton/instance
        self.predictor = SafetyRiskPredictor(model_path=os.path.join(os.path.dirname(settings.FAISS_INDEX_PATH), "safety_risk_model.joblib"))

    def evaluate_incident_risk(self, category: str, department: str, severity: str, likelihood: str) -> dict:
        """
        Takes incident parameters and returns model classification.
        """
        logger.info(f"Evaluating risk for: Cat={category}, Dept={department}, Sev={severity}, Lik={likelihood}")
        
        try:
            prediction_result = self.predictor.predict_risk(
                category=category,
                department=department,
                severity=severity,
                likelihood=likelihood
            )
            return prediction_result
        except Exception as e:
            logger.error(f"Inference evaluation failed: {str(e)}")
            # Return simple rule-based fallback if ML evaluation throws error
            return self._rule_based_fallback(severity, likelihood)

    def forecast_hazard_risk(self, risk_history: list, interval_seconds: float) -> dict:
        """
        Fits a lightweight Linear Regression on the rolling risk history window
        and predicts composite risk values 5, 10, and 15 minutes into the future.
        """
        logger.info(f"Forecasting risk levels from window of {len(risk_history)} points at interval {interval_seconds}s")
        
        if not risk_history:
            return {
                "risk_now": 0.0,
                "risk_5min": 0.0,
                "risk_10min": 0.0,
                "risk_15min": 0.0,
                "forecast": "No history available"
            }
            
        try:
            import numpy as np
            from sklearn.linear_model import LinearRegression
            
            # Form index array and values
            x = np.array([i * interval_seconds for i in range(len(risk_history))]).reshape(-1, 1)
            y = np.array(risk_history)
            
            model = LinearRegression()
            model.fit(x, y)
            
            x_now = x[-1][0]
            x_5 = x_now + 5 * 60
            x_10 = x_now + 10 * 60
            x_15 = x_now + 15 * 60
            
            pred_now = model.predict([[x_now]])[0]
            pred_5 = model.predict([[x_5]])[0]
            pred_10 = model.predict([[x_10]])[0]
            pred_15 = model.predict([[x_15]])[0]
            
            # Clamp to [0, 100]
            risk_now = round(float(np.clip(pred_now, 0.0, 100.0)), 2)
            risk_5min = round(float(np.clip(pred_5, 0.0, 100.0)), 2)
            risk_10min = round(float(np.clip(pred_10, 0.0, 100.0)), 2)
            risk_15min = round(float(np.clip(pred_15, 0.0, 100.0)), 2)
            
            # Determine forecast statement
            if risk_5min >= 75:
                forecast = "Critical threshold expected within 5 minutes"
            elif risk_10min >= 75:
                forecast = "Critical threshold expected within 10 minutes"
            elif risk_15min >= 75:
                forecast = "Critical threshold expected within 15 minutes"
            else:
                diff = risk_15min - risk_now
                if diff > 10:
                    forecast = "Risk levels showing an upward trend"
                elif diff < -10:
                    forecast = "Risk levels showing a downward trend"
                else:
                    forecast = "Risk levels projected to remain stable"
                    
            return {
                "risk_now": risk_now,
                "risk_5min": risk_5min,
                "risk_10min": risk_10min,
                "risk_15min": risk_15min,
                "forecast": forecast
            }
        except Exception as e:
            logger.error(f"Failed to calculate risk forecast: {str(e)}")
            # Fallback to simple extrapolation using last two points
            if len(risk_history) >= 2:
                last = risk_history[-1]
                prev = risk_history[-2]
                slope = (last - prev) / interval_seconds
                pred_now = last
                pred_5 = last + slope * 5 * 60
                pred_10 = last + slope * 10 * 60
                pred_15 = last + slope * 15 * 60
                
                risk_now = round(float(np.clip(pred_now, 0.0, 100.0)), 2)
                risk_5min = round(float(np.clip(pred_5, 0.0, 100.0)), 2)
                risk_10min = round(float(np.clip(pred_10, 0.0, 100.0)), 2)
                risk_15min = round(float(np.clip(pred_15, 0.0, 100.0)), 2)
                return {
                    "risk_now": risk_now,
                    "risk_5min": risk_5min,
                    "risk_10min": risk_10min,
                    "risk_15min": risk_15min,
                    "forecast": "Extrapolated trend (Fallback)"
                }
            
            return {
                "risk_now": risk_history[-1] if risk_history else 0.0,
                "risk_5min": risk_history[-1] if risk_history else 0.0,
                "risk_10min": risk_history[-1] if risk_history else 0.0,
                "risk_15min": risk_history[-1] if risk_history else 0.0,
                "forecast": "Stable (Default Fallback)"
            }

    def _rule_based_fallback(self, severity: str, likelihood: str) -> dict:
        """Rule-based risk calculation to use if ML predictor fails."""
        severity_map = {"Low": 1.0, "Medium": 2.0, "High": 3.0, "Critical": 4.0}
        likelihood_map = {"Rare": 1.0, "Possible": 2.0, "Likely": 3.0, "Certain": 4.0}
        
        score = severity_map.get(severity, 1.0) * likelihood_map.get(likelihood, 1.0)
        
        if score <= 2:
            label = "Low Risk"
            class_id = 0
        elif score <= 6:
            label = "Medium Risk"
            class_id = 1
        elif score <= 10:
            label = "High Risk"
            class_id = 2
        else:
            label = "Critical Risk"
            class_id = 3
            
        return {
            "risk_class_id": class_id,
            "predicted_risk_label": label,
            "confidence_score": 1.0,
            "all_probabilities": {label: 1.0},
            "note": "Rule-based fallback calculation applied."
        }

# Import os for setting path securely inside the service initialization
import os
