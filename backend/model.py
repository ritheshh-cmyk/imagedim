import numpy as np
from pathlib import Path
from sklearn.decomposition import PCA

# ─── Persistent file paths ─────────────────────────────────────
MODEL_DIR        = Path(__file__).parent
MASTER_MODEL_PATH = MODEL_DIR / "pca_master_k150.pkl"
SAMPLES_PATH     = MODEL_DIR / "mnist_samples_2000.npy"   # ← NEW: cached subset
MASTER_K         = 150      # components in the saved model
MAX_SAMPLES      = 2000     # training samples (never changes)


class MNISTManager:
    """
    Loads and caches the 2000 MNIST samples used to train the PCA model.

    Priority:
        1. In-memory cache (cls._data) — fastest, zero I/O
        2. Local .npy file            — instant numpy load (~1 ms)
        3. fetch_openml               — only runs ONCE ever, then saves to .npy
    """
    _data: np.ndarray | None = None   # in-process memory cache

    @classmethod
    def get_data(cls) -> np.ndarray:
        # ── 1. Already in memory ──────────────────────────────
        if cls._data is not None:
            return cls._data

        # ── 2. Load from cached .npy (instant) ───────────────
        if SAMPLES_PATH.exists():
            print(f"⚡ Loading cached MNIST samples from {SAMPLES_PATH.name} …")
            cls._data = np.load(SAMPLES_PATH)
            print(f"✅ Samples ready — {len(cls._data)} rows, shape {cls._data.shape}")
            return cls._data

        # ── 3. First-ever run: download MNIST, save 2000 rows ─
        print("📥 First-time setup: downloading MNIST (this happens ONCE) …")
        from sklearn.datasets import fetch_openml
        mnist = fetch_openml("mnist_784", version=1, parser="liac-arff", as_frame=False)
        np.random.seed(42)
        idx = np.random.permutation(len(mnist.data))[:MAX_SAMPLES]
        cls._data = (mnist.data[idx] / 255.0).astype(np.float32)

        # Save so we never need fetch_openml again
        np.save(SAMPLES_PATH, cls._data)
        print(f"✅ Saved {len(cls._data)} samples → {SAMPLES_PATH.name}")

        # Free the full 70K array immediately to release RAM
        del mnist
        return cls._data

    @classmethod
    def get_random_sample(cls) -> list:
        data = cls.get_data()
        return data[np.random.randint(0, len(data))].tolist()


class PCAManager:
    """
    Single shared PCA(k=MASTER_K) model — loaded from disk or trained once.
    Per-k models are derived by slicing the master's component matrix (no re-training).
    """
    _cache: dict  = {}          # k → PCA (in-process)
    _master: PCA | None = None  # the persisted master model

    @classmethod
    def get_master(cls) -> PCA:
        """Load from disk or train once. Never re-trains after the first run."""
        if cls._master is not None:
            return cls._master

        import joblib

        if MASTER_MODEL_PATH.exists():
            print(f"💾 Loading PCA model from {MASTER_MODEL_PATH.name} …")
            cls._master = joblib.load(MASTER_MODEL_PATH)
            print("✅ PCA model loaded — all requests are instant.")
        else:
            print(f"⚙️  Training PCA(k={MASTER_K}) — this happens ONCE …")
            data = MNISTManager.get_data()
            pca = PCA(n_components=MASTER_K, whiten=True, svd_solver="randomized")
            pca.fit(data)
            joblib.dump(pca, MASTER_MODEL_PATH)
            cls._master = pca
            print(f"✅ PCA saved → {MASTER_MODEL_PATH.name}")

        cls._cache[MASTER_K] = cls._master
        return cls._master

    @classmethod
    def get_model(cls, n_components: int) -> PCA:
        """Return a PCA for exactly n_components by slicing the master (no training)."""
        if n_components in cls._cache:
            return cls._cache[n_components]

        if n_components <= MASTER_K:
            master = cls.get_master()
            sliced = PCA(n_components=n_components, whiten=True, svd_solver="randomized")
            sliced.components_              = master.components_[:n_components]
            sliced.explained_variance_      = master.explained_variance_[:n_components]
            sliced.explained_variance_ratio_ = master.explained_variance_ratio_[:n_components]
            sliced.singular_values_         = master.singular_values_[:n_components]
            sliced.mean_                    = master.mean_
            sliced.n_components_            = n_components
            sliced.n_features_in_           = master.n_features_in_
            if hasattr(master, "n_samples_fit_"):
                sliced.n_samples_fit_       = master.n_samples_fit_
            sliced.noise_variance_          = master.noise_variance_
            cls._cache[n_components] = sliced
            return sliced

        # Edge case: k > 150 (shouldn't happen in normal use)
        data = MNISTManager.get_data()
        pca = PCA(n_components=n_components, whiten=True, svd_solver="randomized")
        pca.fit(data)
        cls._cache[n_components] = pca
        return pca

    @classmethod
    def compress(cls, n_components: int, image_flat: np.ndarray) -> np.ndarray:
        return cls.get_model(n_components).transform(image_flat.reshape(1, -1))

    @classmethod
    def reconstruct(cls, n_components: int, compressed: np.ndarray) -> np.ndarray:
        return cls.get_model(n_components).inverse_transform(compressed)
