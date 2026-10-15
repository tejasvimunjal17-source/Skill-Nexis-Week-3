// Offline test: CLIENT_URL parsing (no dependencies needed).
const test = require('node:test');
const assert = require('node:assert');
const { parseAllowedOrigins } = require('../src/config/cors');

test('cors: default is the local Vite address', () => {
  assert.deepStrictEqual(parseAllowedOrigins(undefined), ['http://localhost:5173']);
  assert.deepStrictEqual(parseAllowedOrigins('   '), ['http://localhost:5173']);
});
test('cors: trailing slashes are removed (browsers never send one)', () => {
  assert.deepStrictEqual(parseAllowedOrigins('https://my-app.vercel.app/'), ['https://my-app.vercel.app']);
});
test('cors: several comma-separated addresses with spaces', () => {
  assert.deepStrictEqual(
    parseAllowedOrigins('https://a.vercel.app/ , http://localhost:5173'),
    ['https://a.vercel.app', 'http://localhost:5173']);
});
