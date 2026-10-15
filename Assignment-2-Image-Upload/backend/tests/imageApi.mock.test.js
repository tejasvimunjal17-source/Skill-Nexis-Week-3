// MOCK tests: express, multer, cors and the database model are replaced with small fakes,
// so these run without npm install and without MongoDB. They test THIS project's logic
// (controller behaviour and route wiring), not the real Multer library or a real database.
const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');
const path = require('node:path');
const { REAL_PNG } = require('./fixtures');

const SRC = path.resolve(__dirname, '../src');
const calls = [];
let multerConfig = null;
let multerField = null;
const storedDocs = {};

// ---- fakes ----
const fakeMulter = (config) => {
  multerConfig = config;
  return { single: (field) => { multerField = field; return function multerMiddleware() {}; } };
};
fakeMulter.memoryStorage = () => ({ kind: 'memory' });

const ID = '507f1f77bcf86cd799439011';
const fakeImage = {
  create: async (data) => { calls.push(['create', data]); const doc = { _id: ID, createdAt: new Date(0), ...data }; storedDocs[ID] = doc; return doc; },
  find: () => {
    const chain = { log: [] };
    chain.select = (s) => { calls.push(['find.select', s]); return chain; };
    chain.sort = (s) => { calls.push(['find.sort', s]); return chain; };
    chain.limit = async (n) => { calls.push(['find.limit', n]); return [{ _id: ID, originalName: 'a.png', mimeType: 'image/png', size: 5, createdAt: new Date(0) }]; };
    return chain;
  },
  findById: (id) => ({ select: async (s) => { calls.push(['findById', id, s]); return storedDocs[id] || null; } }),
};

const makeRouter = () => {
  const router = { log: [] };
  router.route = (p) => {
    const chain = {};
    ['get', 'post'].forEach((m) => { chain[m] = (...fns) => { router.log.push([m, p, fns]); return chain; }; });
    return chain;
  };
  router.get = (p, ...fns) => router.log.push(['get', p, fns]);
  return router;
};
const fakeExpress = () => { const app = { log: [] }; app.use = (...a) => app.log.push(['use', ...a]); app.get = (...a) => app.log.push(['get', ...a]); return app; };
fakeExpress.json = () => function jsonParser() {};
fakeExpress.Router = makeRouter;

const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === 'multer') return fakeMulter;
  if (request === 'express') return fakeExpress;
  if (request === 'cors') return () => function corsMiddleware() {};
  if (parent && request.startsWith('.')) {
    const resolved = path.resolve(path.dirname(parent.filename), request);
    if (resolved === path.join(SRC, 'models', 'Image')) return fakeImage;
  }
  return originalLoad.call(this, request, parent, ...rest);
};
const uploadMiddleware = require('../src/middleware/uploadImage');
const { uploadImage, listImages, getImageFile } = require('../src/controllers/imageController');
const { validateObjectId } = require('../src/middleware/validateObjectId');
const router = require('../src/routes/imageRoutes');
const app = require('../src/app');
Module._load = originalLoad;

const call = (handler, req) => new Promise((resolve, reject) => {
  const res = { statusCode: 200, headers: {} };
  res.status = (c) => { res.statusCode = c; return res; };
  res.set = (h) => { Object.assign(res.headers, h); return res; };
  res.json = (b) => { res.body = b; resolve(res); return res; };
  res.send = (b) => { res.sent = b; resolve(res); return res; };
  handler(req, res, reject);
});

test('multer setup: memory storage, 2 MB limit, one file, field name "image"', () => {
  assert.deepStrictEqual(multerConfig.storage, { kind: 'memory' });
  assert.strictEqual(multerConfig.limits.fileSize, 2 * 1024 * 1024);
  assert.strictEqual(multerConfig.limits.files, 1);
  assert.strictEqual(typeof multerConfig.fileFilter, 'function');
  assert.strictEqual(multerField, 'image');
});

test('upload: no file -> 400 and nothing saved', async () => {
  calls.length = 0;
  const res = await call(uploadImage, { file: undefined });
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.message, /"image"/);
  assert.strictEqual(calls.length, 0);
});
test('upload: text file pretending to be PNG -> 400 and nothing saved', async () => {
  calls.length = 0;
  const res = await call(uploadImage, {
    file: { originalname: 'evil.png', mimetype: 'image/png', size: 40, buffer: Buffer.from('<script>alert(1)</script> not an image!!!') },
  });
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.message, /not a valid/);
  assert.strictEqual(calls.length, 0);
});
test('upload: real PNG -> 201, saved with the DETECTED type, response has url and no picture data', async () => {
  calls.length = 0;
  const res = await call(uploadImage, {
    // the browser claims JPEG, but the bytes are PNG: the stored type must be PNG
    file: { originalname: '../../photo.jpg', mimetype: 'image/jpeg', size: REAL_PNG.length, buffer: REAL_PNG },
  });
  assert.strictEqual(res.statusCode, 201);
  const saved = calls.find((c) => c[0] === 'create')[1];
  assert.strictEqual(saved.mimeType, 'image/png');
  assert.strictEqual(saved.originalName, 'photo.jpg');
  assert.strictEqual(saved.size, REAL_PNG.length);
  assert.ok(Buffer.isBuffer(saved.data));
  assert.strictEqual(res.body.data.url, `/api/images/${ID}/file`);
  assert.strictEqual(res.body.data.data, undefined);
  assert.ok(!JSON.stringify(res.body).includes(REAL_PNG.toString('base64')));
});

test('list: newest first, limited, and never loads picture data', async () => {
  calls.length = 0;
  const res = await call(listImages, {});
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(calls.find((c) => c[0] === 'find.select')[1], '-data');
  assert.deepStrictEqual(calls.find((c) => c[0] === 'find.sort')[1], { createdAt: -1 });
  assert.strictEqual(calls.find((c) => c[0] === 'find.limit')[1], 50);
  assert.strictEqual(res.body.data[0].url, `/api/images/${ID}/file`);
  assert.strictEqual(res.body.data[0].data, undefined);
});

test('file: returns the stored bytes with the stored type, nosniff and caching headers', async () => {
  const res = await call(getImageFile, { params: { id: ID } });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.headers['Content-Type'], 'image/png');
  assert.strictEqual(res.headers['X-Content-Type-Options'], 'nosniff');
  assert.match(res.headers['Cache-Control'], /max-age/);
  assert.ok(Buffer.compare(res.sent, REAL_PNG) === 0);
});
test('file: unknown id -> 404', async () => {
  const res = await call(getImageFile, { params: { id: 'aaaaaaaaaaaaaaaaaaaaaaaa' } });
  assert.strictEqual(res.statusCode, 404);
});

test('routes: POST / runs the upload middleware BEFORE the controller; GET / lists', () => {
  const post = router.log.find((e) => e[0] === 'post' && e[1] === '/')[2];
  assert.strictEqual(post[0], uploadMiddleware);
  assert.strictEqual(post[1], uploadImage);
  const get = router.log.find((e) => e[0] === 'get' && e[1] === '/')[2];
  assert.strictEqual(get[0], listImages);
});
test('routes: GET /:id/file validates the id BEFORE reading the database', () => {
  const fns = router.log.find((e) => e[0] === 'get' && e[1] === '/:id/file')[2];
  assert.strictEqual(fns[0], validateObjectId);
  assert.strictEqual(fns[1], getImageFile);
});
test('app: router is mounted at /api/images (the path the frontend calls)', () => {
  const mounts = app.log.filter((e) => e[0] === 'use' && typeof e[1] === 'string').map((e) => e[1]);
  assert.deepStrictEqual(mounts, ['/api/images']);
});
