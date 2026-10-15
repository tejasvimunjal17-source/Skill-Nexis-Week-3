// One place for all backend calls (the "API service layer").
import axios from 'axios';
import { normalizeBaseUrl, buildImageUrl } from '../utils/urls.js';

// The backend address comes from VITE_API_URL (set at BUILD time when deploying).
// The localhost fallback is used ONLY while developing, never in a deployed build.
const rawUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
export const BASE_URL = normalizeBaseUrl(rawUrl);

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  if (!BASE_URL) {
    const error = new Error(
      'The app is not configured: VITE_API_URL is missing. Set it to your backend address and redeploy.'
    );
    error.code = 'CONFIG';
    throw error;
  }
  return config;
});

// Turns any error into one readable message for the screen.
export const getErrorMessage = (error) => {
  if (error.code === 'CONFIG') return error.message;
  if (!error.response) {
    return 'Cannot reach the server. Check that the backend is running and the API address is correct.';
  }
  const { message, errors } = error.response.data || {};
  if (Array.isArray(errors) && errors.length > 0) return errors.join('. ');
  return message || 'Something went wrong. Please try again.';
};

// Uploads one image. onProgress receives a number from 0 to 100.
export const uploadImage = (file, onProgress) => {
  const formData = new FormData();
  formData.append('image', file); // the field name must be "image"
  // Do not set Content-Type by hand: the browser adds it together with the multipart boundary.
  return api.post('/api/images', formData, {
    onUploadProgress: (event) => {
      if (onProgress && event.total) onProgress(Math.round((event.loaded * 100) / event.total));
    },
  });
};

export const fetchImages = () => api.get('/api/images');

// Full address the <img> tag uses to show an uploaded picture.
export const imageSrc = (image) => buildImageUrl(BASE_URL, image.url);

export default api;
