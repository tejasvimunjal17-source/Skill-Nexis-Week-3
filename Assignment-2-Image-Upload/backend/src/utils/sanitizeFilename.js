// Cleans the original file name before it is saved for display.
// The name is only stored as text (never used as a path on the server).
const MAX_LENGTH = 100;

const sanitizeFilename = (name) => {
  const text = typeof name === 'string' ? name : '';
  const lastPart = text.split(/[\\/]/).pop() || ''; // drop any folder path
  const cleaned = lastPart
    .replace(/[\u0000-\u001f\u007f]/g, '') // remove control characters
    .trim()
    .slice(0, MAX_LENGTH);
  return cleaned || 'image';
};

module.exports = { sanitizeFilename, MAX_LENGTH };
