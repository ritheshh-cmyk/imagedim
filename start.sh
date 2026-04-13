#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  PCA Matrix — Start Script
#  Launches backend (FastAPI) + frontend (Vite)
# ─────────────────────────────────────────────

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

echo -e "${BOLD}"
echo "  ██████   ██████  █████      ███    ███  █████  ████████ ██████  ██ ██   ██"
echo "  ██   ██ ██      ██   ██     ████  ████ ██   ██    ██    ██   ██ ██  ██ ██ "
echo "  ██████  ██      ███████     ██ ████ ██ ███████    ██    ██████  ██   ███  "
echo "  ██      ██      ██   ██     ██  ██  ██ ██   ██    ██    ██   ██ ██  ██ ██ "
echo "  ██       ██████ ██   ██     ██      ██ ██   ██    ██    ██   ██ ██ ██   ██"
echo -e "${RESET}"
echo -e "${CYAN}  Dimensionality Reduction · FastAPI + React${RESET}"
echo -e "  ─────────────────────────────────────────────"
echo ""

# ── Check venv ──────────────────────────────
if [ ! -f "$ROOT/venv/bin/uvicorn" ]; then
  echo -e "${RED}✗ venv not found. Run:${RESET}"
  echo "    cd $ROOT && python3 -m venv venv && source venv/bin/activate && pip install -r backend/requirements.txt"
  exit 1
fi

# ── Check node_modules ──────────────────────
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo -e "${YELLOW}⚠  node_modules missing — installing…${RESET}"
  cd "$ROOT/frontend" && npm install
  cd "$ROOT"
fi

echo -e "${GREEN}▶  Starting backend  →  http://localhost:8000${RESET}"
echo -e "${GREEN}▶  Starting frontend →  http://localhost:5173${RESET}"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop both servers"
echo -e "  ─────────────────────────────────────────────"
echo ""

# ── Cleanup on Ctrl+C ───────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down…${RESET}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  echo -e "${RED}✓ Stopped.${RESET}"
  exit 0
}
trap cleanup INT TERM

# ── Backend ─────────────────────────────────
(
  cd "$ROOT"
  while IFS= read -r line; do
    echo -e "${CYAN}[backend]${RESET}  $line"
  done < <(./venv/bin/uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000 2>&1)
) &
BACKEND_PID=$!

# Small delay so backend starts first
sleep 1

# ── Frontend ────────────────────────────────
(
  cd "$ROOT/frontend"
  while IFS= read -r line; do
    echo -e "${GREEN}[frontend]${RESET} $line"
  done < <(npm run dev -- --port 5173 2>&1)
) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
