// Offline tests: upload rules, file-name cleaning and error-to-message mapping (no dependencies).
const test = require('node:test');
const assert = require('node:assert');
const {
  MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, ALLOWED_MIME_TYPES, fileFilter, UploadError,
} = require('../src/config/upload');
const { sanitizeFilename } = require('../src/utils/sanitizeFilename');
const { errorHandler, notFound } = require('../src/middleware/errorHandler');
const { validateObjectId } = require('../src/middleware/validateObjectId');

const run = (handler, ...args) => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  const out = handler(...args.slice(0, -1), res, args[args.length - 1]);
  return { res, out };
};
const handleError = (err) => run(errorHandler, err, {}, () => {}).res;

test('rules: limit is 2 MB and only 4 image types are allowed', () => {
  assert.strictEqual(MAX_FILE_SIZE_MB, 2);
  assert.strictEqual(MAX_FILE_SIZE_BYTES, 2 * 1024 * 1024);
  assert.deepStrictEqual(ALLOWED_MIME_TYPES, ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
});
test('fileFilter: accepts each allowed type', () => {
  ALLOWED_MIME_TYPES.forEach((mimetype) => {
    let result;
    fileFilter({}, { mimetype }, (err, ok) => { result = { err, ok }; });
    assert.strictEqual(result.err, null);
    assert.strictEqual(result.ok, true);
  });
});
test('fileFilter: rejects SVG, PDF, text, and empty type with a 415 UploadError', () => {
  ['image/svg+xml', 'application/pdf', 'text/html', ''].forEach((mimetype) => {
    let err;
    fileFilter({}, { mimetype }, (e) => { err = e; });
    assert.ok(err instanceof UploadError);
    assert.strictEqual(err.statusCode, 415);
  });
});

test('sanitizeFilename: removes folder paths and control characters', () => {
  assert.strictEqual(sanitizeFilename('../../etc/passwd.png'), 'passwd.png');
  assert.strictEqual(sanitizeFilename('C:\\Users\\me\\cat.jpg'), 'cat.jpg');
  assert.strictEqual(sanitizeFilename('a\u0000b\nc.png'), 'abc.png');
});
test('sanitizeFilename: limits length and gives a fallback name', () => {
  assert.strictEqual(sanitizeFilename('x'.repeat(300)).length, 100);
  assert.strictEqual(sanitizeFilename(''), 'image');
  assert.strictEqual(sanitizeFilename(undefined), 'image');
  assert.strictEqual(sanitizeFilename('   '), 'image');
});

test('errorHandler: file too large -> 413 with the limit in the message', () => {
  const res = handleError(Object.assign(new Error('File too large'), { name: 'MulterError', code: 'LIMIT_FILE_SIZE' }));
  assert.strictEqual(res.statusCode, 413);
  assert.match(res.body.message, /2 MB/);
});
test('errorHandler: wrong form field -> 400 naming the field "image"', () => {
  const res = handleError(Object.assign(new Error('Unexpected field'), { name: 'MulterError', code: 'LIMIT_UNEXPECTED_FILE' }));
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.message, /"image"/);
});
test('errorHandler: other Multer errors -> 400', () => {
  const res = handleError(Object.assign(new Error('Too many files'), { name: 'MulterError', code: 'LIMIT_FILE_COUNT' }));
  assert.strictEqual(res.statusCode, 400);
});
test('errorHandler: UploadError keeps its own status and message', () => {
  const res = handleError(new UploadError('Only JPEG, PNG, GIF or WebP images are allowed', 415));
  assert.strictEqual(res.statusCode, 415);
  assert.match(res.body.message, /Only JPEG/);
});
test('errorHandler: unknown error -> 500 and hides details in production', () => {
  const original = process.env.NODE_ENV;
  const origConsoleError = console.error;
  console.error = () => {};
  process.env.NODE_ENV = 'production';
  const res = handleError(new Error('secret internal detail'));
  process.env.NODE_ENV = original;
  console.error = origConsoleError;
  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.body.error, undefined);
});
test('notFound: unknown route -> 404', () => {
  const { res } = run(notFound, { method: 'GET', originalUrl: '/nope' }, undefined);
  assert.strictEqual(res.statusCode, 404);
});
test('validateObjectId: accepts 24 hex characters, rejects everything else with 400', () => {
  let nextCalled = false;
  run(validateObjectId, { params: { id: '507f1f77bcf86cd799439011' } }, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  ['123', 'zzzzzzzzzzzzzzzzzzzzzzzz', '../etc/passwd', ''].forEach((id) => {
    const { res } = run(validateObjectId, { params: { id } }, () => assert.fail('next must not be called'));
    assert.strictEqual(res.statusCode, 400);
  });
});
