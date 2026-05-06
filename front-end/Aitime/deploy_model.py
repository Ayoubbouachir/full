import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

# Load the trained model
MODEL_PATH = "best_speed_model.pkl"
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    # Try pickle if joblib fails
    import pickle
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)

app = FastAPI(title="Tunisia Delivery Speed Predictor")

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the input schema
class PredictionInput(BaseModel):
    length_m: float
    from_lat: float
    from_lon: float
    to_lat: float
    to_lon: float
    road_type: str  # e.g., 'primary', 'residential', etc.
    oneway: str     # 'yes', 'no', 'reversible'

# The exact columns used during training (order matters for the model)
TRAINING_COLUMNS = [
    'length_m', 'from_lat', 'from_lon', 'to_lat', 'to_lon',
    'road_type_motorway_link', 'road_type_primary', 'road_type_primary_link',
    'road_type_residential', 'road_type_secondary', 'road_type_secondary_link',
    'road_type_service', 'road_type_tertiary', 'road_type_tertiary_link',
    'road_type_trunk', 'road_type_trunk_link', 'road_type_unclassified',
    'oneway_reversible', 'oneway_yes'
]

@app.get("/")
def read_root():
    return {"message": "Tunisia Road Speed Prediction API is active!"}

@app.post("/predict")
def predict_speed(data: PredictionInput):
    try:
        # Create a dictionary initialized with zeros for all categorical columns
        input_data = {col: 0 for col in TRAINING_COLUMNS}
        
        # Populate numerical values
        input_data['length_m'] = data.length_m
        input_data['from_lat'] = data.from_lat
        input_data['from_lon'] = data.from_lon
        input_data['to_lat'] = data.to_lat
        input_data['to_lon'] = data.to_lon
        
        # Handle one-hot encoding for road_type
        road_type_col = f"road_type_{data.road_type.lower()}"
        if road_type_col in input_data:
            input_data[road_type_col] = 1
            
        # Handle one-hot encoding for oneway
        oneway_col = f"oneway_{data.oneway.lower()}"
        if oneway_col in input_data:
            input_data[oneway_col] = 1
        # Note: if oneway is 'no', it was likely the dropped category in training (drop_first=True)
            
        # Convert to DataFrame with training column order
        df = pd.DataFrame([input_data])[TRAINING_COLUMNS]
        
        # Predict speed
        predicted_speed = model.predict(df)[0]
        
        # Calculate estimated time in minutes (speed is in km/h, distance in m)
        # speed = dist_km / time_hr => time_hr = dist_km / speed
        # time_min = (dist_m / 1000) / speed * 60
        estimated_time_min = (data.length_m / 1000.0) / predicted_speed * 60.0
        
        return {
            "predicted_speed_kmh": round(predicted_speed, 2),
            "estimated_time_min": round(estimated_time_min, 2),
            "distance_m": data.length_m
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
