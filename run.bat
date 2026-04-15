@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ========================================================
echo   PCA Matrix - Setup and Start
echo ========================================================

:: 1. Check dependencies
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.9+.
    pause
    exit /b 1
)
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm is not installed or not in PATH. Please install Node.js.
    pause
    exit /b 1
)

:: 2. Virtual environment
echo [1/4] Setting up Python virtual environment...
if not exist "venv" (
    python -m venv venv
)
call venv\Scripts\activate.bat
python -m pip install -q --upgrade pip
pip install -q -r backend\requirements.txt

:: 3. Node modules
echo [2/4] Setting up frontend dependencies...
if not exist "frontend\node_modules" (
    cd frontend
    call npm install --silent
    cd ..
)

:: 4. Model & Data cache
echo [3/4] Checking pre-trained models and data cache...
set "MODEL_PATH=backend\pca_master_k150.pkl"
set "NPY_PATH=backend\mnist_samples_2000.npy"
set "BASE_URL=https://github.com/ritheshh-cmyk/imagedim/releases/download/v1.0.0"

if not exist "%MODEL_PATH%" (
    echo       Downloading PCA model...
    curl -fsSL "%BASE_URL%/pca_master_k150.pkl" -o "%MODEL_PATH%"
)

if not exist "%NPY_PATH%" (
    echo       Downloading MNIST sample cache...
    curl -fsSL "%BASE_URL%/mnist_samples_2000.npy" -o "%NPY_PATH%"
)

echo [4/4] Starting servers...
echo.
echo  FastAPI Backend: http://127.0.0.1:8000
echo  Vite Frontend:   http://localhost:5173
echo.
echo Keep this window open. Close or press Ctrl+C to stop.
echo ========================================================

:: Start backend in a new command window so it runs concurrently
start "PCA Matrix Backend" cmd /k "call venv\Scripts\activate.bat && uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"

:: Start frontend in this window
cd frontend
npm run dev -- --port 5173 --host
