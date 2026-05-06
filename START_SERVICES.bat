@echo off
echo ==========================================
echo DEMARRAGE COMPLET DU PROJET FULLSTAKERS
echo ==========================================

:: 1. Backend (NestJS)
echo [1/5] Lancement du Backend (NestJS)...
start "Backend" cmd /k "cd back-end && npm run start:dev"

:: 2. Voice API (FastAPI)
echo [2/5] Lancement de la Voice API...
start "Voice API" cmd /k "cd voice-api && python -m uvicorn main:app --reload --port 8001"

:: 3. ML Service (FastAPI)
echo [3/5] Lancement du ML Service...
start "ML Service" cmd /k "cd ml-service && python -m uvicorn main:app --reload --port 8000"

:: 4. Road Speed Predictor (FastAPI)
echo [4/5] Lancement du Road Speed Predictor...
start "Aitime Speed" cmd /k "cd front-end\Aitime && python -m uvicorn deploy_model:app --reload --port 8002"

:: 5. Frontend (React)
echo [5/5] Lancement du Frontend (React)...
start "Frontend" cmd /k "cd front-end && npm start"

echo.
echo ==========================================
echo Tous les services sont lances !
echo - Backend: http://localhost:3100
echo - ML Service: http://localhost:8000
echo - Voice API: http://localhost:8001
echo - Road Predictor: http://localhost:8002
echo - Frontend: http://localhost:3001
echo.
echo Assurez-vous que MongoDB est bien lance sur le port 27017.
echo ==========================================
pause
