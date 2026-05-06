import os
import numpy as np
import pandas as pd
import pickle
from datetime import datetime

# ==========================================
# CONFIGURATION ET CHARGEMENT DU MODÈLE
# ==========================================
# Chemin flexible : cherche d'abord via variable d'env, sinon dans le dossier 'models' local
MODEL_DIR = os.getenv("MODEL_DIR", os.path.join(os.path.dirname(__file__), "models"))
MODEL_PATH = os.path.join(MODEL_DIR, "Predict_price.pkl")
DATA_PATH = os.path.join(MODEL_DIR, "cleaned_data.csv")

print("[LOG] Chargement du modèle de prédiction dans PriceService...")

# Variable globale pour stocker le modèle et les stats une seule fois
_price_model = None
_price_features = None
_zip_stats = None
_global_stats = None

def init_prediction_model():
    global _price_model, _price_features, _zip_stats, _global_stats
    
    if _price_model is not None:
        return

    try:
        # Check if file exists
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Missing model file at {MODEL_PATH}")

        # Chargement du modèle pickle
        with open(MODEL_PATH, "rb") as f:
            saved = pickle.load(f)
        _price_model = saved["model"]
        _price_features = list(saved["features"])

        # Chargement des stats par ZIP
        if not os.path.exists(DATA_PATH):
            raise FileNotFoundError(f"Missing data file at {DATA_PATH}")
            
        df_stats = pd.read_csv(DATA_PATH, usecols=["zip_code", "price", "house_size"])
        zip_stats_raw = df_stats.groupby("zip_code").agg({
            "price": ["mean", "median", "count"],
            "house_size": "mean"
        }).reset_index()
        zip_stats_raw.columns = ["zip_code", "zip_price_mean", "zip_price_median", "zip_count", "zip_size_mean"]
        _zip_stats = zip_stats_raw.set_index("zip_code")

        _global_stats = {
            "zip_price_mean": df_stats["price"].mean(),
            "zip_price_median": df_stats["price"].median(),
            "zip_size_mean": df_stats["house_size"].mean(),
            "zip_count": 1
        }
        print("[OK] Modèle et Stats chargés avec succès.")
    except Exception as e:
        print(f"[ERROR] ATTENTION: Prediction model could not be loaded: {e}")
        # On ne bloque pas tout le démarrage du serveur
        _price_model = "ERROR"
        return

def predict_price_logic(user_data):
    """Logique métier pour transformer les entrées utilisateur en prédiction"""
    # S'assurer que le modèle est chargé
    if _price_model is None:
        init_prediction_model()
    
    if _price_model == "ERROR":
        raise Exception("Prediction model is not available (file not found). Please contact administrator.")
        
    bed = float(user_data.get("bed", 0))
    bath = float(user_data.get("bath", 0))
    house_size = float(user_data.get("house_size", 0))
    zip_code = float(user_data.get("zip_code", 0))
    
    now = datetime.now()
    
    # Récupérer les stats du ZIP ou globales
    if zip_code in _zip_stats.index:
        zs = _zip_stats.loc[zip_code].to_dict()
    else:
        zs = _global_stats

    # Ingénierie des caractéristiques (identique à l'entraînement du modèle)
    full_data = {
        "house_size": house_size, 
        "bath": bath, 
        "bed": bed, 
        "acre_lot": 0.1, 
        "zip_code": zip_code,
        "sqft_per_bed": house_size / max(bed, 1), 
        "bed_bath_sum": bed + bath,
        "bed_bath_ratio": bed / max(bath, 1), 
        "lot_size_sqft": 0.1 * 43560,
        "house_to_lot_ratio": house_size / (0.1 * 43560), 
        "years_since_2000": now.year - 2000,
        "is_recent": 1, 
        "month_sin": np.sin(2 * np.pi * now.month / 12),
        "month_cos": np.cos(2 * np.pi * now.month / 12), 
        "city_size": 1000, 
        "is_large_city": 1,
        "zip_price_mean": zs["zip_price_mean"], 
        "zip_price_median": zs["zip_price_median"],
        "zip_size_mean": zs["zip_size_mean"], 
        "zip_count": zs["zip_count"]
    }

    # Préparation du DataFrame pour XGBoost
    df_input = pd.DataFrame([full_data])[_price_features]
    X_array = np.ascontiguousarray(df_input.values).astype(np.float32)
    
    # Prédiction (le modèle renvoie log(prix))
    pred_log = _price_model.predict(X_array)
    return float(np.expm1(pred_log)[0])

# Initialiser au moment de l'import
init_prediction_model()
