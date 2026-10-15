// SIMULATED API tests (mock tests). express, jsonwebtoken, bcrypt and the database model are replaced by
// small fakes (see tests/fixtures.js), so this runs without npm install and without MongoDB.
// Requests are pushed through the project's REAL route chain:  protect -> validation -> controller.
// They prove this project's own logic. They do NOT prove behaviour of real Express, JWT, or MongoDB.
const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');
const path = require('node:path');
const { makeFakeTask } = require('./fixtures');

const SRC = path.resolve(__dirname, '../src');
const Task = makeFakeTask();

// token -> user id ('gone' is a valid token whose user was deleted)
const TOKENS = { tokenA: 'userA', tokenB: 'userB', gone: 'userGone' };
const fakeJwt = {
  verify(token) {
    if (token === 'expired') throw Object.assign(new Error('x'), { name: 'TokenExpiredError' });
    if (TOKENS[token]) return { id: TOKENS[token] };
    throw Object.assign(new Error('x'), { name: 'JsonWebTokenError' });
  },
};
const fakeUser = { findById: async (id) => (id === 'userGone' ? null : { _id: id, name: id }) };

const makeRouter = () => {
  const router = { log: [] };
  router.use = (fn) => router.log.push({ kind: 'use', fn });
  router.get = (p, ...fns) => router.log.push({ kind: 'route', method: 'get', path: p, fns });
  router.post = (p, ...fns) => router.log.push({ kind: 'route', method: 'post', path: p, fns });
  router.route = (p) => {
    const chain = {};
    ['get', 'post', 'put', 'patch', 'delete'].forEach((m) => {
      chain[m] = (...fns) => { router.log.push({ kind: 'route', method: m, path: p, fns }); return chain; };
    });
    return chain;
  };
  return router;
};
const fakeExpress = () => { const app = { log: [] }; app.use = (...a) => app.log.push(a); app.get = () => {}; return app; };
fakeExpress.json = () => function jsonParser() {};
fakeExpress.Router = makeRouter;

const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === 'jsonwebtoken') return fakeJwt;
  if (request === 'bcrypt') return {};
  if (request === 'express') return fakeExpress;
  if (request === 'cors') return () => function corsMiddleware() {};
  if (parent && request.startsWith('.')) {
    const resolved = path.resolve(path.dirname(parent.filename), request);
    if (resolved === path.join(SRC, 'models', 'User')) return fakeUser;
    if (resolved === path.join(SRC, 'models', 'Task')) return Task;
  }
  return originalLoad.call(this, request, parent, ...rest);
};
process.env.JWT_SECRET = 'a'.repeat(32);
const { protect } = require('../src/middleware/authMiddleware');
const taskRouter = require('../src/routes/taskRoutes');
const authRouter = require('../src/routes/authRoutes');
const app = require('../src/app');
Module._load = originalLoad;

// ---- a tiny request dispatcher that behaves like Express routing (registration order, next(), params)
const matchPath = (pattern, url) => {
  if (pattern === url) return {};
  if (pattern === '/:id') { const id = url.slice(1); return id && !id.includes('/') ? { id } : null; }
  return null;
};
const send = (router, method, url, { token, body, query } = {}) => new Promise((resolve) => {
  const req = { headers: token ? { authorization: `Bearer ${token}` } : {}, body, query: query || {}, params: {} };
  const res = { statusCode: 200 };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; resolve(res); return res; };
  const stack = [];
  for (const entry of router.log) {
    if (entry.kind === 'use') stack.push({ fn: entry.fn, params: {} });
    else if (entry.method === method) {
      const params = matchPath(entry.path, url);
      if (params) entry.fns.forEach((fn) => stack.push({ fn, params }));
    }
  }
  let i = 0;
  const next = (err) => {
    if (err) { res.statusCode = 500; res.body = { error: err.message }; return resolve(res); }
    const item = stack[i++];
    if (!item) { res.statusCode = 404; res.body = { message: 'no route' }; return resolve(res); }
    req.params = item.params;
    item.fn(req, res, next);
  };
  next();
});
const api = (method, url, options) => send(taskRouter, method, url, options);

const add = async (token, body) => (await api('post', '/', { token, body })).body.data;

