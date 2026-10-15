// Offline tests with REAL file bytes (no libraries, no database).
const test = require('node:test');
const assert = require('node:assert');
const { detectImageType } = require('../src/utils/imageSignature');

const { REAL_PNG } = require('./fixtures');
const pad = (bytes) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(16)]);

test('signature: real PNG file is detected', () => {
  assert.strictEqual(detectImageType(REAL_PNG), 'image/png');
});
test('signature: JPEG start bytes are detected', () => {
  assert.strictEqual(detectImageType(pad([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])), 'image/jpeg');
});
test('signature: GIF87a and GIF89a are detected', () => {
  assert.strictEqual(detectImageType(pad(Buffer.from('GIF87a'))), 'image/gif');
  assert.strictEqual(detectImageType(pad(Buffer.from('GIF89a'))), 'image/gif');
});
test('signature: WebP (RIFF....WEBP) is detected', () => {
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WEBPVP8 '), Buffer.alloc(8)]);
  assert.strictEqual(detectImageType(webp), 'image/webp');
});
test('signature: RIFF file that is NOT WebP (e.g. WAV audio) is rejected', () => {
  const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WAVEfmt '), Buffer.alloc(8)]);
  assert.strictEqual(detectImageType(wav), null);
});
test('signature: text file renamed to .png is rejected', () => {
  assert.strictEqual(detectImageType(Buffer.from('this is plain text, not a picture at all')), null);
});
test('signature: HTML/script content is rejected', () => {
  assert.strictEqual(detectImageType(Buffer.from('<html><script>alert(1)</script></html>')), null);
});
test('signature: SVG is rejected (not a supported type)', () => {
  assert.strictEqual(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
});
test('signature: empty, tiny, and non-buffer input are rejected', () => {
  assert.strictEqual(detectImageType(Buffer.alloc(0)), null);
  assert.strictEqual(detectImageType(Buffer.from([0xff, 0xd8, 0xff])), null);
  assert.strictEqual(detectImageType('not a buffer'), null);
  assert.strictEqual(detectImageType(undefined), null);
});
