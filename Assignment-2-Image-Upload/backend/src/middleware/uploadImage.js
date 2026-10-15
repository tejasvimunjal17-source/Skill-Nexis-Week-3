// Multer reads the uploaded file from the request.
// memoryStorage keeps the file in memory (as a Buffer) so we can check its real type
// BEFORE saving it anywhere.
const multer = require('multer');
const { MAX_FILE_SIZE_BYTES, FIELD_NAME, fileFilter } = require('../config/upload');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter,
});

// Accepts exactly one file in the form field called "image".
module.exports = upload.single(FIELD_NAME);
