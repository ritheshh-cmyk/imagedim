import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSampleImage = async () => {
  const response = await api.get('/api/sample');
  return response.data.image;
};

export const processImage = async (n_components, imageArray) => {
  const response = await api.post('/process', {
    n_components: n_components,
    image: imageArray,
  });
  return response.data;
};

export const trainModel = async (n_components) => {
  const response = await api.post('/train', { n_components });
  return response.data;
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post('http://127.0.0.1:8000/upload_preprocess', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.image;
};

// Process HD images at native resolution with configurable patch size
export const processHDImage = async (file, n_components, patch_size = 8) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(
    `http://127.0.0.1:8000/process_image?n_components=${n_components}&patch_size=${patch_size}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

// Fetch k-sweep analytics (MSE, variance, compression_ratio for k=1..k_max)
export const fetchSweep = async (k_max = 100, k_step = 2) => {
  const response = await api.get(`/api/sweep_mnist?k_max=${k_max}&k_step=${k_step}`);
  return response.data;
};

export default api;
