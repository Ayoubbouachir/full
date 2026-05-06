@echo off
echo ==========================================
echo DEMARRAGE COMPLET DU PROJET FULLSTAKERS
echo ==========================================

:: 1. Backend (NestJS)
echo [1/4] Lancement du Backend (NestJS)...
start "Backend" cmd /k "cd back-end && npm run start:dev"

:: 2. Voice API (FastAPI)
echo [2/4] Lancement de la Voice API...
start "Voice API" cmd /k "cd voice-api && .\venv2\Scripts\activate && python -m uvicorn main:app --reload --port 8001"

:: 3. ML Service (FastAPI)
:: Note: Si main.py est vide, uvicorn affichera une erreur.
echo [3/4] Lancement du ML Service...
start "ML Service" cmd /k "cd ml-service && .\venv\Scripts\activate && python -m uvicorn backend_final:app --reload --port 8000"

:: 4. Frontend (React)
echo [4/4] Lancement du Frontend (React)...
start "Frontend" cmd /k "cd front-end && npm start"

echo.
echo ==========================================
echo Tous les services sont lances !
echo - Backend: http://localhost:3000
echo - Frontend: http://localhost:3001
echo - Voice API: http://localhost:8001
echo - ML Service: http://localhost:8000
echo.
echo Assurez-vous que MongoDB est bien lance sur le port 27017.
echo ==========================================
pause
