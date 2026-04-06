import axios from 'axios';

// Base URL is injected via Vite env variable (falls back to '/api' for proxy).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Pre-configured Axios instance shared across all service modules.
 * - Automatically sends/receives JSON
 * - Times out after 10 seconds
 * - Unwraps `.data` on success; rejects with the raw Axios error on failure
 */
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Response interceptor ──────────────────────────────────────────────────────
// Unwrap the Axios response envelope so callers receive data directly.
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

// ── API helpers ───────────────────────────────────────────────────────────────

/** GET /api/test — connectivity health-check */
export const testApi = () => apiClient.get('/test');

// Add more typed API helpers below as features grow, for example:
// export const getUser   = (id)   => apiClient.get(`/users/${id}`);
// export const createPost = (body) => apiClient.post('/posts', body);

export default apiClient;
