// Checks a chosen file in the browser BEFORE uploading, so the user gets quick feedback.
// The backend repeats these checks (and one more) because browser checks can be bypassed.
export const MAX_FILE_SIZE_MB = 2;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ACCEPT_ATTRIBUTE = ALLOWED_TYPES.join(',');

// Returns an error message, or null when the file is fine.
export const validateFile = (file) => {
  if (!file) return 'Please choose an image first.';
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, GIF or WebP images are allowed.';
  }
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `This image is too large. The maximum size is ${MAX_FILE_SIZE_MB} MB.`;
  }
  return null;
};
