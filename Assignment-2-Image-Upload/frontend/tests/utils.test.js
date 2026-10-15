import test from 'node:test';
import assert from 'node:assert';
import { formatSize } from '../src/utils/format.js';
import { normalizeBaseUrl, buildImageUrl } from '../src/utils/urls.js';

test('formatSize: bytes, KB and MB', () => {
  assert.strictEqual(formatSize(500), '500 B');
  assert.strictEqual(formatSize(1536), '1.5 KB');
  assert.strictEqual(formatSize(2 * 1024 * 1024), '2.0 MB');
  assert.strictEqual(formatSize(-1), '');
  assert.strictEqual(formatSize(undefined), '');
});
test('normalizeBaseUrl: removes spaces and trailing slashes', () => {
  assert.strictEqual(normalizeBaseUrl(' https://api.example.com/ '), 'https://api.example.com');
  assert.strictEqual(normalizeBaseUrl('https://api.example.com///'), 'https://api.example.com');
  assert.strictEqual(normalizeBaseUrl(undefined), '');
});
test('buildImageUrl: joins the backend address and the image path correctly', () => {
  assert.strictEqual(buildImageUrl('https://api.example.com', '/api/images/1/file'),
    'https://api.example.com/api/images/1/file');
  assert.strictEqual(buildImageUrl('https://api.example.com', 'api/images/1/file'),
    'https://api.example.com/api/images/1/file');
});
