// @ts-nocheck
// Global API configuration
// In production (Vercel), requests will use relative '/api' or process.env.VITE_API_URL
// In development, Vite proxies '/api' requests to http://localhost:5000
export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : '/api';
