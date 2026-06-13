import os
import json
import random
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List
import joblib

app = FastAPI(
    title="API de Detección de Fraude",
    description="Backend para predecir fraudes en transacciones utilizando XGBoost",
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
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "feature_names.pkl")
METRICS_PATH = os.path.join(BASE_DIR, "metrics.json")
SAMPLES_PATH = os.path.join(BASE_DIR, "sample_transactions.json")

model = None
scaler = None
feature_names = []
metrics_data = {}
samples_data = []

@app.on_event("startup")
def load_artifacts():
    global model, scaler, feature_names, metrics_data, samples_data
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
        if os.path.exists(SCALER_PATH):
            scaler = joblib.load(SCALER_PATH)
        if os.path.exists(FEATURES_PATH):
            feature_names = joblib.load(FEATURES_PATH)
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "r") as f:
                metrics_data = json.load(f)
        if os.path.exists(SAMPLES_PATH):
            with open(SAMPLES_PATH, "r") as f:
                samples_data = json.load(f)
        print("Backend artifacts loaded successfully.")
    except Exception as e:
        print(f"Error loading artifacts: {e}")

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
    return {"status": "ok", "model_loaded": model is not None}

@app.get("/api/metrics")
def get_metrics():
    if not metrics_data:
        # Load from file if not loaded at startup
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "r") as f:
                return json.load(f)
        raise HTTPException(status_code=404, detail="Métricas no encontradas. Ejecuta train_model.py primero.")
    return metrics_data

@app.get("/api/simulate")
def simulate_transaction(class_type: int = None):
    """
    Retorna una transacción aleatoria de muestra.
    class_type: 0 para normales, 1 para fraudes. Si es None, retorna cualquiera.
    """
    global samples_data
    if not samples_data:
        # Intenta cargar de nuevo
        if os.path.exists(SAMPLES_PATH):
            with open(SAMPLES_PATH, "r") as f:
                samples_data = json.load(f)
        else:
            raise HTTPException(status_code=404, detail="Muestras no encontradas. Ejecuta train_model.py primero.")

    
    if class_type is not None:
        filtered = [s for s in samples_data if int(s.get("Class", 0)) == class_type]
    else:
        filtered = samples_data
        
    if not filtered:
        raise HTTPException(status_code=404, detail="No hay muestras del tipo solicitado.")
        
    return random.choice(filtered)

@app.post("/api/predict")
def predict_transaction(tx: TransactionInput):
    global model, scaler, feature_names
    if model is None or scaler is None:
        # Intenta cargar de nuevo
        load_artifacts()
        if model is None or scaler is None:
            raise HTTPException(status_code=503, detail="Modelo o escalador no cargados. Por favor entrena el modelo.")
            
    # Convert request to dict
    tx_dict = tx.dict()
    
    # Scale Time and Amount (as done during training)
    # Scaler was fit on a DataFrame with [['Time', 'Amount']]
    try:
        scaled_vals = scaler.transform(pd.DataFrame([[tx_dict['Time'], tx_dict['Amount']]], columns=['Time', 'Amount']))
        tx_dict_scaled = tx_dict.copy()
        tx_dict_scaled['Time'] = scaled_vals[0][0]
        tx_dict_scaled['Amount'] = scaled_vals[0][1]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al escalar variables: {str(e)}")
        
    # Reorder features to match feature_names
    ordered_features = []
    for col in feature_names:
        ordered_features.append(tx_dict_scaled[col])
        
    # Predict
    input_arr = np.array([ordered_features])
    prediction = int(model.predict(input_arr)[0])
    probability = float(model.predict_proba(input_arr)[0][1])
    
    # Feature Impact analysis
    # Let's see which feature contributed most to the prediction.
    # We will use the model's feature_importances_ and the feature values.
    # For a simple explainability: impact = feature_val * feature_importance
    importances = model.feature_importances_
    features_impact = []
    
    # Normalize features roughly to compare impacts
    for i, name in enumerate(feature_names):
        val = tx_dict_scaled[name]
        imp = importances[i]
        # Impact is high if the value is far from 0 (since V1-V28 are PCA centered around 0)
        # And if it aligns with the correlation direction
        impact_val = val * imp
        features_impact.append({
            "name": name,
            "value": float(tx_dict[name]), # original value
            "scaled_value": float(val),
            "importance": float(imp),
            "impact": float(impact_val)
        })
        
    # Sort by absolute impact
    features_impact = sorted(features_impact, key=lambda x: abs(x['impact']), reverse=True)
    
    return {
        "prediction": prediction,
        "probability": probability,
        "is_fraud": prediction == 1,
        "top_features": features_impact[:10]  # Return top 10 most impactful features for explanation
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
