import numpy as np
from sklearn.datasets import fetch_openml
from sklearn.decomposition import PCA

class MNISTManager:
    _instance = None
    _data = None
    
    @classmethod
    def get_data(cls, max_samples=5000):
        if cls._data is None:
            mnist = fetch_openml("mnist_784", version=1, parser="liac-arff", as_frame=False)
            np.random.seed(42)
            indices = np.random.permutation(len(mnist.data))[:max_samples]
            cls._data = mnist.data[indices] / 255.0
        return cls._data
        
    @classmethod
    def get_random_sample(cls):
        data = cls.get_data()
        idx = np.random.randint(0, len(data))
        return data[idx].tolist()

class PCAManager:
    _cache = {}
    
    @classmethod
    def get_model(cls, n_components: int) -> PCA:
        if n_components not in cls._cache:
            data = MNISTManager.get_data(max_samples=2000)
            pca = PCA(n_components=n_components, whiten=True, svd_solver='randomized')
            pca.fit(data)
            cls._cache[n_components] = pca
        return cls._cache[n_components]

    @classmethod
    def compress(cls, n_components: int, image_flat: np.ndarray) -> np.ndarray:
        pca = cls.get_model(n_components)
        img_reshaped = image_flat.reshape(1, -1)
        compressed = pca.transform(img_reshaped)
        return compressed

    @classmethod
    def reconstruct(cls, n_components: int, compressed_vector: np.ndarray) -> np.ndarray:
        pca = cls.get_model(n_components)
        reconstructed = pca.inverse_transform(compressed_vector)
        return reconstructed