// ===================== login protection =====================
test('protect: missing header, wrong scheme, forged, expired, deleted user -> all 401', async () => {
  for (const headers of [{}, { authorization: 'Basic abc' }, { authorization: 'Bearer forged' }]) {
    const res = await new Promise((resolve) => {
      const r = { statusCode: 200, status(c) { r.statusCode = c; return r; }, json(b) { r.body = b; resolve(r); } };
      protect({ headers }, r, () => resolve({ statusCode: 'NEXT' }));
    });
    assert.strictEqual(res.statusCode, 401);
  }
  const expired = await api('get', '/', { token: 'expired' });
  assert.strictEqual(expired.statusCode, 401);
  assert.match(expired.body.message, /expired/);
  assert.strictEqual((await api('get', '/', { token: 'gone' })).statusCode, 401);
});
test('all 6 task routes reject requests with no token (401) and touch no data', async () => {
  const before = Task.calls.length;
  const id = '0'.repeat(23) + '1';
  const cases = [['get', '/'], ['post', '/'], ['get', '/summary'], ['get', `/${id}`], ['patch', `/${id}`], ['delete', `/${id}`]];
  for (const [m, u] of cases) assert.strictEqual((await api(m, u, { body: { title: 'x' } })).statusCode, 401, `${m} ${u}`);
  assert.strictEqual(Task.calls.length, before);
});
test('routing: protect is registered first; register/login are public; mounted paths match the frontend', () => {
  assert.strictEqual(taskRouter.log[0].kind, 'use');
  assert.strictEqual(taskRouter.log[0].fn, protect);
  const find = (m, p) => authRouter.log.find((e) => e.method === m && e.path === p).fns;
  assert.ok(!find('post', '/register').includes(protect));
  assert.ok(!find('post', '/login').includes(protect));
  assert.ok(find('get', '/profile').includes(protect));
  const mounts = app.log.filter((a) => typeof a[0] === 'string').map((a) => a[0]).sort();
  assert.deepStrictEqual(mounts, ['/api/auth', '/api/tasks']);
});

// ===================== create + validation =====================
test('create: 201, defaults applied, owner forced to the logged-in user, text trimmed', async () => {
  const res = await api('post', '/', { token: 'tokenA', body: { title: '  Buy milk  ', user: 'userB', _id: 'hack' } });
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.data.user, 'userA');
  assert.strictEqual(res.body.data.title, 'Buy milk');
  assert.strictEqual(res.body.data.status, 'todo');
  assert.strictEqual(res.body.data.priority, 'medium');
  assert.notStrictEqual(res.body.data._id, 'hack');
});
test('create: invalid input -> 400 with messages, and nothing is saved', async () => {
  const before = Task.docs.length;
  const bad = [{}, { title: '' }, { title: 'x', status: 'finished' }, { title: 'x', priority: 'urgent' },
    { title: 'a'.repeat(101) }, { title: 'x', description: 'a'.repeat(501) }, { title: { $ne: 1 } }];
  for (const body of bad) {
    const res = await api('post', '/', { token: 'tokenA', body });
    assert.strictEqual(res.statusCode, 400, JSON.stringify(body).slice(0, 40));
    assert.ok(Array.isArray(res.body.errors) && res.body.errors.length > 0);
  }
  assert.strictEqual(Task.docs.length, before);
});

// ===================== filtering through the API =====================
test('filtering via the API (simulated store): status, priority, search, combinations, user isolation', async () => {
  Task.docs.length = 0;
  await add('tokenA', { title: 'Buy Milk', description: 'two litres', status: 'todo', priority: 'low' });
  await add('tokenA', { title: 'Write report', description: 'for MILK project', status: 'in-progress', priority: 'high' });
  await add('tokenA', { title: 'Pay rent', status: 'done', priority: 'high' });
  await add('tokenA', { title: 'Plan a.b trip', status: 'done', priority: 'medium' });
  await add('tokenB', { title: 'Buy milk', status: 'done', priority: 'high' });
  const titles = async (query, token = 'tokenA') => {
    const res = await api('get', '/', { token, query });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.count, res.body.data.length);
    return res.body.data.map((t) => t.title);
  };
  assert.deepStrictEqual(await titles({}), ['Plan a.b trip', 'Pay rent', 'Write report', 'Buy Milk']); // newest first
  assert.deepStrictEqual((await titles({ status: 'done' })).sort(), ['Pay rent', 'Plan a.b trip']);
  assert.deepStrictEqual((await titles({ priority: 'high' })).sort(), ['Pay rent', 'Write report']);
  assert.deepStrictEqual(await titles({ status: 'done', priority: 'high' }), ['Pay rent']);
  assert.deepStrictEqual((await titles({ search: 'milk' })).sort(), ['Buy Milk', 'Write report']);
  assert.deepStrictEqual(await titles({ search: 'a.b' }), ['Plan a.b trip']);
  assert.deepStrictEqual(await titles({ search: 'zzz' }), []);
  assert.deepStrictEqual(await titles({ status: 'all', priority: 'all' }), await titles({}));
  assert.deepStrictEqual(await titles({}, 'tokenB'), ['Buy milk']);
  assert.deepStrictEqual(await titles({ user: 'userB' }), await titles({})); // cannot ask for another user's tasks
});
test('filtering: invalid or injected filter values -> 400 and the database is not queried', async () => {
  const before = Task.calls.length;
  for (const query of [{ status: 'finished' }, { priority: 'urgent' }, { status: { $ne: 'done' } },
    { search: { $regex: '.*' } }, { search: 'a'.repeat(101) }, { priority: ['high', 'low'] }]) {
    const res = await api('get', '/', { token: 'tokenA', query });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.message, 'Invalid filter');
  }
  assert.strictEqual(Task.calls.length, before);
});
test('summary: counts per status for the logged-in user only; "/summary" is not mistaken for an id', async () => {
  const a = await api('get', '/summary', { token: 'tokenA' });
  assert.strictEqual(a.statusCode, 200);
  assert.deepStrictEqual(a.body.data, { todo: 1, 'in-progress': 1, done: 2, total: 4 });
  const b = await api('get', '/summary', { token: 'tokenB' });
  assert.deepStrictEqual(b.body.data, { todo: 0, 'in-progress': 0, done: 1, total: 1 });
});

