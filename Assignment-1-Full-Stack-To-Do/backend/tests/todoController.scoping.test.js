// MOCK tests: the Todo database model is replaced with a fake, so no MongoDB is used.
// They prove the controller always limits queries to the logged-in user.
// They do NOT prove behaviour against a real database.
const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');
const path = require('node:path');

const calls = [];
const fakeTodo = {
  create: async (data) => { calls.push(['create', data]); return { _id: 't1', ...data }; },
  find: (filter) => { calls.push(['find', filter]); return { sort: async () => [] }; },
  findOne: async (filter) => { calls.push(['findOne', filter]); return null; },
  findOneAndUpdate: async (filter, update) => { calls.push(['findOneAndUpdate', filter, update]); return null; },
  findOneAndDelete: async (filter) => { calls.push(['findOneAndDelete', filter]); return null; },
};

// Replace only the Todo model file when the controller asks for it.
const modelPath = path.resolve(__dirname, '../src/models/Todo.js');
const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (parent && path.resolve(path.dirname(parent.filename), request) === modelPath.replace(/\.js$/, '')) {
    return fakeTodo;
  }
  if (request === '../models/Todo') return fakeTodo;
  return originalLoad.call(this, request, parent, ...rest);
};
const controller = require('../src/controllers/todoController');
Module._load = originalLoad;

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
};
const run = (handler, req) =>
  new Promise((resolve, reject) => {
    const res = makeRes();
    const origJson = res.json;
    res.json = (b) => { origJson(b); resolve(res); return res; };
    handler(req, res, reject);
  });

const req = (extra = {}) => ({ user: { _id: 'userA' }, params: { id: 'abc' }, body: {}, ...extra });

test('create: owner is forced to the logged-in user (body cannot override)', async () => {
  calls.length = 0;
  await run(controller.createTodo, req({ body: { title: 'x', user: 'attacker' } }));
  assert.strictEqual(calls[0][1].user, 'userA');
});
test('list: only the logged-in user\'s todos are requested', async () => {
  calls.length = 0;
  await run(controller.getTodos, req());
  assert.deepStrictEqual(calls[0][1], { user: 'userA' });
});
test('get one: filter includes the owner; other user\'s todo gives 404', async () => {
  calls.length = 0;
  const res = await run(controller.getTodoById, req());
  assert.deepStrictEqual(calls[0][1], { _id: 'abc', user: 'userA' });
  assert.strictEqual(res.statusCode, 404);
});
test('update: filter includes the owner and "user" field cannot be changed', async () => {
  calls.length = 0;
  const res = await run(controller.updateTodo, req({ body: { title: 'y', user: 'attacker' } }));
  assert.deepStrictEqual(calls[0][1], { _id: 'abc', user: 'userA' });
  assert.strictEqual(calls[0][2].user, undefined);
  assert.strictEqual(res.statusCode, 404);
});
test('delete: filter includes the owner', async () => {
  calls.length = 0;
  const res = await run(controller.deleteTodo, req());
  assert.deepStrictEqual(calls[0][1], { _id: 'abc', user: 'userA' });
  assert.strictEqual(res.statusCode, 404);
});
