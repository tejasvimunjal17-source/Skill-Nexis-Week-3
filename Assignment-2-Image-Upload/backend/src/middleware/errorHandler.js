// Handles routes that do not exist (404) and any error thrown in the app,
// including upload errors from Multer.
const { MAX_FILE_SIZE_MB, FIELD_NAME } = require('../config/upload');

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Our own upload rejections (wrong type, etc.)
  if (err.name === 'UploadError') {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }

  // Errors raised by Multer itself
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: `Image is too large. The maximum size is ${MAX_FILE_SIZE_MB} MB`,
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: `Unexpected file field. Send exactly one file in the field named "${FIELD_NAME}"`,
      });
    }
    return res.status(400).json({ success: false, message: `Upload failed: ${err.message}` });
  }

  // Request body was not valid JSON
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }

  // Mongoose validation failed
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Invalid value for an id
  if (err.name === 'CastError') {
    return res
      .status(400)
      .json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
  }

  console.error(err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    // Error details are shown only while developing
    ...(process.env.NODE_ENV !== 'production' && { error: err.message }),
  });
};

module.exports = { notFound, errorHandler };
