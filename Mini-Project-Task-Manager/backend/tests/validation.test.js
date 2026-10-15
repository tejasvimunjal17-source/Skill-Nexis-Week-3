// Offline tests of pure validation code (no database, no network, no mocks).
const test = require('node:test');
const assert = require('node:assert');
const { getTaskErrors } = require('../src/middleware/validateTask');
const { getRegisterErrors, getLoginErrors } = require('../src/middleware/validateAuth');
const { getJwtSecretProblem } = require('../src/config/checkEnv');
const { parseAllowedOrigins } = require('../src/config/cors');
const { STATUSES, PRIORITIES } = require('../src/config/taskOptions');

test('options: three statuses and three priorities', () => {
  assert.deepStrictEqual(STATUSES, ['todo', 'in-progress', 'done']);
  assert.deepStrictEqual(PRIORITIES, ['low', 'medium', 'high']);
});

test('task: title only is valid', () => assert.deepStrictEqual(getTaskErrors({ title: 'Buy milk' }), []));
test('task: all fields valid', () =>
  assert.deepStrictEqual(getTaskErrors({ title: 'x', description: 'y', status: 'done', priority: 'high' }), []));
test('task: title required when creating, empty/blank/number title rejected', () => {
  assert.ok(getTaskErrors({}).includes('Title is required'));
  assert.strictEqual(getTaskErrors({ title: '   ' }).length, 1);
  assert.strictEqual(getTaskErrors({ title: 123 }).length, 1);
});
test('task: title boundary 100 ok, 101 rejected', () => {
  assert.deepStrictEqual(getTaskErrors({ title: 'a'.repeat(100) }), []);
  assert.strictEqual(getTaskErrors({ title: 'a'.repeat(101) }).length, 1);
});
test('task: description boundary 500 ok, 501 rejected, non-string rejected', () => {
  assert.deepStrictEqual(getTaskErrors({ title: 'x', description: 'a'.repeat(500) }), []);
  assert.strictEqual(getTaskErrors({ title: 'x', description: 'a'.repeat(501) }).length, 1);
  assert.strictEqual(getTaskErrors({ title: 'x', description: 5 }).length, 1);
});
test('task: unknown status/priority (and wrong case, objects) rejected', () => {
  assert.strictEqual(getTaskErrors({ title: 'x', status: 'finished' }).length, 1);
  assert.strictEqual(getTaskErrors({ title: 'x', status: 'DONE' }).length, 1);
  assert.strictEqual(getTaskErrors({ title: 'x', priority: 'urgent' }).length, 1);
  assert.strictEqual(getTaskErrors({ title: 'x', status: { $ne: 'done' } }).length, 1);
});
test('task: update needs at least one known field; single-field update valid', () => {
  assert.strictEqual(getTaskErrors({}, { partial: true }).length, 1);
  assert.strictEqual(getTaskErrors({ user: 'someone' }, { partial: true }).length, 1);
  assert.deepStrictEqual(getTaskErrors({ status: 'in-progress' }, { partial: true }), []);
});
test('task: array / null / text body rejected', () => {
  assert.strictEqual(getTaskErrors([]).length, 1);
  assert.strictEqual(getTaskErrors(null).length, 1);
  assert.strictEqual(getTaskErrors('x').length, 1);
});

test('auth: valid registration; bad email and short password rejected; 72 char password limit', () => {
  assert.deepStrictEqual(getRegisterErrors({ name: 'Ana', email: 'ana@example.com', password: 'secret1' }), []);
  assert.strictEqual(getRegisterErrors({ name: 'Ana', email: 'nope', password: '123' }).length, 2);
  assert.strictEqual(getRegisterErrors({ name: 'Ana', email: 'a@b.co', password: 'x'.repeat(73) }).length, 1);
});
test('auth: login needs email and password; object values rejected', () => {
  assert.strictEqual(getLoginErrors({}).length, 2);
  assert.strictEqual(getLoginErrors({ email: { $gt: '' }, password: { $gt: '' } }).length, 2);
});
test('env: placeholder, missing and short JWT secrets are refused', () => {
  assert.ok(getJwtSecretProblem(undefined));
  assert.ok(getJwtSecretProblem('your_jwt_secret_here'));
  assert.ok(getJwtSecretProblem('short'));
  assert.strictEqual(getJwtSecretProblem('a'.repeat(32)), null);
});
test('cors: default, trailing slash removal, several addresses', () => {
  assert.deepStrictEqual(parseAllowedOrigins(undefined), ['http://localhost:5173']);
  assert.deepStrictEqual(parseAllowedOrigins('https://a.vercel.app/ , http://localhost:5173'),
    ['https://a.vercel.app', 'http://localhost:5173']);
});
