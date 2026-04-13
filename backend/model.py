import os
import numpy as np
from pathlib import Path
from sklearn.datasets import fetch_openml
from sklearn.decomposition import PCA

# ─── Path where the pre-trained master model is saved ──────────
MODEL_DIR = Path(__file__).parent
MASTER_MODEL_PATH = MODEL_DIR / "pca_master_k150.pkl"
MASTER_K = 150          # train once with this many components
MAX_SAMPLES = 2000      # MNIST samples used for fitting


class MNISTManager:
    _data = None

    @classmethod
    def get_data(cls, max_samples=MAX_SAMPLES):
        if cls._data is None:
            print("📥 Loading MNIST dataset…")
            mnist = fetch_openml("mnist_784", version=1, parser="liac-arff", as_frame=False)
            np.random.seed(42)
            indices = np.random.permutation(len(mnist.data))[:max_samples]
            cls._data = mnist.data[indices] / 255.0
            print(f"✅ MNIST ready — {len(cls._data)} samples")
        return cls._data

    @classmethod
    def get_random_sample(cls):
        data = cls.get_data()
        idx = np.random.randint(0, len(data))
        return data[idx].tolist()


class PCAManager:
    _cache = {}                 # k → PCA model (in-memory)
    _master: PCA | None = None  # the single master model (k=MASTER_K)

    # ── Master model: load from disk or train once ────────────
    @classmethod
    def get_master(cls) -> PCA:
        """Return the pre-trained PCA(k=MASTER_K). Loads from disk or trains."""
        if cls._master is not None:
            return cls._master

        import joblib

        if MASTER_MODEL_PATH.exists():
            print(f"💾 Loading pre-trained PCA from {MASTER_MODEL_PATH} …")
            cls._master = joblib.load(MASTER_MODEL_PATH)
            print("✅ PCA model loaded from disk.")
        else:
            print(f"⚙️  Training PCA(k={MASTER_K}) on MNIST — this happens ONCE…")
            data = MNISTManager.get_data()
            pca = PCA(n_components=MASTER_K, whiten=True, svd_solver="randomized")
            pca.fit(data)
            joblib.dump(pca, MASTER_MODEL_PATH)
            cls._master = pca
            print(f"✅ PCA trained and saved to {MASTER_MODEL_PATH}")

        # Also put in cache keyed by MASTER_K
        cls._cache[MASTER_K] = cls._master
        return cls._master

    # ── Per-k model: slice the master if k ≤ MASTER_K ────────
    @classmethod
    def get_model(cls, n_components: int) -> PCA:
        """Return a PCA model for exactly n_components. Uses master when possible."""
        if n_components in cls._cache:
            return cls._cache[n_components]

        if n_components <= MASTER_K:
            # Derive by slicing the master's components matrix
            master = cls.get_master()
            sliced = PCA(n_components=n_components, whiten=True, svd_solver="randomized")
            # Copy the top-k axes from the master model
            sliced.components_         = master.components_[:n_components]
            sliced.explained_variance_ = master.explained_variance_[:n_components]
            sliced.explained_variance_ratio_ = master.explained_variance_ratio_[:n_components]
            sliced.singular_values_    = master.singular_values_[:n_components]
            sliced.mean_               = master.mean_
            sliced.n_components_       = n_components
            sliced.n_features_in_      = master.n_features_in_
            if hasattr(master, 'n_samples_fit_'):
                sliced.n_samples_fit_  = master.n_samples_fit_
            sliced.noise_variance_     = master.noise_variance_
            cls._cache[n_components] = sliced
            return sliced

        # Fallback: train from scratch (unusual edge case)
        data = MNISTManager.get_data()
        pca = PCA(n_components=n_components, whiten=True, svd_solver="randomized")
        pca.fit(data)
        cls._cache[n_components] = pca
        return pca

    @classmethod
    def compress(cls, n_components: int, image_flat: np.ndarray) -> np.ndarray:
        pca = cls.get_model(n_components)
        return pca.transform(image_flat.reshape(1, -1))

    @classmethod
    def reconstruct(cls, n_components: int, compressed_vector: np.ndarray) -> np.ndarray:
        pca = cls.get_model(n_components)
        return pca.inverse_transform(compressed_vector)
