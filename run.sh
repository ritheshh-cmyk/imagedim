#!/bin/bash
echo "Setting up virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
echo "Starting backend server and frontend dev server..."
# Run Uvicorn in the background and then start Vite
npx concurrently -n "FastAPI,Vite" -c "blue,green" \
    "uvicorn backend.main:app --host 0.0.0.0 --port 8000" \
    "cd frontend && npm run dev"