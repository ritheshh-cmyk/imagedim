from contextlib import asynccontextmanager
import threading
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np

from backend.model import PCAManager, MNISTManager, MASTER_K
from backend.utils import (
    get_base64_image, calculate_mse, calculate_compression_ratio,
    preprocess_uploaded_image, patch_pca_compress
)

# ── Pre-warm the model at server startup (background thread) ────
def _warmup():
    """Load or train the master PCA model once at startup."""
    try:
        PCAManager.get_master()   # loads from disk or trains + saves
        print("🚀 Model warm-up complete — all requests will be instant.")
    except Exception as e:
        print(f"⚠️  Warm-up failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background warm-up so uvicorn becomes ready immediately
    threading.Thread(target=_warmup, daemon=True, name="pca-warmup").start()
    yield  # server is running

app = FastAPI(title="Dimensionality Reduction API - React integration", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TrainRequest(BaseModel):
    n_components: int = Field(ge=1, le=784)

class ProcessRequest(BaseModel):
    n_components: int = Field(ge=1, le=784)
    image: List[float] = Field(..., max_length=784, min_length=784)

class CompressRequest(ProcessRequest):
    pass

class ReconstructRequest(BaseModel):
    n_components: int = Field(ge=1, le=784)
    compressed_vector: List[float]


@app.get("/api/sample")
def get_sample_image():
    """Returns a random 784-dim array representing an MNIST handwritten digit."""
    try:
        data = MNISTManager.get_random_sample()
        return {"image": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload_preprocess")
async def upload_preprocess(file: UploadFile = File(...)):
    """Receives an image, resizes to 28x28, converts to grayscale, normalizes and flattens (MNIST mode)."""
    try:
        contents = await file.read()
        flattened_array = preprocess_uploaded_image(contents)
        return {"image": flattened_array}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process_image")
async def process_image_file(
    file: UploadFile = File(...),
    n_components: int = 10,
    patch_size: int = 16,
):
    """
    Patch-based PCA on ANY uploaded image at its NATIVE resolution.
    Works on 4K, HD, or any size. No MNIST model needed.
    Splits image into patch_size×patch_size blocks, applies PCA,
    reconstructs, and returns both images + metrics.
    """
    try:
        contents = await file.read()
        # Clamp n_components to proper channels and restrict to show visible compression
        max_k = patch_size * patch_size * 3
        max_allowed = min(150, max_k - 1)
        n_components = max(1, min(n_components, max_allowed))
        result = patch_pca_compress(contents, n_components=n_components, patch_size=patch_size)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sweep_mnist")
def sweep_mnist(k_max: int = 100, k_step: int = 2):
    """
    Uses the pre-trained master PCA model (trained once at startup / loaded from disk).
    Computes MSE, variance%, compression_ratio for k = 1..min(k_max, MASTER_K).
    No re-training ever happens here.
    """
    try:
        # Use master model — already in memory from startup warm-up
        master = PCAManager.get_master()
        data   = MNISTManager.get_data()
        sample = data[np.random.randint(0, len(data))]

        k_max_clamped = min(k_max, MASTER_K)
        cum_var = np.cumsum(master.explained_variance_ratio_[:k_max_clamped]) * 100

        # Project once into full latent space
        z_full = master.transform(sample.reshape(1, -1))   # (1, MASTER_K)

        points = []
        for k in range(1, k_max_clamped + 1, k_step):
            z_k       = z_full.copy()
            z_k[:, k:] = 0
            recon     = master.inverse_transform(z_k)
            mse       = float(np.mean((sample - recon[0]) ** 2))
            var_pct   = float(cum_var[k - 1])
            comp_ratio = round(784 / k, 2)
            quality   = max(0.0, min(100.0, 100.0 - mse * 2000))
            points.append({
                "k": k,
                "mse": round(mse, 6),
                "variance_pct": round(var_pct, 2),
                "compression_ratio": comp_ratio,
                "quality_score": round(quality, 1),
            })

        return {"sweep": points, "k_max": k_max_clamped, "total_dims": 784}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
def train_model(req: TrainRequest):
    """Explicitly trains/caches the PCA model for a specific component size."""
    try:
        PCAManager.get_model(req.n_components)
        return {"status": "trained", "n_components": req.n_components}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compress")
def compress_endpoint(req: CompressRequest):
    try:
        img_arr = np.array(req.image, dtype=float)
        compressed = PCAManager.compress(req.n_components, img_arr)
        return {"compressed_vector": compressed[0].tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reconstruct")
def reconstruct_endpoint(req: ReconstructRequest):
    try:
        comp_arr = np.array(req.compressed_vector, dtype=float).reshape(1, -1)
        recon = PCAManager.reconstruct(req.n_components, comp_arr)
        
        recon_img = recon[0].reshape(28, 28)
        b64 = get_base64_image(recon_img)
        return {"reconstructed_image_b64": f"data:image/png;base64,{b64}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process")
def process_endpoint(req: ProcessRequest):
    """
    Takes an image and `n_components`. 
    Returns compressed vector, reconstructed image (base64), compression ratio, and MSE.
    """
    try:
        img_arr = np.array(req.image, dtype=float)
        
        # 1. Compress
        compressed = PCAManager.compress(req.n_components, img_arr)
        
        # 2. Reconstruct
        reconstructed = PCAManager.reconstruct(req.n_components, compressed)
        
        # 3. Calculate metrics
        mse = calculate_mse(img_arr, reconstructed[0])
        comp_ratio = calculate_compression_ratio(784, req.n_components)
        
        # 4. Generate Images
        orig_b64 = get_base64_image(img_arr.reshape(28, 28))
        recon_b64 = get_base64_image(reconstructed[0].reshape(28, 28))
        
        return {
            "compressed_vector": compressed[0].tolist(),
            "original_image_b64": f"data:image/png;base64,{orig_b64}",
            "reconstructed_image_b64": f"data:image/png;base64,{recon_b64}",
            "compression_ratio": comp_ratio,
            "mse": mse,
            "n_components": req.n_components
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
