// Tests of the filter builder.
//  - Part 1 is a pure offline test of the filter object that is built.
//  - Part 2 is a SIMULATION: the built filter is applied to sample tasks by a small stand-in for MongoDB
//    (tests/fixtures.js). It shows the filter logic selects the right tasks; it is not a real database test.
const test = require('node:test');
const assert = require('node:assert');
const { buildTaskFilter, escapeRegex } = require('../src/utils/taskFilter');
const { matches } = require('./fixtures');

const ME = 'user-me';

// ---------- Part 1: the filter object ----------
test('filter: no query -> only the user condition', () => {
  const { filter, errors } = buildTaskFilter({}, ME);
  assert.deepStrictEqual(errors, []);
  assert.deepStrictEqual(filter, { user: ME });
});
test('filter: "all" and empty values mean no filter', () => {
  const { filter, errors } = buildTaskFilter({ status: 'all', priority: '', search: '   ' }, ME);
  assert.deepStrictEqual(errors, []);
  assert.deepStrictEqual(filter, { user: ME });
});
test('filter: status and priority are added', () => {
  const { filter } = buildTaskFilter({ status: 'done', priority: 'high' }, ME);
  assert.strictEqual(filter.status, 'done');
  assert.strictEqual(filter.priority, 'high');
});
test('filter: unknown status/priority -> errors', () => {
  assert.strictEqual(buildTaskFilter({ status: 'finished' }, ME).errors.length, 1);
  assert.strictEqual(buildTaskFilter({ priority: 'urgent' }, ME).errors.length, 1);
  assert.strictEqual(buildTaskFilter({ status: 'DONE' }, ME).errors.length, 1);
});
test('filter: NoSQL-injection shapes (objects and arrays) are refused', () => {
  assert.strictEqual(buildTaskFilter({ status: { $ne: 'done' } }, ME).errors.length, 1);
  assert.strictEqual(buildTaskFilter({ priority: ['high', 'low'] }, ME).errors.length, 1);
  assert.strictEqual(buildTaskFilter({ search: { $regex: '.*' } }, ME).errors.length, 1);
  assert.strictEqual(buildTaskFilter({ search: ['a', 'b'] }, ME).errors.length, 1);
});
test('filter: the owner can not be changed from the URL', () => {
  const { filter } = buildTaskFilter({ user: 'someone-else', $or: 'x' }, ME);
  assert.strictEqual(filter.user, ME);
  assert.strictEqual(filter.$or, undefined);
});
test('filter: search length boundary 100 ok, 101 refused', () => {
  assert.deepStrictEqual(buildTaskFilter({ search: 'a'.repeat(100) }, ME).errors, []);
  assert.strictEqual(buildTaskFilter({ search: 'a'.repeat(101) }, ME).errors.length, 1);
});
test('escapeRegex: special characters are escaped', () => {
  assert.strictEqual(escapeRegex('a.b*c(d)'), 'a\\.b\\*c\\(d\\)');
});
test('filter: invalid regex text like "(" does not crash and is searched literally', () => {
  const { filter, errors } = buildTaskFilter({ search: '(' }, ME);
  assert.deepStrictEqual(errors, []);
  assert.ok(matches({ user: ME, title: 'call (mum)', description: '' }, filter));
});

// ---------- Part 2: simulated results ----------
const tasks = [
  { _id: 1, user: ME, title: 'Buy Milk', description: 'two litres', status: 'todo', priority: 'low' },
  { _id: 2, user: ME, title: 'Write report', description: 'for MILK project', status: 'in-progress', priority: 'high' },
  { _id: 3, user: ME, title: 'Pay rent', description: '', status: 'done', priority: 'high' },
  { _id: 4, user: ME, title: 'Plan a.b trip', description: '', status: 'done', priority: 'medium' },
  { _id: 5, user: 'user-other', title: 'Buy milk', description: '', status: 'done', priority: 'high' },
];
const ids = (query) => {
  const { filter, errors } = buildTaskFilter(query, ME);
  assert.deepStrictEqual(errors, []);
  return tasks.filter((t) => matches(t, filter)).map((t) => t._id).sort();
};

test('simulated: no filters -> all of MY tasks, none of the other user\'s', () => assert.deepStrictEqual(ids({}), [1, 2, 3, 4]));
test('simulated: status=done -> only my done tasks', () => assert.deepStrictEqual(ids({ status: 'done' }), [3, 4]));
test('simulated: priority=high -> only my high tasks', () => assert.deepStrictEqual(ids({ priority: 'high' }), [2, 3]));
test('simulated: status=done + priority=high -> only task 3', () => assert.deepStrictEqual(ids({ status: 'done', priority: 'high' }), [3]));
test('simulated: search is case-insensitive and checks title AND description', () => assert.deepStrictEqual(ids({ search: 'milk' }), [1, 2]));
test('simulated: search + status combine', () => assert.deepStrictEqual(ids({ search: 'milk', status: 'in-progress' }), [2]));
test('simulated: search "a.b" matches only the literal text, not "any character"', () => {
  assert.deepStrictEqual(ids({ search: 'a.b' }), [4]);
});
test('simulated: filter with no matches -> empty list', () => assert.deepStrictEqual(ids({ search: 'zzz' }), []));
