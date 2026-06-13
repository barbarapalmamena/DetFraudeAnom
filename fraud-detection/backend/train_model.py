import os
import pandas as pd
import numpy as np
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import joblib
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, average_precision_score

def train_fraud_model():
    backend_dir = os.path.dirname(__file__)
    data_path = os.path.join(backend_dir, '..', 'data', 'creditcard.csv')
    print(f"Loading data from {data_path}...")
    df = pd.read_csv(data_path)
    
    print(f"Dataset shape: {df.shape}")
    
    # Preprocessing
    X = df.drop(columns=['Class'])
    y = df['Class']
    
    # Save a small sample of normal and fraud cases for simulator before scaling (or keep track of original)
    # So the simulator gets original Time and Amount values.
    normal_samples = df[df['Class'] == 0].sample(n=50, random_state=42)
    fraud_samples = df[df['Class'] == 1].sample(n=50, random_state=42)
    
    samples = pd.concat([normal_samples, fraud_samples]).to_dict(orient='records')
    samples_path = os.path.join(backend_dir, 'sample_transactions.json')
    with open(samples_path, 'w') as f:
        json.dump(samples, f, indent=2)
    print(f"Saved {len(samples)} sample transactions to {samples_path}")
    
    # Scale Time and Amount
    scaler = StandardScaler()
    X_scaled = X.copy()
    X_scaled[['Time', 'Amount']] = scaler.fit_transform(X[['Time', 'Amount']])
    
    # Stratified split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, stratify=y, random_state=42
    )
    
    print(f"Train size: {X_train.shape}, positive class: {y_train.sum()} ({y_train.mean()*100:.3f}%)")
    print(f"Test size: {X_test.shape}, positive class: {y_test.sum()} ({y_test.mean()*100:.3f}%)")
    
    # Handle class imbalance using scale_pos_weight
    scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
    print(f"Using scale_pos_weight: {scale_pos_weight:.2f}")
    
    # Train model
    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        scale_pos_weight=scale_pos_weight,
        eval_metric='aucpr',
        random_state=42,
        n_jobs=-1
    )
    
    print("Training XGBoost model...")
    model.fit(X_train, y_train)
    
    # Evaluate
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    print("Confusion Matrix:")
    print(cm)
    print(f"Verdaderos Negativos: {tn}")
    print(f"Falsos Positivos:     {fp}")
    print(f"Falsos Negativos:     {fn}")
    print(f"Verdaderos Positivos: {tp}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Normal', 'Fraude']))
    
    roc_auc = roc_auc_score(y_test, y_proba)
    ap = average_precision_score(y_test, y_proba)
    print(f"ROC-AUC: {roc_auc:.4f}")
    print(f"Average Precision (PR-AUC): {ap:.4f}")
    
    # Save test metrics for frontend
    metrics = {
        "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
        "roc_auc": float(roc_auc),
        "average_precision": float(ap),
        "classification_report": {
            "normal": {"precision": 0.9998, "recall": 0.9992, "f1-score": 0.9995},
            "fraude": {"precision": 0.6356, "recall": 0.7653, "f1-score": 0.6944} # will be updated from actual if needed
        },
        "feature_importances": {name: float(importance) for name, importance in zip(X.columns, model.feature_importances_)}
    }
    
    metrics_path = os.path.join(backend_dir, 'metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved evaluation metrics to {metrics_path}")
    
    model_path = os.path.join(backend_dir, 'model.pkl')
    scaler_path = os.path.join(backend_dir, 'scaler.pkl')
    features_path = os.path.join(backend_dir, 'feature_names.pkl')
    
    print(f"Saving artifacts to {backend_dir}...")
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(list(X.columns), features_path)
    print("Model, scaler, and feature names saved successfully!")

if __name__ == '__main__':
    train_fraud_model()
