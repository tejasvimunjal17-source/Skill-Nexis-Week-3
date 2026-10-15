// Offline tests of the frontend helper modules (plain JavaScript, no browser needed).
import test from 'node:test';
import assert from 'node:assert';
import { buildTaskParams, hasActiveFilters, DEFAULT_FILTERS } from '../src/utils/filters.js';
import { validateTaskForm } from '../src/utils/taskForm.js';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, labelFor, TITLE_MAX, DESCRIPTION_MAX, SEARCH_MAX } from '../src/utils/taskOptions.js';
import { normalizeBaseUrl } from '../src/utils/urls.js';

const valid = { title: 'Buy milk', description: '', status: 'todo', priority: 'medium' };

test('filters: default filters send nothing to the backend', () => {
  assert.deepStrictEqual(buildTaskParams(DEFAULT_FILTERS), {});
  assert.strictEqual(hasActiveFilters(DEFAULT_FILTERS), false);
});
test('filters: only filters in use are sent; search is trimmed', () => {
  assert.deepStrictEqual(buildTaskParams({ status: 'done', priority: 'all', search: '  milk ' }), { status: 'done', search: 'milk' });
  assert.deepStrictEqual(buildTaskParams({ status: 'all', priority: 'high', search: '' }), { priority: 'high' });
  assert.strictEqual(hasActiveFilters({ status: 'all', priority: 'all', search: '   ' }), false);
  assert.strictEqual(hasActiveFilters({ status: 'done', priority: 'all', search: '' }), true);
});
test('filters: search longer than the limit is cut to the limit', () => {
  assert.strictEqual(buildTaskParams({ status: 'all', priority: 'all', search: 'a'.repeat(300) }).search.length, SEARCH_MAX);
});

test('taskForm: valid values give no error', () => assert.strictEqual(validateTaskForm(valid), null));
test('taskForm: empty / blank title rejected', () => {
  assert.match(validateTaskForm({ ...valid, title: '' }), /required/);
  assert.match(validateTaskForm({ ...valid, title: '   ' }), /required/);
  assert.match(validateTaskForm({ ...valid, title: undefined }), /required/);
});
test('taskForm: title and description length boundaries', () => {
  assert.strictEqual(validateTaskForm({ ...valid, title: 'a'.repeat(TITLE_MAX) }), null);
  assert.match(validateTaskForm({ ...valid, title: 'a'.repeat(TITLE_MAX + 1) }), /Title/);
  assert.strictEqual(validateTaskForm({ ...valid, description: 'a'.repeat(DESCRIPTION_MAX) }), null);
  assert.match(validateTaskForm({ ...valid, description: 'a'.repeat(DESCRIPTION_MAX + 1) }), /Description/);
});
test('taskForm: invalid status or priority rejected', () => {
  assert.match(validateTaskForm({ ...valid, status: 'finished' }), /status/);
  assert.match(validateTaskForm({ ...valid, priority: 'urgent' }), /priority/);
});
test('options: same three statuses and priorities as the backend, with readable labels', () => {
  assert.deepStrictEqual(STATUS_OPTIONS.map((o) => o.value), ['todo', 'in-progress', 'done']);
  assert.deepStrictEqual(PRIORITY_OPTIONS.map((o) => o.value), ['low', 'medium', 'high']);
  assert.strictEqual(labelFor(STATUS_OPTIONS, 'in-progress'), 'In Progress');
  assert.strictEqual(labelFor(STATUS_OPTIONS, 'weird'), 'weird');
});
test('urls: trailing slashes and spaces removed', () => {
  assert.strictEqual(normalizeBaseUrl(' https://api.example.com/ '), 'https://api.example.com');
  assert.strictEqual(normalizeBaseUrl(undefined), '');
});