// ===================== one user cannot touch another user's tasks =====================
test('isolation: user B cannot read, update or delete user A\'s task (404) and A\'s task stays unchanged', async () => {
  Task.docs.length = 0;
  const mine = await add('tokenA', { title: 'Private', status: 'todo', priority: 'high' });
  const url = `/${mine._id}`;
  assert.strictEqual((await api('get', url, { token: 'tokenB' })).statusCode, 404);
  assert.strictEqual((await api('patch', url, { token: 'tokenB', body: { title: 'Hacked', status: 'done' } })).statusCode, 404);
  assert.strictEqual((await api('put', url, { token: 'tokenB', body: { title: 'Hacked' } })).statusCode, 404);
  assert.strictEqual((await api('delete', url, { token: 'tokenB' })).statusCode, 404);
  const still = await api('get', url, { token: 'tokenA' });
  assert.strictEqual(still.statusCode, 200);
  assert.strictEqual(still.body.data.title, 'Private');
  assert.strictEqual(still.body.data.status, 'todo');
});
test('isolation: an update can not give a task to another user (the "user" field is ignored)', async () => {
  const t = (await api('get', '/', { token: 'tokenA' })).body.data[0];
  const res = await api('patch', `/${t._id}`, { token: 'tokenA', body: { title: 'Renamed', user: 'userB' } });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.data.user, 'userA');
  assert.strictEqual((await api('get', `/${t._id}`, { token: 'tokenB' })).statusCode, 404);
});

// ===================== update / delete / ids =====================
test('update: owner can change status/priority/title (PATCH and PUT)', async () => {
  const t = (await api('get', '/', { token: 'tokenA' })).body.data[0];
  const r1 = await api('patch', `/${t._id}`, { token: 'tokenA', body: { status: 'in-progress' } });
  assert.strictEqual(r1.body.data.status, 'in-progress');
  const r2 = await api('put', `/${t._id}`, { token: 'tokenA', body: { priority: 'low', title: '  New  ' } });
  assert.strictEqual(r2.body.data.priority, 'low');
  assert.strictEqual(r2.body.data.title, 'New');
});
test('update: invalid values or empty body -> 400 and the task is unchanged', async () => {
  const t = (await api('get', '/', { token: 'tokenA' })).body.data[0];
  for (const body of [{}, { status: 'finished' }, { priority: 'urgent' }, { title: '' }, { user: 'userB' }]) {
    assert.strictEqual((await api('patch', `/${t._id}`, { token: 'tokenA', body })).statusCode, 400);
  }
  const after = (await api('get', `/${t._id}`, { token: 'tokenA' })).body.data;
  assert.strictEqual(after.title, 'New');
});
test('ids: malformed id -> 400 (before the database); well-formed unknown id -> 404', async () => {
  const before = Task.calls.length;
  for (const bad of ['123', 'zzzzzzzzzzzzzzzzzzzzzzzz']) {
    assert.strictEqual((await api('get', `/${bad}`, { token: 'tokenA' })).statusCode, 400);
    assert.strictEqual((await api('delete', `/${bad}`, { token: 'tokenA' })).statusCode, 400);
  }
  assert.strictEqual(Task.calls.length, before);
  assert.strictEqual((await api('get', `/${'f'.repeat(24)}`, { token: 'tokenA' })).statusCode, 404);
});
test('delete: owner deletes -> 200, then the task is gone (404)', async () => {
  const t = (await api('get', '/', { token: 'tokenA' })).body.data[0];
  assert.strictEqual((await api('delete', `/${t._id}`, { token: 'tokenA' })).statusCode, 200);
  assert.strictEqual((await api('get', `/${t._id}`, { token: 'tokenA' })).statusCode, 404);
});
