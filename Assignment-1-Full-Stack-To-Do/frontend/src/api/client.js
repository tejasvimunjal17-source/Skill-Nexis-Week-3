// One place for all backend calls (the "API service layer").
import axios from 'axios';

const TOKEN_KEY = 'todo_token';
const USER_KEY = 'todo_user';

// The backend address comes from VITE_API_URL (set at BUILD time on Vercel).
// The localhost fallback is used ONLY while developing, never in a deployed build.
const rawUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
export const BASE_URL = rawUrl.trim().replace(/\/+$/, ''); // remove any slash at the end

const api = axios.create({ baseURL: BASE_URL });

// Attach the login token to every request automatically.
api.interceptors.request.use((config) => {
  if (!BASE_URL) {
    const error = new Error(
      'The app is not configured: VITE_API_URL is missing. Set it to your backend address and redeploy.'
    );
    error.code = 'CONFIG';
    throw error;
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is rejected, clear it and tell the app to log out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/api/auth/login');
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

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

export const storage = {
  saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
};

// ---- Auth ----
export const registerUser = (data) => api.post('/api/auth/register', data);
export const loginUser = (data) => api.post('/api/auth/login', data);

// ---- To-Dos ----
export const fetchTodos = () => api.get('/api/todos');
export const createTodo = (data) => api.post('/api/todos', data);
export const updateTodo = (id, data) => api.patch(`/api/todos/${id}`, data);
export const deleteTodo = (id) => api.delete(`/api/todos/${id}`);

export default api;
