from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
from sklearn.decomposition import PCA as SklearnPCA

from backend.model import PCAManager, MNISTManager
from backend.utils import (
    get_base64_image, calculate_mse, calculate_compression_ratio,
    preprocess_uploaded_image, patch_pca_compress
)

app = FastAPI(title="Dimensionality Reduction API - React integration")

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
    Fit PCA once with k_max on MNIST, then compute MSE, variance%, and
    compression_ratio for k = 1..k_max (step k_step) on a random sample.
    Returns ready-to-chart data for the Analytics page.
    """
    try:
        # 1. Load data + random sample
        data = MNISTManager.get_data(max_samples=2000)
        sample = data[np.random.randint(0, len(data))]  # shape (784,)

        # 2. Fit ONE PCA with k_max components (reuse if cached)
        k_max_clamped = min(k_max, 150)
        if k_max_clamped not in PCAManager._cache:
            pca_full = SklearnPCA(n_components=k_max_clamped, whiten=True, svd_solver='randomized')
            pca_full.fit(data)
            PCAManager._cache[k_max_clamped] = pca_full
        pca_full = PCAManager._cache[k_max_clamped]

        # cumulative explained variance ratios from the full model
        cum_var = np.cumsum(pca_full.explained_variance_ratio_) * 100  # shape (k_max,)

        # project sample into full latent space once
        sample_2d = sample.reshape(1, -1)
        z_full = pca_full.transform(sample_2d)  # (1, k_max)

        points = []
        for k in range(1, k_max_clamped + 1, k_step):
            # reconstruct using only first k components
            z_k = z_full.copy()
            z_k[:, k:] = 0  # zero out remaining components
            recon = pca_full.inverse_transform(z_k)
            mse = float(np.mean((sample - recon[0]) ** 2))
            variance_pct = float(cum_var[k - 1])
            comp_ratio = round(784 / k, 2)
            quality_score = max(0.0, min(100.0, 100.0 - mse * 2000))
            points.append({
                "k": k,
                "mse": round(mse, 6),
                "variance_pct": round(variance_pct, 2),
                "compression_ratio": comp_ratio,
                "quality_score": round(quality_score, 1),
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
