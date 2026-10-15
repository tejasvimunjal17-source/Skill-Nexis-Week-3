// Small helpers for building backend addresses (kept free of browser-only code so they can be tested).

// Removes spaces and any slashes at the end: "https://api.example.com/" -> "https://api.example.com"
export const normalizeBaseUrl = (raw) => String(raw || '').trim().replace(/\/+$/, '');

// The backend sends a path like "/api/images/123/file". The browser needs the full address.
export const buildImageUrl = (baseUrl, path) => {
  const cleanPath = String(path || '');
  return `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};
