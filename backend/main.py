from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import numpy as np

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

@app.on_event("startup")
def preload():
    # Warm up dataset loading in background thread (optional but good practice)
    print("Initializing MNIST Dataset...")
    MNISTManager.get_data()
    print("Ready!")

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
    n_components: int = 16,
    patch_size: int = 8,
):
    """
    Patch-based PCA on ANY uploaded image at its NATIVE resolution.
    Works on 4K, HD, or any size. No MNIST model needed.
    Splits image into patch_size×patch_size blocks, applies PCA,
    reconstructs, and returns both images + metrics.
    """
    try:
        contents = await file.read()
        # Clamp n_components to a sensible upper bound for patch_size
        max_k = patch_size * patch_size
        n_components = max(1, min(n_components, max_k - 1))
        result = patch_pca_compress(contents, n_components=n_components, patch_size=patch_size)
        return result
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
