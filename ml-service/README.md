# 🏗️ Construction Progress Classifier

> AI-powered construction site phase detection and progress estimation using ResNet18 transfer learning.

---

## Features

- **5-class classifier**: terrassement → fondation → structure → second_oeuvre → finition
- **Progress mapping**: each phase maps to a percentage (5 % → 20 % → 50 % → 75 % → 95 %)
- **Confidence scores** per class
- **Batch endpoint** for processing multiple images in one request
- **Zero-temp-file design** — images processed in memory
- **Thread-safe** model registry
- **Request timing** header on every response (`X-Process-Time-Ms`)
- **Dark-mode web UI** with drag-and-drop upload

---

## Project Structure

```
ml-service/
├── construction_progress_colab.py  # inference module (model + predict)
├── construction_api.py             # FastAPI server
├── index.html                      # web frontend
├── test_prediction.py              # CLI test script
├── requirements_construction.txt   # Python dependencies
├── .gitignore
├── README.md
└── construction_model.pth          # ← train in Colab, place here
```

---

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements_construction.txt
```

### 2. Train the model (Google Colab)

Open the Colab training notebook, mount your Drive, and run all cells.
The notebook saves `construction_model.pth` — download it and place it in this folder.

### 3. Test locally (no server needed)

```bash
python test_prediction.py path/to/site_photo.jpg
```

### 4. Start the API

```bash
uvicorn construction_api:app --host 0.0.0.0 --port 8000 --reload
```

Open the interactive docs: http://localhost:8000/docs

### 5. Open the web UI

Open `index.html` in any browser. Set the API URL to `http://localhost:8000`.

---

## API Reference

### `POST /predict`

Upload a construction site image.

```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@site_photo.jpg"
```

**Response:**
```json
{
  "phase": "structure",
  "progress": 50,
  "confidence": 91.34,
  "all_scores": {
    "terrassement": 0.21,
    "fondation": 1.05,
    "structure": 91.34,
    "second_oeuvre": 5.82,
    "finition": 1.58
  },
  "inference_ms": 38.7
}
```

### `POST /predict/batch`

Upload up to 16 images in one request.

```bash
curl -X POST http://localhost:8000/predict/batch \
  -F "files=@img1.jpg" \
  -F "files=@img2.jpg"
```

### `GET /health`

```json
{
  "status": "ok",
  "model_loaded": true,
  "device": "cpu",
  "classes": ["terrassement", "fondation", "structure", "second_oeuvre", "finition"],
  "loaded_at": "2025-01-01T12:00:00",
  "total_preds": 42
}
```

### `GET /phases`

```json
[
  { "phase": "terrassement",  "progress_pct": 5  },
  { "phase": "fondation",     "progress_pct": 20 },
  { "phase": "structure",     "progress_pct": 50 },
  { "phase": "second_oeuvre", "progress_pct": 75 },
  { "phase": "finition",      "progress_pct": 95 }
]
```

---

## Deployment (Free Tiers)

### Option 1 — Render

1. Push to a GitHub repo (exclude `construction_model.pth` — too large for free tier)
2. Host the model on **HuggingFace Hub** or **Google Drive** and download at startup:
   ```python
   # Add to startup_event in construction_api.py
   import urllib.request
   urllib.request.urlretrieve(os.environ["MODEL_URL"], MODEL_SAVE_PATH)
   ```
3. Create a new **Web Service** on [render.com](https://render.com):
   - Runtime: **Python 3**
   - Build command: `pip install -r requirements_construction.txt`
   - Start command: `uvicorn construction_api:app --host 0.0.0.0 --port $PORT`
4. Add `MODEL_URL` as an environment variable in Render dashboard

### Option 2 — HuggingFace Spaces (Easiest)

1. Create a Space on [huggingface.co/spaces](https://huggingface.co/spaces)
2. Choose **Docker** as the SDK
3. Upload the model to a separate HuggingFace Model repo
4. `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements_construction.txt .
RUN pip install --no-cache-dir -r requirements_construction.txt
COPY . .
CMD ["uvicorn", "construction_api:app", "--host", "0.0.0.0", "--port", "7860"]
```
5. Expose port `7860` (HF Spaces default)

### Option 3 — Railway

1. Push to GitHub
2. Connect repo on [railway.app](https://railway.app)
3. Add start command: `uvicorn construction_api:app --host 0.0.0.0 --port $PORT`
4. Add `MODEL_URL` env variable

---

## Phase → Progress Map

| Phase | Icon | Progress |
|-------|------|----------|
| terrassement | 🚜 | 5% |
| fondation | ⚓ | 20% |
| structure | 🏗️ | 50% |
| second_oeuvre | 🔧 | 75% |
| finition | ✨ | 95% |

---

## License

MIT — free to use, modify, and deploy.
