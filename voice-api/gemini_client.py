import os
import google.generativeai as genai
from dotenv import load_dotenv
import logging

# Load environment variables from the same directory as this file
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

# Logger Config
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

if not GEMINI_API_KEY:
    logger.warning("⚠️ GEMINI_API_KEY not found in environment variables.")
else:
    logger.info(f"🔑 API Key loaded: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-5:]} (Length: {len(GEMINI_API_KEY)})")
    genai.configure(api_key=GEMINI_API_KEY)

def transcribe_audio_with_gemini(audio_path: str, context: str = "navigation"):
    """
    Transcribes audio using Gemini 1.5 Flash.
    Context can be 'navigation' or 'login'.
    """
    if not GEMINI_API_KEY or "YOUR_GEMINI_API_KEY" in GEMINI_API_KEY:
        return {"text": "", "raw_text": "", "error": "API Key missing", "success": False}

    try:
        # Upload the file to Gemini File API
        logger.info(f"📤 Uploading {audio_path} to Gemini...")
        audio_file = genai.upload_file(path=audio_path)
        logger.info(f"✅ File uploaded: {audio_file.name}")

        # Try models that we verified exist in this environment
        model_names = [
            "models/gemini-1.5-flash",
            "models/gemini-1.5-flash-latest",
            "models/gemini-flash-latest", 
            "models/gemini-2.0-flash"
        ]
        
        last_error = None
        for model_name in model_names:
            try:
                logger.info(f"🔮 Trying Gemini model: {model_name}")
                model = genai.GenerativeModel(model_name=model_name)

                if context == "navigation":
                    prompt = (
                        "Listen to this audio. It is a voice command for a website navigation. "
                        "The allowed commands are: 'home', 'about', 'contact', 'blog', 'login', 'registre', 'estimate', 'product'. "
                        "Equivalent French: 'accueil'->'home', 'à propos'->'about', 'inscription'->'registre', 'estimation/prix'->'estimate', 'produit'->'product'. "
                        "Respond ONLY with the matched keyword in lowercase. If multiple, pick the best one. "
                        "If no match, respond with 'none'."
                    )
                elif context == "email":
                    prompt = (
                        "Transcribe this audio as an email address. "
                        "Convert spoken symbols (at/arobase -> @, dot/point -> .). "
                        "Lowercase everything. Remove spaces. Respond ONLY with the email."
                    )
                elif context == "password":
                    prompt = "Transcribe this audio as a password. Remove spaces. Keep original casing."
                elif context == "product_search":
                    prompt = (
                        "Listen to this audio carefully. The user is either:\n"
                        "1) Searching for a product by saying its name (e.g. 'pompe', 'valve', 'tuyau')\n"
                        "2) Asking to add a product to cart by saying something like 'ajouter X au panier' or 'add X to cart'\n\n"
                        "Respond ONLY in this JSON format (no markdown, no extra text):\n"
                        '{"intent": "search", "product": "product_name"}\n'
                        "or\n"
                        '{"intent": "add_to_cart", "product": "product_name"}\n\n'
                        "Rules:\n"
                        "- Extract the product name in lowercase\n"
                        "- If the user says 'ajouter ... au panier' or 'add ... to cart' or 'mettre ... dans le panier', intent is 'add_to_cart'\n"
                        "- Otherwise, intent is 'search'\n"
                        "- Respond ONLY with the JSON, nothing else"
                    )
                else:
                    prompt = "Transcribe this audio accurately."

                response = model.generate_content([prompt, audio_file])
                
                # Careful extracting the text as safety filters might trigger
                try:
                    result = response.text.strip().lower()
                except Exception as e:
                    logger.warning(f"⚠️ Could not get text from response (Safety?): {e}")
                    # If it's a safety block, result might be empty or restricted
                    result = "none"

                # Clean up the result (Gemini sometimes adds extra words)
                if context == "navigation":
                    for cmd in ["home", "about", "contact", "blog", "login", "registre", "estimate", "product"]:
                        if cmd in result:
                            result = cmd
                            break
                
                logger.info(f"✨ Gemini Result with {model_name}: {result}")
                return {"text": result, "raw_text": response.text, "success": True}

            except Exception as model_err:
                logger.warning(f"⚠️ Model {model_name} failed: {model_err}")
                last_error = model_err
                continue
        
        # If we get here, all models failed
        error_msg = str(last_error) if last_error else "All models failed"
        return {"text": "", "raw_text": "", "error": error_msg, "success": False}

    except Exception as e:
        logger.error(f"❌ Critical Gemini Error: {e}", exc_info=True)
        return {"text": "", "raw_text": "", "error": str(e), "success": False}
