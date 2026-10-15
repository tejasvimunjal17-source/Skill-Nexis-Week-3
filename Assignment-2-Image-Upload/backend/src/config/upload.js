// Upload rules in ONE place (no dependencies, so they are easy to test).
// The React app shows the same limits; this backend is the one that really enforces them.
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// SVG is left out on purpose: an SVG file can contain scripts.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// The form field name the browser must use for the file.
const FIELD_NAME = 'image';

// How many images the gallery list returns at most.
const LIST_LIMIT = 50;

// Error used for rejected uploads, with the HTTP status to send.
class UploadError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'UploadError';
    this.statusCode = statusCode;
  }
}

// Multer calls this for every file BEFORE it is read into memory.
// It is a quick first check using the type the browser claims; the real check is the file signature.
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new UploadError('Only JPEG, PNG, GIF or WebP images are allowed', 415));
  }
  cb(null, true);
};

module.exports = {
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  FIELD_NAME,
  LIST_LIMIT,
  UploadError,
  fileFilter,
};
