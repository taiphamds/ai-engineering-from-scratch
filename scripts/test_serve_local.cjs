'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createServer, localAssets} = require('./serve-local.cjs');
const root = path.resolve(__dirname, '..');
const assets = localAssets();
const data = vm.runInNewContext(assets.get('/site/data.js') + ';({PHASES,GLOSSARY,LEARNING_PATHS})');

test('local Vietnamese lesson fetch uses checkout content after the upstream loader refactor', async () => {
  const template = fs.readFileSync(path.join(root, 'site/lesson.html'), 'utf8');
  const start = template.indexOf('      function fetchLessonDocument(');
  const end = template.indexOf('      var lessonCodeRequests', start);
  assert.ok(start >= 0 && end > start);
  const calls = [];
  const context = {
    window: {AIFS_LOCAL_READER_LANGUAGE: 'vi'},
    fetchRepositoryFile: async resource => {calls.push(resource);return {text: async () => 'Nội dung từ checkout'};},
    fetch: async () => {throw new Error('Local Vietnamese must not fetch remote translations');},
  };
  const load = vm.runInNewContext(template.slice(start, end) + ';fetchLessonDocument', context);
  const result = await load('vi', 'phases/example/docs/en.md', 'https://example.com/remote.md');
  assert.equal(result.markdown, 'Nội dung từ checkout');
  assert.equal(result.lang, 'vi');
  assert.deepEqual(calls, ['phases/example/docs/en.md']);
});

test('homepage dictionary covers incoming simulation cards and lesson counters', () => {
  const context = {window: {AIFS_LOCAL_READER_LANGUAGE: 'vi'}, PHASES: data.PHASES, LEARNING_PATHS: data.LEARNING_PATHS, ARTIFACTS: []};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'site/home-vi.js'), 'utf8'), context);
  const strings = context.window.AIFS_UI_STRINGS.vi;
  assert.equal(strings['Inside a Decompiler'], 'Bên trong một trình dịch ngược');
  assert.equal(strings['Search lessons'], 'Tìm bài học');
  assert.equal(strings['{n} lessons'], '{n} bài học');
});

test('local catalog points to existing lessons and uses their current translated summaries', () => {
  assert.equal(data.PHASES.length, 20);
  for (const phase of data.PHASES) for (const lesson of phase.lessons) {
    const rel = new URL(lesson.url).pathname.split('/tree/main/')[1];
    const markdown = fs.readFileSync(path.join(root, rel, 'docs/en.md'), 'utf8');
    assert.equal(lesson.summary, (markdown.split(/\r?\n/).find(line => line.startsWith('> ')) || '').slice(2));
  }
  assert.match(data.GLOSSARY.find(item => item.term === 'Activation Checkpointing').means, /Một kỹ thuật/);
  const reverseEngineering = data.LEARNING_PATHS.find(item => item.id === 'reverse-engineering');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'learning-paths/reverse-engineering.json'), 'utf8'));
  assert.equal(reverseEngineering.summary, manifest.summary);
  assert.match(reverseEngineering.summary, /Đọc một chương trình/);
});

test('local reader serves original Markdown bytes and HTML routes, without exposing private files', async t => {
  const server = createServer(assets);
  await new Promise((resolve, reject) => {server.once('error', reject);server.listen(0, '127.0.0.1', resolve);});
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = 'http://127.0.0.1:' + server.address().port;
  const request = (resource, options) => fetch(base + resource, options);
  const redirect = await request('/', {redirect:'manual'});
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get('location'), '/site/index.html#contents');
  const home = await request('/');
  assert.equal(home.status, 200);
  assert.match(home.url, /\/site\/index.html$/);
  assert.match(await home.text(), /window\.AIFS_LOCAL_READER_LANGUAGE="vi"/);
  const sourcePath = '/phases/00-setup-and-tooling/01-dev-environment/docs/en.md';
  const source = await request(sourcePath);
  assert.equal(source.status, 200);
  assert.deepEqual(Buffer.from(await source.arrayBuffer()), fs.readFileSync(path.join(root, sourcePath)));
  const head = await request(sourcePath, {method:'HEAD'});
  assert.equal(head.headers.get('content-length'), String(fs.statSync(path.join(root, sourcePath)).size));
  assert.equal(await head.text(), '');
  const lesson = await request('/site/lesson?path=phases/00-setup-and-tooling/01-dev-environment');
  assert.equal(lesson.status, 200);
  assert.match(await lesson.text(), /var localVietnamese/);
  const listing = await request('/phases/00-setup-and-tooling/01-dev-environment/outputs/');
  assert.match(await listing.text(), /href="prompt-env-check\.md"/);
  for (const resource of ['/.git/config','/site/%2egit/config','/scripts/serve-local.cjs','/site/missing.html']) {
    assert.ok([403,404].includes((await request(resource)).status), resource);
  }
  assert.equal((await request('/site/index.html', {method:'POST'})).status, 405);
});
