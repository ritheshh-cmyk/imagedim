# PCA Matrix

**Principal Component Analysis — Image Compression Toolkit**

A full-stack web application that compresses images using PCA (Principal Component Analysis), visualises dimensionality reduction in real-time, and provides interactive accuracy curves and mathematical theory — all in a clean, glassmorphic dashboard.

---

## ✨ Features

| Page | Description |
|---|---|
| **Overview** `/` | Landing page — what PCA is and how the app works |
| **Dashboard** `/dashboard` | Upload any image or try MNIST demo, adjust components, compare input vs output |
| **Analytics** `/analytics` | Live accuracy curves: MSE, variance retained, compression ratio, quality score |
| **Theory** `/theory` | Step-by-step PCA math — centering, covariance, eigenvectors, reconstruction |

- 🖼️ Upload any JPEG/PNG/WebP image → compress with PCA → compare side-by-side
- 📊 Interactive SVG charts (no dependencies) — hover for values
- ⚡ Pre-trained model loaded from disk at startup — zero wait on first request
- 🔢 Real metrics: MSE, compression ratio, variance retained, quality score
- 🏛️ Mathematical theory page with formulas for every step

---

## 🚀 Quick Start (one-time setup)

```bash
# 1. Clone the repository
git clone https://github.com/ritheshh-cmyk/imagedim.git
cd imagedim

# 2. Run setup (installs deps + downloads pre-trained model)
bash setup.sh

# 3. Start both backend and frontend
./start.sh
```

Then open **http://localhost:5173** in your browser.

> **The pre-trained model (~930 KB) is downloaded automatically** in step 2.
> If the download fails, the server trains it on first launch (~10 seconds, one-time).

---

## 📦 Manual Setup (if you prefer step-by-step)

```bash
# Python backend
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install && cd ..

# Download pre-trained model (optional — auto-trains if missing)
curl -fsSL https://github.com/ritheshh-cmyk/imagedim/releases/download/v1.0.0/pca_master_k150.pkl \
     -o backend/pca_master_k150.pkl

# Start
./start.sh
```

---

## 🏗️ Architecture

```
imagedim/
├── backend/
│   ├── main.py          # FastAPI app, lifespan startup, endpoints
│   ├── model.py         # PCAManager — disk-cached master model (k=150)
│   ├── utils.py         # Image preprocessing, patch-PCA for HD images
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx       # Landing page
│       │   ├── Dashboard.jsx  # Compression lab
│       │   ├── Analytics.jsx  # Accuracy charts (pure SVG)
│       │   └── Theory.jsx     # Math theory
│       ├── components/
│       │   └── Navbar.jsx     # Fixed pill navbar (4 links)
│       └── api.js             # Axios client
├── setup.sh   # First-time setup (run once)
├── start.sh   # Start backend + frontend together
└── README.md
```

### Backend endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/sample` | Random MNIST digit |
| `POST` | `/process` | Compress MNIST digit (JSON, 784 floats) |
| `POST` | `/process_image` | Compress uploaded image (multipart, any size) |
| `GET` | `/api/sweep_mnist` | k-sweep metrics for Analytics page |
| `POST` | `/train` | Pre-cache a specific k model |

### Tech stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18 + Vite + React Router |
| **Styling** | Vanilla CSS + glassmorphism |
| **Backend** | FastAPI + uvicorn |
| **ML** | scikit-learn PCA (randomized SVD) |
| **Model persistence** | joblib |
| **Charts** | Pure SVG (zero chart library deps) |

---

## 🧮 How the PCA Compression Works

1. **Train once** — Fit `PCA(k=150)` on 2000 MNIST digits (or the first uploaded image batch). Saved to `backend/pca_master_k150.pkl`.
2. **Compress** — Project the 784-dimensional pixel vector onto the top-k principal axes → k-dimensional latent vector.
3. **Reconstruct** — Multiply back through the component matrix + add mean → approximate image.
4. **HD images** — Split into 16×16 patches, apply patch-level PCA, reassemble.

The Analytics page plots MSE, variance retained, and compression ratio for every k from 1 to 150 — computed in a single backend call by slicing the master model's component matrix.

---

## ⚙️ Configuration

| Variable | Default | Description |
|---|---|---|
| Backend port | `8000` | Change in `start.sh` |
| Frontend port | `5173` | Change in `start.sh` |
| Max k | `150` | `MASTER_K` in `backend/model.py` |
| Patch size (HD) | `16px` | `patch_size` param in `/process_image` |
| MNIST samples | `2000` | `MAX_SAMPLES` in `backend/model.py` |

---

## 📋 Requirements

- **Python** 3.9+
- **Node.js** 18+ and npm
- ~1 GB disk (MNIST download on first train) / or just the 930 KB `.pkl` (auto-downloaded)
- No GPU required — runs on CPU

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

<p align="center">Built by <a href="https://github.com/ritheshh-cmyk">ritheshh-cmyk</a></p>
