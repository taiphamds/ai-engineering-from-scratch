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

test('local interview routes render translated questions with folded answers and working assets', async t => {
  const server = createServer(assets);
  await new Promise((resolve, reject) => {server.once('error', reject);server.listen(0, '127.0.0.1', resolve);});
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = 'http://127.0.0.1:' + server.address().port;
  const request = (resource, options) => fetch(base + resource, options);
  for (const resource of ['/interviews', '/interviews/', '/interviews/index.html', '/site/interviews']) {
    const response = await request(resource);
    assert.equal(response.status, 200, resource);
    assert.match(response.headers.get('content-type'), /^text\/html/);
    assert.match(await response.text(), /data-interviews-index/);
  }
  const card = await request('/interviews/transformers');
  assert.equal(card.status, 200);
  const cardHtml = await card.text();
  assert.match(cardHtml, /data-interviews-card="transformers"/);
  const questionUrl = '/interviews/transformers/why-scale-by-sqrt-dk';
  const question = await request(questionUrl);
  assert.equal(question.status, 200);
  const html = await question.text();
  assert.match(html, /<html lang="vi"/);
  assert.match(html, /Trong công thức attention/);
  assert.match(html, /<details class="iv-answer" data-answer="short"><summary>Show short answer<\/summary>/);
  assert.match(html, /<details class="iv-answer" data-answer="full">/);
  const full = html.match(/<details class="iv-answer" data-answer="full">[\s\S]*?<\/details>/)[0];
  assert.match(full, /Gradient của softmax/);
  assert.doesNotMatch(html.replace(/<details\b[\s\S]*?<\/details>/g, '').replace(/<head>[\s\S]*?<\/head>/, ''), /Gradient của softmax/);
  assert.equal(await (await request(questionUrl + '.html')).text(), html);
  const head = await request(questionUrl, {method:'HEAD'});
  assert.equal(head.status, 200);
  assert.equal(Number(head.headers.get('content-length')), Buffer.byteLength(html));
  assert.equal(await head.text(), '');
  for (const asset of Array.from(html.matchAll(/(?:src|href)="(\/[^"#?]+\.(?:js|css))(?:\?[^" ]*)?"/g), match => match[1])) {
    const response = await request(asset);
    assert.equal(response.status, 200, asset);
    assert.match(response.headers.get('content-type'), /(?:javascript|css)/, asset);
  }
  const lessonLink = html.match(/href="(\/lesson\?[^" ]+)"/)[1];
  assert.equal((await request(lessonLink)).status, 200);
  const api = await (await request('/api/interviews.json')).json();
  assert.equal(api.items.filter(item => item.type === 'question').length, 482);
  assert.equal(await (await request('/interviews.json')).text(), JSON.stringify(api) + '\n');
  const sourcePath = '/interviews/questions/transformers/why-scale-by-sqrt-dk.md';
  assert.deepEqual(Buffer.from(await (await request(sourcePath)).arrayBuffer()), fs.readFileSync(path.join(root, sourcePath)));
  const scenario = await request('/interviews/scenarios/alert-on-the-driver-line');
  assert.equal(scenario.status, 200);
  assert.match(await scenario.text(), /data-answer="resolution"/);
  for (const resource of ['/interviews/missing', '/interviews/transformers/missing', '/interviews/%2egit/config']) {
    assert.ok([403,404].includes((await request(resource)).status), resource);
  }
});

test('local preview keeps structural errors fatal and the production builder strict', t => {
  const bankLib = require('./interviews/validate');
  const {buildInterviews} = require('../site/build-interviews');
  const editorial = 'interviews/questions/transformers/example.md: the prompt or a follow-up question shows an answer span: "shared text"';
  const structural = 'interviews/questions/transformers/example.md: front matter has no title';
  const stub = t.mock.method(bankLib, 'loadBank', () => ({errors:[editorial]}));
  assert.throws(() => buildInterviews(), /the prompt or a follow-up question shows an answer span/);
  stub.mock.mockImplementation(() => ({errors:[structural]}));
  assert.throws(() => buildInterviews({localPreview:true}), /front matter has no title/);
  stub.mock.mockImplementation(() => ({errors:['interviews/scenarios/alert-on-the-driver-line/evidence/a-server-that-became-healthy.txt: the listing does not match source byte for byte']}));
  t.mock.method(bankLib, 'expectedBody', () => ({body:'different evidence\n'}));
  assert.throws(() => buildInterviews({localPreview:true}), /byte for byte/);
});
