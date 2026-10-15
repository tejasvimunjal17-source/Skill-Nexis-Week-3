// MOCK tests of the security boundary. express, jsonwebtoken and the database models are replaced
// by small fakes, so these run without npm install and without MongoDB. They check OUR code's logic
// (what the middleware and routes do), not the real libraries or a real database.
const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');
const path = require('node:path');

const SRC = path.resolve(__dirname, '../src');
const events = [];

// ---- fakes ----
const fakeJwt = {
  verify(token) {
    if (token === 'expired') throw Object.assign(new Error('x'), { name: 'TokenExpiredError' });
    if (token === 'good' || token === 'deleted-user') return { id: token === 'good' ? 'u1' : 'u2' };
    throw Object.assign(new Error('x'), { name: 'JsonWebTokenError' });
  },
};
const fakeUserModel = { findById: async (id) => (id === 'u1' ? { _id: 'u1', name: 'Ana' } : null) };
const fakeTodoModel = {};

const makeRouter = () => {
  const router = { log: [] };
  router.use = (fn) => router.log.push(['use', fn]);
  router.post = (p, ...fns) => router.log.push(['post', p, fns]);
  router.get = (p, ...fns) => router.log.push(['get', p, fns]);
  router.route = (p) => {
    const chain = {};
    ['get', 'post', 'put', 'patch', 'delete'].forEach((m) => {
      chain[m] = (...fns) => { router.log.push([m, p, fns]); return chain; };
    });
    return chain;
  };
  return router;
};
const fakeExpress = () => {
  const app = { log: [] };
  app.use = (...args) => app.log.push(['use', ...args]);
  app.get = (...args) => app.log.push(['get', ...args]);
  return app;
};
fakeExpress.json = () => function jsonParser() {};
fakeExpress.Router = makeRouter;
const fakeCors = () => function corsMiddleware() {};

const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === 'jsonwebtoken') return fakeJwt;
  if (request === 'bcrypt') return {};
  if (request === 'express') return fakeExpress;
  if (request === 'cors') return fakeCors;
  if (parent && request.startsWith('.')) {
    const resolved = path.resolve(path.dirname(parent.filename), request);
    if (resolved === path.join(SRC, 'models', 'User')) return fakeUserModel;
    if (resolved === path.join(SRC, 'models', 'Todo')) return fakeTodoModel;
  }
  return originalLoad.call(this, request, parent, ...rest);
};
process.env.JWT_SECRET = 'a'.repeat(32);
const { protect } = require('../src/middleware/authMiddleware');
const todoRouter = require('../src/routes/todoRoutes');
const authRouter = require('../src/routes/authRoutes');
const app = require('../src/app');
Module._load = originalLoad;

const call = (req) =>
  new Promise((resolve) => {
    const res = { statusCode: 200 };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { res.body = b; resolve({ res, nextCalled: false, req }); };
    protect(req, res, () => resolve({ res, nextCalled: true, req }));
  });

test('protect: no Authorization header -> 401', async () => {
  const r = await call({ headers: {} });
  assert.strictEqual(r.res.statusCode, 401);
  assert.strictEqual(r.nextCalled, false);
});
test('protect: wrong scheme (not Bearer) -> 401', async () => {
  const r = await call({ headers: { authorization: 'Basic abc' } });
  assert.strictEqual(r.res.statusCode, 401);
});
test('protect: forged/invalid token -> 401', async () => {
  const r = await call({ headers: { authorization: 'Bearer bad' } });
  assert.strictEqual(r.res.statusCode, 401);
  assert.strictEqual(r.nextCalled, false);
});
test('protect: expired token -> 401 with a "log in again" message', async () => {
  const r = await call({ headers: { authorization: 'Bearer expired' } });
  assert.strictEqual(r.res.statusCode, 401);
  assert.match(r.res.body.message, /expired/);
});
test('protect: valid token for a deleted user -> 401', async () => {
  const r = await call({ headers: { authorization: 'Bearer deleted-user' } });
  assert.strictEqual(r.res.statusCode, 401);
});
test('protect: valid token -> next() and req.user is set', async () => {
  const req = { headers: { authorization: 'Bearer good' } };
  const r = await call(req);
  assert.strictEqual(r.nextCalled, true);
  assert.strictEqual(req.user._id, 'u1');
});

test('routes: todo router applies protect BEFORE any to-do route', () => {
  assert.strictEqual(todoRouter.log[0][0], 'use');
  assert.strictEqual(todoRouter.log[0][1], protect);
  const methods = todoRouter.log.slice(1).map((e) => `${e[0]} ${e[1]}`);
  assert.deepStrictEqual(methods.sort(),
    ['delete /:id', 'get /', 'get /:id', 'patch /:id', 'post /', 'put /:id'].sort());
});
test('routes: register and login are public, profile is protected', () => {
  const find = (m, p) => authRouter.log.find((e) => e[0] === m && e[1] === p)[2];
  assert.ok(!find('post', '/register').includes(protect));
  assert.ok(!find('post', '/login').includes(protect));
  assert.ok(find('get', '/profile').includes(protect));
});
test('app: auth and todo routers are mounted at the paths the frontend calls', () => {
  const mounts = app.log.filter((e) => e[0] === 'use' && typeof e[1] === 'string').map((e) => e[1]);
  assert.deepStrictEqual(mounts.sort(), ['/api/auth', '/api/todos']);
});
