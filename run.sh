#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

echo -e "\n${BOLD}${CYAN}========================================================${RESET}"
echo -e "${BOLD}  PCA Matrix - Setup and Start${RESET}"
echo -e "${BOLD}${CYAN}========================================================${RESET}\n"

# 1. Dependencies
for cmd in python3 npm curl; do
  if ! command -v $cmd &> /dev/null; then
    echo -e "${RED}[ERROR] $cmd is required but not installed.${RESET}"
    exit 1
  fi
done

# 2. Virtual Env
echo -e "${GREEN}[1/4] Setting up Python virtual environment...${RESET}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r backend/requirements.txt

# 3. Node modules
echo -e "${GREEN}[2/4] Setting up frontend dependencies...${RESET}"
if [ ! -d "frontend/node_modules" ]; then
    cd frontend && npm install --silent && cd ..
fi

# 4. Model & Data cache
echo -e "${GREEN}[3/4] Checking pre-trained models and data cache...${RESET}"
MODEL_PATH="backend/pca_master_k150.pkl"
NPY_PATH="backend/mnist_samples_2000.npy"
BASE_URL="https://github.com/ritheshh-cmyk/imagedim/releases/download/v1.0.0"

if [ ! -f "$MODEL_PATH" ]; then
    echo "      Downloading PCA model (~930 KB)..."
    curl -fsSL "$BASE_URL/pca_master_k150.pkl" -o "$MODEL_PATH" || echo -e "      ${YELLOW}Download failed, will train on start${RESET}"
fi
if [ ! -f "$NPY_PATH" ]; then
    echo "      Downloading MNIST sample cache (~6 MB)..."
    curl -fsSL "$BASE_URL/mnist_samples_2000.npy" -o "$NPY_PATH" || echo -e "      ${YELLOW}Download failed${RESET}"
fi

echo -e "\n${GREEN}[4/4] Starting servers...${RESET}"
echo -e "      Backend: http://127.0.0.1:8000"
echo -e "      Frontend: http://localhost:5173\n"
echo -e "Press ${BOLD}Ctrl+C${RESET} to stop.\n"

cleanup() {
  echo -e "\n${YELLOW}Shutting down...${RESET}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  echo -e "${RED}Stopped.${RESET}"
  exit 0
}
trap cleanup INT TERM

# Start backend
uvicorn backend.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

sleep 1

# Start frontend
cd frontend
npm run dev -- --port 5173 &
FRONTEND_PID=$!

wait