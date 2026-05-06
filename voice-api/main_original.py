import os
import uuid
import re
import json
import whisper
import subprocess
import logging
import httpx
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fuzzywuzzy import fuzz
from gemini_client import transcribe_audio_with_gemini

# IMPORT DE NOTRE SERVICE DE PRÉDICTION
from price_service import predict_price_logic

NESTJS_BACKEND_URL = os.getenv("NESTJS_BACKEND_URL", "http://backend:3000")

# =========================
# FastAPI APP SETUP
# =========================
log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend.log')
logging.basicConfig(
    filename=log_path, 
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    force=True
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[LOG] Loading Whisper model (base)...")
try:
    model = whisper.load_model("base")
    print("[OK] Whisper loaded!")
except Exception as e:
    print(f"[ERROR] Error: {e}")
    model = whisper.load_model("tiny")

# =========================
# PREDICTION PRIX ENDPOINT
# =========================
@app.post("/predict_price")
async def predict_price_api(request: Request):
    try:
        data = await request.json()
        # Appel de la logique isolée dans price_service.py
        price = predict_price_logic(data)
        return {
            "status": "success",
            "predicted_price": round(price, 2),
            "currency": "USD"
        }
    except Exception as e:
        logging.error(f"Erreur prédiction: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

# =========================
# HEALTH CHECK
# =========================
@app.get("/health")
def health_check():
    return {"status": "ok", "model": "loaded"}

# =========================
# VOICE API ENDPOINTS
# =========================
@app.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...), field: str = Form("text")):
    unique_id = uuid.uuid4().hex
    input_filename = f"input_{unique_id}.webm"
    output_filename = f"output_{unique_id}.wav"
    
    try:
        with open(input_filename, "wb") as f:
            f.write(await file.read())
        
        subprocess.run(["ffmpeg", "-y", "-i", input_filename, "-ar", "16000", "-ac", "1", "-f", "wav", output_filename], capture_output=True)
        
        transcription = model.transcribe(output_filename, language="en", temperature=0.0, fp16=False)
        raw_text = transcription.get("text", "").strip()
        
        return {"text": raw_text, "raw_text": raw_text, "success": True}
    finally:
        for f in [input_filename, output_filename]:
            if os.path.exists(f): os.remove(f)

@app.post("/gemini-stt")
async def gemini_stt(file: UploadFile = File(...), context: str = Form("navigation")):
    unique_id = uuid.uuid4().hex
    tmp_input = f"gemini_{unique_id}.webm"
    tmp_output = f"gemini_{unique_id}.wav"
    try:
        with open(tmp_input, "wb") as f: 
            f.write(await file.read())
        # On reconvertit en WAV 16kHz pour une qualité optimale et uniforme
        subprocess.run(["ffmpeg", "-y", "-i", tmp_input, "-ar", "16000", "-ac", "1", "-f", "wav", tmp_output], capture_output=True)
        return transcribe_audio_with_gemini(tmp_output, context=context)
    finally:
        for f in [tmp_input, tmp_output]:
            if os.path.exists(f): 
                os.remove(f)

# =========================
# PRODUCT VOICE SEARCH
# =========================
@app.post("/product-voice-search")
async def product_voice_search(file: UploadFile = File(...)):
    unique_id = uuid.uuid4().hex
    tmp_input = f"product_{unique_id}.webm"
    tmp_output = f"product_{unique_id}.wav"
    try:
        # 1. Save and convert audio
        with open(tmp_input, "wb") as f:
            f.write(await file.read())
        subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_input, "-ar", "16000", "-ac", "1", "-f", "wav", tmp_output],
            capture_output=True
        )







        # 2. CONSTRUCTION DYNAMIQUE DU DICTIONNAIRE (Solution Ultime pour la précision)
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{NESTJS_BACKEND_URL}/products/FindAll")
                products_list = resp.json()
                all_names = ", ".join([p.get("nomP", "") for p in products_list if p.get("nomP")])
                prompt_context = f"Ajouter au panier, rechercher, Fullstakers, {all_names}"
        except Exception as e:
            logging.warning(f"⚠️ Erreur chargement produits: {e}")
            prompt_context = "Ajouter au panier, rechercher, pompe, valve, tuyau, béton, ciment, Fullstakers, construction."

        transcription = model.transcribe(
            tmp_output, 
            # On force 'fr' pour la stabilité. L'Anglais restera détecté via le prompt_context.
            language="fr", 
            temperature=0.0, 
            fp16=False,
            initial_prompt=prompt_context
        )
        raw_text = transcription.get("text", "").strip().lower()
        logging.info(f"🔍 Direct Whisper text: {raw_text}")
        
        # Détection d'intention directement sur le texte Whisper
        intent = "search"
        product_name = raw_text
        add_keywords = ["ajouter", "ajouté", "ajoute", "add", "mettre", "met", "panier", "cart", "prends"]
        for kw in add_keywords:
            if kw in raw_text:
                intent = "add_to_cart"
                clean_text = raw_text
                for word_to_strip in ["ajouter au panier", "ajoute au panier", "ajouter", "ajoute", "au panier", "dans le panier", "mettre", "le", "la", "les", "un", "une"]:
                    clean_text = clean_text.replace(word_to_strip, "")
                product_name = clean_text.strip()
                break

        logging.info(f"🎯 Intent: {intent}, Product: {product_name}")

        if not product_name:
            return {"success": False, "message": "Could not understand the product name", "raw_text": raw_text}

        # 3. Fetch products from NestJS backend
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{NESTJS_BACKEND_URL}/products/FindAll")
            products = resp.json()

        # 4. Fuzzy match product name
        best_match = None
        best_score = 0
        for product in products:
            name = product.get("nomP", "").lower()
            # Check exact substring match first
            if product_name in name or name in product_name:
                best_match = product
                best_score = 100
                break
            # Fuzzy matching
            score = fuzz.partial_ratio(product_name, name)
            if score > best_score:
                best_score = score
                best_match = product

        logging.info(f"🏆 Best match: {best_match.get('nomP') if best_match else 'None'} (score: {best_score})")

        if best_match and best_score >= 60:
            return {
                "success": True,
                "intent": intent,
                "product_name": product_name,
                "matched_product": {
                    "_id": str(best_match.get("_id", "")),
                    "nomP": best_match.get("nomP", ""),
                    "prix": best_match.get("prix", 0),
                    "quantite": best_match.get("quantite", 0),
                    "imagePUrl": best_match.get("imagePUrl", ""),
                    "description": best_match.get("description", ""),
                    "categorie": best_match.get("categorie", ""),
                },
                "available": best_match.get("quantite", 0) > 0,
                "match_score": best_score,
                "raw_text": raw_text,
            }
        else:
            return {
                "success": True,
                "intent": intent,
                "product_name": product_name,
                "matched_product": None,
                "available": False,
                "match_score": best_score,
                "raw_text": raw_text,
                "message": f"No product found matching '{product_name}'"
            }

    except Exception as e:
        logging.error(f"❌ Product voice search error: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )
    finally:
        for f in [tmp_input, tmp_output]:
            if os.path.exists(f):
                os.remove(f)
