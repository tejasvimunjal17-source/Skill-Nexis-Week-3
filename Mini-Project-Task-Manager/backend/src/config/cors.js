// Turns CLIENT_URL (one or more addresses separated by commas) into a clean list.
// A browser sends its address WITHOUT a slash at the end, so we remove any trailing slash;
// otherwise "https://my-app.vercel.app/" would never match and CORS would block every request.
const DEFAULT_ORIGIN = 'http://localhost:5173';

const parseAllowedOrigins = (value) => {
  const list = String(value || DEFAULT_ORIGIN)
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return list.length > 0 ? list : [DEFAULT_ORIGIN];
};

module.exports = { parseAllowedOrigins, DEFAULT_ORIGIN };
