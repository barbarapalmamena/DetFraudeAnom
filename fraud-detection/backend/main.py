import os
import json
import random
import math
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List

app = FastAPI(
    title="API de Detección de Fraude",
    description="Backend para predecir fraudes en transacciones utilizando XGBoost (Inferencia de puro Python)",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model, scaler, features, metrics, and samples
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_JSON_PATH = os.path.join(BASE_DIR, "model.json")
SCALER_JSON_PATH = os.path.join(BASE_DIR, "scaler_params.json")
METRICS_PATH = os.path.join(BASE_DIR, "metrics.json")
SAMPLES_PATH = os.path.join(BASE_DIR, "sample_transactions.json")

model_data = None
scaler_params = None
feature_names = []
metrics_data = {}
samples_data = []

@app.on_event("startup")
def load_artifacts():
    global model_data, scaler_params, feature_names, metrics_data, samples_data
    try:
        if os.path.exists(MODEL_JSON_PATH):
            with open(MODEL_JSON_PATH, "r") as f:
                model_data = json.load(f)
            if model_data and "learner" in model_data:
                feature_names = model_data["learner"].get("feature_names", [])
        if os.path.exists(SCALER_JSON_PATH):
            with open(SCALER_JSON_PATH, "r") as f:
                scaler_params = json.load(f)
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "r") as f:
                metrics_data = json.load(f)
        if os.path.exists(SAMPLES_PATH):
            with open(SAMPLES_PATH, "r") as f:
                samples_data = json.load(f)
        print("Backend JSON artifacts loaded successfully.")
    except Exception as e:
        print(f"Error loading JSON artifacts: {e}")

class TransactionInput(BaseModel):
    Time: float = Field(..., description="Segundos transcurridos desde la primera transacción")
    Amount: float = Field(..., description="Monto de la transacción")
    V1: float
    V2: float
    V3: float
    V4: float
    V5: float
    V6: float
    V7: float
    V8: float
    V9: float
    V10: float
    V11: float
    V12: float
    V13: float
    V14: float
    V15: float
    V16: float
    V17: float
    V18: float
    V19: float
    V20: float
    V21: float
    V22: float
    V23: float
    V24: float
    V25: float
    V26: float
    V27: float
    V28: float

@app.get("/api/health")
def health_check():
    return {"status": "ok", "model_loaded": model_data is not None}

@app.get("/api/metrics")
def get_metrics():
    if not metrics_data:
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "r") as f:
                return json.load(f)
        raise HTTPException(status_code=404, detail="Métricas no encontradas.")
    return metrics_data

@app.get("/api/simulate")
def simulate_transaction(class_type: int = None):
    global samples_data
    if not samples_data:
        if os.path.exists(SAMPLES_PATH):
            with open(SAMPLES_PATH, "r") as f:
                samples_data = json.load(f)
        else:
            raise HTTPException(status_code=404, detail="Muestras no encontradas.")

    if class_type is not None:
        filtered = [s for s in samples_data if int(s.get("Class", 0)) == class_type]
    else:
        filtered = samples_data
        
    if not filtered:
        raise HTTPException(status_code=404, detail="No hay muestras del tipo solicitado.")
        
    return random.choice(filtered)

def predict_xgboost_pure_python(tx_dict_scaled: dict) -> float:
    x = [tx_dict_scaled.get(name, 0.0) for name in feature_names]
    trees = model_data["learner"]["gradient_booster"]["model"]["trees"]
    
    margin = 0.0
    for tree in trees:
        node = 0
        while True:
            left = tree["left_children"][node]
            right = tree["right_children"][node]
            
            # Leaf node
            if left == -1 and right == -1:
                margin += tree["split_conditions"][node]
                break
                
            split_idx = tree["split_indices"][node]
            split_val = tree["split_conditions"][node]
            default_left = tree["default_left"][node]
            
            val = x[split_idx]
            
            if val is None:
                if default_left:
                    node = left
                else:
                    node = right
            elif val < split_val:
                node = left
            else:
                node = right
                
    # Sigmoid function
    prob = 1.0 / (1.0 + math.exp(-margin))
    return prob

@app.post("/api/predict")
def predict_transaction(tx: TransactionInput):
    global model_data, scaler_params, feature_names, metrics_data
    if model_data is None or scaler_params is None:
        load_artifacts()
        if model_data is None or scaler_params is None:
            raise HTTPException(status_code=503, detail="Modelo o configuraciones de escalado no cargados.")
            
    tx_dict = tx.dict()
    
    # Scale Time and Amount
    try:
        mean_time = scaler_params["mean"][0]
        scale_time = scaler_params["scale"][0]
        mean_amount = scaler_params["mean"][1]
        scale_amount = scaler_params["scale"][1]
        
        tx_dict_scaled = tx_dict.copy()
        tx_dict_scaled["Time"] = (tx_dict["Time"] - mean_time) / scale_time
        tx_dict_scaled["Amount"] = (tx_dict["Amount"] - mean_amount) / scale_amount
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al escalar variables: {str(e)}")
        
    # Predict using pure Python
    try:
        probability = predict_xgboost_pure_python(tx_dict_scaled)
        prediction = 1 if probability > 0.5 else 0
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en la predicción del modelo: {str(e)}")
        
    # Feature Impact analysis
    importances = metrics_data.get("feature_importances", {})
    features_impact = []
    
    for name in feature_names:
        val = tx_dict_scaled[name]
        imp = importances.get(name, 0.0)
        impact_val = val * imp
        features_impact.append({
            "name": name,
            "value": float(tx_dict[name]),
            "scaled_value": float(val),
            "importance": float(imp),
            "impact": float(impact_val)
        })
        
    features_impact = sorted(features_impact, key=lambda x: abs(x['impact']), reverse=True)
    
    return {
        "prediction": prediction,
        "probability": probability,
        "is_fraud": prediction == 1,
        "top_features": features_impact[:10]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
