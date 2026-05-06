import os
import json
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'back-end', '.env'))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time

@app.post("/scan-quotation")
async def scan_quotation(file: UploadFile = File(...)):
    try:
        content = await file.read()
        api_key = os.getenv("GEMINI_API_KEY_2") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="No Gemini API Key found in .env")
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Retry logic for 429
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = model.generate_content([
                    "Read this quotation and return ONLY JSON.",
                    {"mime_type": file.content_type, "data": content}
                ])
                
                text = response.text
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "{" in text:
                    text = text[text.find("{"):text.rfind("}")+1]
                    
                return json.loads(text)
            except Exception as e:
                if "429" in str(e) and attempt < max_retries - 1:
                    print(f"⚠️ Hit 429, waiting 5 seconds... (Attempt {attempt+1})")
                    time.sleep(5)
                    continue
                raise e
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
