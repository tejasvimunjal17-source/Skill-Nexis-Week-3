// Offline tests for the browser-side file checks (plain JavaScript, no browser needed).
import test from 'node:test';
import assert from 'node:assert';
import { validateFile, MAX_FILE_SIZE_BYTES, ALLOWED_TYPES, ACCEPT_ATTRIBUTE } from '../src/utils/validateFile.js';

const file = (type, size) => ({ type, size });

test('validateFile: no file -> asks to choose one', () => {
  assert.match(validateFile(undefined), /choose/i);
  assert.match(validateFile(null), /choose/i);
});
test('validateFile: each allowed type under the limit is accepted', () => {
  ALLOWED_TYPES.forEach((t) => assert.strictEqual(validateFile(file(t, 1000)), null));
});
test('validateFile: exactly 2 MB is accepted, one byte more is rejected', () => {
  assert.strictEqual(validateFile(file('image/png', MAX_FILE_SIZE_BYTES)), null);
  assert.match(validateFile(file('image/png', MAX_FILE_SIZE_BYTES + 1)), /too large/);
});
test('validateFile: SVG, PDF, text and unknown type are rejected', () => {
  ['image/svg+xml', 'application/pdf', 'text/plain', ''].forEach((t) =>
    assert.match(validateFile(file(t, 1000)), /Only JPEG/));
});
test('validateFile: empty file is rejected', () => {
  assert.match(validateFile(file('image/png', 0)), /empty/);
});
test('accept attribute lists exactly the allowed types', () => {
  assert.strictEqual(ACCEPT_ATTRIBUTE, 'image/jpeg,image/png,image/gif,image/webp');
});
