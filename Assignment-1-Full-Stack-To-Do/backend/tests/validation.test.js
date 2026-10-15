// Offline tests: pure validation functions (no database, no network).
const test = require('node:test');
const assert = require('node:assert');
const { getTodoErrors } = require('../src/middleware/validateTodo');
const { getRegisterErrors, getLoginErrors } = require('../src/middleware/validateAuth');
const { getJwtSecretProblem } = require('../src/config/checkEnv');

test('todo: valid new todo has no errors', () => {
  assert.deepStrictEqual(getTodoErrors({ title: 'Buy milk' }), []);
});
test('todo: title is required when creating', () => {
  assert.ok(getTodoErrors({}).includes('Title is required'));
});
test('todo: empty title rejected', () => {
  assert.strictEqual(getTodoErrors({ title: '   ' }).length, 1);
});
test('todo: title over 100 characters rejected', () => {
  assert.strictEqual(getTodoErrors({ title: 'a'.repeat(101) }).length, 1);
});
test('todo: description over 500 characters rejected', () => {
  assert.strictEqual(getTodoErrors({ title: 'x', description: 'a'.repeat(501) }).length, 1);
});
test('todo: completed must be boolean', () => {
  assert.strictEqual(getTodoErrors({ title: 'x', completed: 'yes' }).length, 1);
});
test('todo: update needs at least one field', () => {
  assert.strictEqual(getTodoErrors({}, { partial: true }).length, 1);
});
test('todo: partial update with only completed is valid', () => {
  assert.deepStrictEqual(getTodoErrors({ completed: true }, { partial: true }), []);
});
test('todo: array body rejected', () => {
  assert.strictEqual(getTodoErrors([]).length, 1);
});

test('auth: valid registration has no errors', () => {
  assert.deepStrictEqual(
    getRegisterErrors({ name: 'Ana', email: 'ana@example.com', password: 'secret1' }), []);
});
test('auth: registration rejects bad email and short password', () => {
  assert.strictEqual(getRegisterErrors({ name: 'Ana', email: 'nope', password: '123' }).length, 2);
});
test('auth: login needs email and password', () => {
  assert.strictEqual(getLoginErrors({}).length, 2);
});
test('env: placeholder, missing and short JWT secrets are refused', () => {
  assert.ok(getJwtSecretProblem(undefined));
  assert.ok(getJwtSecretProblem('your_jwt_secret_here'));
  assert.ok(getJwtSecretProblem('short'));
  assert.strictEqual(getJwtSecretProblem('a'.repeat(32)), null);
});
