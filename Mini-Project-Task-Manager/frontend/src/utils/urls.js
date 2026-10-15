// Removes spaces and any slashes at the end: "https://api.example.com/" -> "https://api.example.com"
export const normalizeBaseUrl = (raw) => String(raw || '').trim().replace(/\/+$/, '');
