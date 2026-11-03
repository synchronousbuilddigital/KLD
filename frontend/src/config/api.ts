// @ts-nocheck
// Global API configuration
// In production (Vercel), requests use relative '/api' by default so auth cookies & endpoints work seamlessly on all domains and preview URLs.
// If an external backend is explicitly provided via VITE_API_URL, it will use that.
const envApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = envApiUrl && envApiUrl !== '/api' && !envApiUrl.startsWith('/')
  ? (envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl}/api`)
  : '/api';
