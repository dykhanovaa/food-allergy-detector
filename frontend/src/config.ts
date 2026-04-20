const defaultApiBaseUrl = 'http://localhost:8000/api';
const defaultSiteUrl = 'http://localhost:5173';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || defaultApiBaseUrl;

export const SITE_URL =
  import.meta.env.VITE_SITE_URL?.trim() || defaultSiteUrl;
