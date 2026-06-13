# Detección de Fraude en Transacciones con Tarjeta de Crédito

Este proyecto implementa un sistema predictivo de detección de fraudes de punta a punta, utilizando un clasificador **XGBoost** entrenado sobre el dataset *Credit Card Fraud Detection* de Kaggle (anonimizado mediante PCA).

La aplicación consta de un backend desarrollado en **FastAPI** y un frontend moderno con **Next.js** y **Tailwind CSS**, que permite a los usuarios visualizar métricas y simular la evaluación de transacciones en tiempo real.

## Estructura del Proyecto

```
fraud-detection/
├── data/
│   └── creditcard.csv       # Dataset principal (excluido de Git por peso)
├── notebooks/
│   └── 01_eda_modeling.ipynb # Notebook original de exploración y modelado
├── backend/
│   ├── main.py              # API de FastAPI
│   ├── train_model.py       # Script de entrenamiento y preprocesamiento
│   ├── model.pkl            # Modelo XGBoost exportado
│   ├── scaler.pkl           # StandardScaler exportado
│   ├── feature_names.pkl    # Nombres de las características
│   ├── metrics.json         # Métricas calculadas tras el entrenamiento
│   ├── sample_transactions.json # Muestras pre-guardadas para simulación
│   └── requirements.txt     # Dependencias de Python
├── frontend/
│   └── (Next.js app)        # Interfaz de usuario interactiva
└── README.md
```

## Requisitos Previos

- **Python 3.10+**
- **Node.js 18+** y **npm**

---

## Configuración del Backend

1. Navega al directorio del backend:
   ```bash
   cd backend
   ```

2. Crea y activa un entorno virtual de Python:
   ```bash
   python -m venv venv
   # En Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # En macOS/Linux:
   source venv/bin/activate
   ```

3. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Entrena el modelo y exporta los artefactos (opcional si ya existen):
   ```bash
   python train_model.py
   ```

5. Inicia el servidor de FastAPI:
   ```bash
   python main.py
   ```
   La API estará disponible en `http://127.0.0.1:8000`. Puedes ver la documentación interactiva en `http://127.0.0.1:8000/docs`.

---

## Configuración del Frontend

1. Navega al directorio del frontend:
   ```bash
   cd ../frontend
   ```

2. Instala las dependencias de Node:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo de Next.js:
   ```bash
   npm run dev
   ```
   El frontend estará disponible en `http://localhost:3000`.

---

## Métricas del Modelo XGBoost

- **ROC-AUC Score**: `97.78%`
- **PR-AUC (Average Precision)**: `86.57%`
- **Sensibilidad (Recall) de Fraudes**: `83.67%` (82 de 98 fraudes detectados en el conjunto de prueba)
- **Falsos Positivos**: `16` transacciones normales clasificadas incorrectamente como fraude de un total de `56,864`.
