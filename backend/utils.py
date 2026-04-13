import io
import base64
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image
from sklearn.decomposition import PCA


# ─────────────────────────────────────────────
# Shared helpers
# ─────────────────────────────────────────────

def ndarray_to_base64(img_array: np.ndarray) -> str:
    """Converts a [H,W] or [H,W,3] float array → PNG → base64 string."""
    clipped = np.clip(img_array * 255, 0, 255).astype(np.uint8)
    mode = 'RGB' if img_array.ndim == 3 else 'L'
    pil_img = Image.fromarray(clipped, mode=mode)
    buf = io.BytesIO()
    pil_img.save(buf, format='PNG')
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')


def pil_to_base64(pil_img: Image.Image, fmt="PNG") -> str:
    """Converts a PIL Image directly to a base64 string."""
    buf = io.BytesIO()
    pil_img.save(buf, format=fmt)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')


def get_base64_image(img_array: np.ndarray) -> str:
    """Legacy helper — kept for MNIST endpoint compatibility."""
    return ndarray_to_base64(img_array)


def calculate_mse(original: np.ndarray, reconstructed: np.ndarray) -> float:
    return float(np.mean((original.flatten() - reconstructed.flatten()) ** 2))


def calculate_compression_ratio(original_features: int, n_components: int) -> float:
    return float(original_features / n_components) if n_components > 0 else 0.0


# ─────────────────────────────────────────────
# MNIST path (28×28 → 784-dim flat)
# ─────────────────────────────────────────────

def preprocess_uploaded_image(image_bytes: bytes) -> list:
    """
    Converts an uploaded image to a 28×28 grayscale flat array
    so it can be fed into the MNIST PCA model (784 dims).
    Also returns the original image as base64 for display.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert('L')
    image = image.resize((28, 28), Image.Resampling.LANCZOS)
    img_array = np.array(image, dtype=float) / 255.0

    # Auto-invert: MNIST expects white strokes on black
    corners = [img_array[0, 0], img_array[0, 27], img_array[27, 0], img_array[27, 27]]
    if np.mean(corners) > 0.5:
        img_array = 1.0 - img_array

    return img_array.flatten().tolist()


# ─────────────────────────────────────────────
# Patch-based PCA — works on ANY image size
# ─────────────────────────────────────────────

def _extract_patches(color_array: np.ndarray, patch_size: int) -> tuple:
    """
    Splits a 3D RGB image into non-overlapping patches.
    Returns: (patches [N, P*P*3], padded_h, padded_w)
    """
    h, w, c = color_array.shape
    p = patch_size

    # Pad so dimensions are divisible by patch_size
    pad_h = (p - (h % p)) % p
    pad_w = (p - (w % p)) % p
    padded = np.pad(color_array, ((0, pad_h), (0, pad_w), (0, 0)), mode='reflect')
    ph, pw, _ = padded.shape

    n_rows, n_cols = ph // p, pw // p
    patches = padded.reshape(n_rows, p, n_cols, p, c).swapaxes(1, 2).reshape(-1, p * p * c)
    return patches, ph, pw, h, w


def _reconstruct_from_patches(patches: np.ndarray, padded_h: int, padded_w: int,
                               orig_h: int, orig_w: int, patch_size: int) -> np.ndarray:
    """Re-assembles patches back into a 3D image."""
    p = patch_size
    c = 3
    n_rows, n_cols = padded_h // p, padded_w // p
    grid = patches.reshape(n_rows, n_cols, p, p, c).swapaxes(1, 2).reshape(padded_h, padded_w, c)
    return grid[:orig_h, :orig_w]


def patch_pca_compress(image_bytes: bytes, n_components: int, patch_size: int = 8) -> dict:
    """
    Full patch-based PCA compression pipeline for any image.
    
    Steps:
      1. Open the image, convert to grayscale.
      2. Split into patch_size×patch_size non-overlapping patches.
      3. Fit PCA on all patches with n_components.
      4. Transform (compress) and inverse_transform (reconstruct).
      5. Stitch patches back into full image.
      6. Return original + reconstructed as base64, plus metrics.
    """
    # ── Load and Resize image (prevent RAM freeze on HD/4K) ──
    pil_original = Image.open(io.BytesIO(image_bytes))
    
    # Downscale if the image is too huge to prevent out-of-memory or UI freeze
    max_dim = 600
    if pil_original.width > max_dim or pil_original.height > max_dim:
        pil_original.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
        
    orig_w_px, orig_h_px = pil_original.size  # PIL uses (w, h)
    
    # Convert to RGB float
    color = np.array(pil_original.convert('RGB'), dtype=float) / 255.0
    h, w, c = color.shape

    # ── Extract patches ──
    patches, padded_h, padded_w, orig_h, orig_w = _extract_patches(color, patch_size)
    n_patches, patch_dim = patches.shape  # patch_dim = patch_size²

    # Clamp n_components to valid range
    max_components = min(n_patches, patch_dim)
    n_components = min(n_components, max_components)

    # ── Fit PCA on a representative subset of patches ──
    pca = PCA(n_components=n_components, svd_solver='randomized')
    n_sample_fit = min(n_patches, 2500)
    subset_idx = np.random.choice(n_patches, n_sample_fit, replace=False)
    pca.fit(patches[subset_idx])
    
    # ── Transform all patches ──
    compressed = pca.transform(patches)
    reconstructed_patches = pca.inverse_transform(compressed)
    reconstructed_patches = np.clip(reconstructed_patches, 0.0, 1.0)

    # ── Stitch image back ──
    reconstructed = _reconstruct_from_patches(
        reconstructed_patches, padded_h, padded_w, orig_h, orig_w, patch_size
    )

    # Calculate true 8-bit pixel MSE (scaling by 255^2)
    mse = float(np.mean((color - reconstructed) ** 2)) * (255.0 ** 2)
    # Original: N_patches × patch_dim floats
    # Compressed: N_patches × n_components floats + PCA model components
    original_size  = n_patches * patch_dim
    compressed_size = n_patches * n_components + n_components * patch_dim  # coefficients + eigenvectors
    ratio = original_size / compressed_size if compressed_size > 0 else 0.0

    # Variance retained
    variance_retained = float(np.sum(pca.explained_variance_ratio_)) * 100

    # ── Build output images ──
    orig_b64 = ndarray_to_base64(color)
    recon_b64 = ndarray_to_base64(reconstructed)

    return {
        "original_image_b64": f"data:image/png;base64,{orig_b64}",
        "reconstructed_image_b64": f"data:image/png;base64,{recon_b64}",
        "compression_ratio": round(ratio, 2),
        "mse": round(mse, 6),
        "n_components": n_components,
        "patch_size": patch_size,
        "n_patches": n_patches,
        "original_resolution": f"{orig_w_px}×{orig_h_px}",
        "variance_retained_pct": round(variance_retained, 2),
    }
