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

export default api;
