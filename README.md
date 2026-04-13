# PCA Matrix — Image Compression via Dimensionality Reduction

> **Compress any image mathematically.** No neural networks, no GPU, no training data.  
> Pure linear algebra: Principal Component Analysis (PCA) reduces high-dimensional image patches to their most essential components.

---

## What This Does

Upload any JPEG, PNG, or WebP image. The app splits it into small patches, runs PCA on each patch set, and reconstructs an approximate image using only `k` principal components instead of the full pixel representation. You control `k` — fewer components means a smaller file and blurrier output; more components retain sharper detail.

**Key capabilities:**
- Native RGB compression (no downscaling to 28×28)  
- Patch-based architecture — scales to 4K images  
- Configurable patch size: 4×4 (48D), 8×8 (192D), 16×16 (768D)  
- Real-time quality metrics: MSE, compression ratio, variance retained  
- MNIST digit mode for quick dimensionality reduction demos  

---

## How PCA Compression Works

```
Input Image (H × W × 3)
        │
        ▼
Patch Extraction  —  split into non-overlapping N×N×3 patches
        │                each patch = N²×3 dimensional vector
        ▼
PCA Fit  —  Randomised SVD on a 2,500-patch random subset
        │   finds eigenvectors (directions of maximum variance)
        ▼
Compress  —  project all patches onto top-k eigenvectors
        │    192D patch  →  k-dimensional latent code
        ▼
Reconstruct  —  inverse_transform: k-dim  →  192D approximation
        │
        ▼
Stitch Output  —  reassemble patches → full image (H × W × 3)
```

**Mathematical core:**

| Symbol | Meaning |
|--------|---------|
| **X** | Data matrix of shape (N_patches, patch_dim) |
| **W** | PCA weight matrix (top-k eigenvectors), shape (patch_dim, k) |
| **z** | Compressed code: `z = (X − μ) · W`, shape (N_patches, k) |
| **X̂** | Reconstructed: `X̂ = z · Wᵀ + μ` |
| **MSE** | `mean((X − X̂)²) × 255²` — pixel-level error |
| **Variance %** | `Σ(selected eigenvalues) / Σ(all eigenvalues) × 100` |

---

## Architecture

```
cse275cs2/
├── backend/
│   ├── main.py          # FastAPI app — REST endpoints
│   ├── model.py         # MNISTManager (lazy) + PCAManager
│   ├── utils.py         # patch extraction, PCA pipeline, base64 encode
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx       # Overview page — pipeline diagram, glossary
│   │   │   └── Dashboard.jsx  # Compression UI — upload, slider, images, metrics
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── api.js             # Axios API layer
│   │   └── index.css          # Gray/white design system
│   ├── package.json
│   └── vite.config.js
└── run.sh               # One-command startup
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sample` | Returns a random MNIST digit as a 784-dim array |
| `POST` | `/process_image?n_components=k&patch_size=8` | **Main endpoint** — patch-based PCA on any uploaded image |
| `POST` | `/process` | MNIST flat-vector PCA (784D input) |
| `POST` | `/train` | Pre-trains and caches a PCA model for given k |
| `POST` | `/compress` | Compress a 784-dim MNIST vector to k components |
| `POST` | `/reconstruct` | Reconstruct from a compressed vector |

### `/process_image` — Request

```bash
curl -X POST "http://localhost:8000/process_image?n_components=20&patch_size=8" \
     -F "file=@myimage.jpg"
```

### `/process_image` — Response

```json
{
  "original_image_b64": "data:image/png;base64,…",
  "reconstructed_image_b64": "data:image/png;base64,…",
  "compression_ratio": 4.57,
  "mse": 12.34,
  "n_components": 20,
  "patch_size": 8,
  "n_patches": 3456,
  "original_resolution": "600×450",
  "variance_retained_pct": 91.3
}
```

---

## Setup & Run

### Requirements

- Python 3.9+
- Node.js 18+

### One-command startup

```bash
git clone https://github.com/YOUR_USERNAME/cse275cs2.git
cd cse275cs2
bash run.sh
```

This will:
1. Create a Python virtual environment
2. Start the FastAPI backend on `http://localhost:8000`
3. Start the Vite frontend on `http://localhost:5173`

### Manual setup

```bash
# Backend
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | FastAPI + Uvicorn |
| PCA engine | scikit-learn `PCA(svd_solver='randomized')` |
| Image processing | Pillow (PIL) |
| Numerical core | NumPy |
| Frontend framework | React 19 + Vite 8 |
| Routing | React Router v7 |
| HTTP client | Axios |
| CSS | Tailwind CSS v4 + Custom design system |
| Icons | Lucide React |
| Dataset (optional) | MNIST via `fetch_openml` (lazy-loaded) |

---

## Design Decisions

**Why patch-based?**  
Flattening an entire HD image into one vector (e.g., 1920×1080×3 = 6.2M dims) makes PCA impractical. Splitting into 8×8 patches (192D each) keeps the covariance matrix at 192×192 — trivially fast to decompose.

**Why randomised SVD?**  
sklearn's `svd_solver='randomized'` only computes the top-k singular values/vectors, making it O(n·k) instead of O(n³). Perfect for incremental dimensionality reduction.

**Why lazy-loading MNIST?**  
The MNIST dataset is 55MB. Loading it at server startup would freeze the backend every cold boot. It's only fetched from OpenML if you explicitly click "Load Random MNIST Digit".

---

## License

MIT — free to use, modify, and distribute.
