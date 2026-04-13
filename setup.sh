#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  PCA Matrix — First-Time Setup Script
#  Run once after cloning: bash setup.sh
#  Then start the app:     ./start.sh
# ══════════════════════════════════════════════════════════════
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Colors ───────────────────────────────────────────────────
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'
C='\033[0;36m'; B='\033[1m'; N='\033[0m'

step() { echo -e "\n${B}${C}[$1]${N} $2"; }
ok()   { echo -e "  ${G}✓${N}  $1"; }
warn() { echo -e "  ${Y}⚠${N}  $1"; }
fail() { echo -e "  ${R}✗${N}  $1" >&2; exit 1; }

echo -e "${B}"
cat << 'EOF'
  ╔══════════════════════════════════════════╗
  ║   PCA Matrix — Setup                    ║
  ║   Principal Component Analysis Toolkit  ║
  ╚══════════════════════════════════════════╝
EOF
echo -e "${N}"

# ── 1. Check dependencies ─────────────────────────────────────
step "1/5" "Checking system requirements…"
for cmd in python3 node npm pip3; do
  if command -v "$cmd" &>/dev/null; then
    ok "$cmd $(${cmd} --version 2>&1 | head -1)"
  else
    fail "$cmd is required but not found. Please install it first."
  fi
done

# ── 2. Python virtual environment ────────────────────────────
step "2/5" "Setting up Python virtual environment…"
if [ ! -d "$ROOT/venv" ]; then
  python3 -m venv "$ROOT/venv"
  ok "venv created"
else
  ok "venv already exists"
fi

# Activate and install requirements
source "$ROOT/venv/bin/activate"
pip install --quiet --upgrade pip
pip install --quiet -r "$ROOT/backend/requirements.txt"
ok "Python dependencies installed"

# ── 3. Node modules ───────────────────────────────────────────
step "3/5" "Installing frontend Node.js dependencies…"
cd "$ROOT/frontend"
npm install --silent
ok "node_modules ready"
cd "$ROOT"

# ── 4. Pre-trained model ──────────────────────────────────────
step "4/5" "Setting up pre-trained PCA model…"
MODEL_PATH="$ROOT/backend/pca_master_k150.pkl"
MODEL_URL="https://github.com/ritheshh-cmyk/imagedim/releases/download/v1.0.0/pca_master_k150.pkl"

if [ -f "$MODEL_PATH" ]; then
  ok "Model already exists → skipping download"
else
  echo -e "  ${C}↓${N}  Downloading pre-trained model (~930 KB)…"
  if curl -fsSL "$MODEL_URL" -o "$MODEL_PATH" 2>/dev/null; then
    ok "Model downloaded from GitHub Releases"
  else
    warn "Download failed — will train model on first server start (~10s, one-time)"
  fi
fi

# ── 5. chmod start script ─────────────────────────────────────
step "5/5" "Making start.sh executable…"
chmod +x "$ROOT/start.sh"
ok "start.sh is ready"

# ── Done ──────────────────────────────────────────────────────
echo -e "\n${B}${G}══ Setup complete! ══════════════════════════${N}\n"
echo -e "  Start the app with:"
echo -e "  ${B}  ./start.sh${N}\n"
echo -e "  Then open: ${C}http://localhost:5173${N}"
echo -e ""
echo -e "  Routes:"
echo -e "  ${C}/${N}            Landing page & overview"
echo -e "  ${C}/dashboard${N}   Compression lab — upload & process images"
echo -e "  ${C}/analytics${N}   Accuracy curves & metrics charts"
echo -e "  ${C}/theory${N}      PCA math theory & formulas"
echo ""
