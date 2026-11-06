#!/usr/bin/env node
'use strict';

// Serve the author's website against this checkout without changing Markdown
// or writing generated build output into tracked files. Node stdlib only.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const build = require('../site/build.js');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inside = filename => filename === root || filename.startsWith(root + path.sep);

function localAssets() {
  const data = vm.runInNewContext(fs.readFileSync(path.join(root, 'site/data.js'), 'utf8') +
    ';({ROADMAP_PREREQS,PHASES,LEARNING_PATHS,GLOSSARY_CATEGORY_ORDER,GLOSSARY,ARTIFACTS})');
  data.PHASES = build.parseReadme(fs.readFileSync(path.join(root, 'README.md'), 'utf8'),
    build.parseRoadmap(fs.readFileSync(path.join(root, 'ROADMAP.md'), 'utf8')));
  for (const phase of data.PHASES) for (const lesson of phase.lessons) {
    const rel = (lesson.url || '').replace(/^https:\/\/github.com\/[^/]+\/[^/]+\/tree\/[^/]+\//, '').replace(/\/+$/, '');
    if (!rel.startsWith('phases/')) continue;
    const file = path.join(root, rel, 'docs/en.md');
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lesson.summary = (lines.find(line => line.startsWith('> ')) || '').slice(2);
    lesson.keywords = lines.filter(line => line.startsWith('### ')).map(line => line.slice(4)).join(' · ');
  }
  data.LEARNING_PATHS = build.parseLearningPaths(root, data.PHASES);
  // Retain the author's structured links and categories, replacing text fields
  // with the translated glossary. The source Markdown remains untouched.
  const fields = {'Mọi người thường nói':'says','Ý nghĩa thực tế':'means','Vì sao quan trọng':'whyItMatters',
    'Trong thực tế':'example','Nhầm lẫn thường gặp':'confusion','Vì sao có tên gọi này':'whyCalled'};
  let entry;
  for (const line of fs.readFileSync(path.join(root, 'glossary/terms.md'), 'utf8').split(/\r?\n/)) {
    const heading = line.match(/^###\s+(.+)/);
    if (heading) entry = data.GLOSSARY.find(item => item.term === heading[1].trim());
    const field = line.match(/^- \*\*([^:]+):\*\*\s*(.*)/);
    if (entry && field && fields[field[1]]) entry[fields[field[1]]] = field[2];
  }
  data.ARTIFACTS = build.discoverArtifacts();
  const cert = build.parseCertifications();
  return new Map([
    ['/site/data.js', Object.entries(data).map(([key,value]) => `const ${key} = ${JSON.stringify(value)};`).join('\n')],
    ['/site/build-meta.js', 'window.__AIFS_REF="main";'],
    ['/site/langs.js', 'window.AIFS_LANGS=[{code:"vi",native:"Tiếng Việt"}];'],
    ['/site/figure-manifest.js', build.serializeFigureProviderManifest(build.buildFigureProviderManifest())],
    ['/site/certification-data.js', `const CERTIFICATIONS = ${JSON.stringify(cert)};`],
  ]);
}

function createServer(assets = localAssets()) {
  const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.cjs':'text/javascript; charset=utf-8',
    '.css':'text/css; charset=utf-8','.md':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8',
    '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
    '.woff2':'font/woff2','.ico':'image/x-icon','.pdf':'application/pdf'};
  return http.createServer((req,res) => {
    function send(status, body, type = 'text/plain; charset=utf-8') {
      res.writeHead(status, {'Content-Type':type,'Cache-Control':'no-store','Content-Length':Buffer.byteLength(body),
        'X-Content-Type-Options':'nosniff'});
      res.end(req.method === 'HEAD' ? undefined : body);
    }
    try {
      if (!['GET','HEAD'].includes(req.method)) return send(405,'Method not allowed');
      const url = new URL(req.url, 'http://localhost');
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/') { res.writeHead(302,{Location:'/site/index.html#contents'}); return res.end(); }
      if (pathname.split('/').some(part => part.startsWith('.') || part.includes('\\') || part.includes('\0'))) return send(403,'Forbidden');
      if (!/^\/(site|phases|glossary|docs|certifications|learning-paths|manuals)\//.test(pathname) && !/^\/(README|ROADMAP)\.md$/.test(pathname)) return send(404,'Not found');
      if (assets.has(pathname)) return send(200,assets.get(pathname),'text/javascript; charset=utf-8');
      if (/^\/site\/(lesson|certification)$/.test(pathname)) pathname += '.html';
      let file = path.resolve(root, '.' + pathname);
      if (!inside(file) || !fs.existsSync(file)) return send(404,'Not found');
      file = fs.realpathSync(file);
      if (!inside(file)) return send(403,'Forbidden');
      if (fs.statSync(file).isDirectory()) {
        if (!pathname.endsWith('/')) {res.writeHead(302,{Location:pathname + '/' + url.search});return res.end();}
        const index = path.join(file,'index.html');
        if (fs.existsSync(index)) file = index;
        else {
          const links = fs.readdirSync(file,{withFileTypes:true}).filter(item => !item.name.startsWith('.')).map(item =>
            `<li><a href="${encodeURIComponent(item.name)}${item.isDirectory()?'/':''}">${escape(item.name)}</a></li>`).join('');
          return send(200,`<!doctype html><meta charset="utf-8"><title>Directory listing for ${escape(pathname)}</title><h1>Directory listing for ${escape(pathname)}</h1><ul>${links}</ul>`,'text/html; charset=utf-8');
        }
      }
      let body = fs.readFileSync(file);
      if (path.extname(file) === '.html') body = Buffer.from(body.toString('utf8').replace(/<head([^>]*)>/i,
        '<head$1><script>window.AIFS_LOCAL_READER_LANGUAGE="vi";</script>'));
      send(200,body,mime[path.extname(file)] || 'application/octet-stream');
    } catch (error) {
      send(400,'Unable to read this local resource');
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.AIFS_LOCAL_PORT || 8765);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid port');
  const server = createServer();
  server.on('error', error => {console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Close the earlier local reader or select AIFS_LOCAL_PORT.` : error.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',() => {
    const url = `http://127.0.0.1:${port}/site/index.html#contents`;
    console.log(`Local: ${url}\nPress Ctrl+C to stop. Restart to refresh the course index after editing Markdown.`);
    if (process.argv.includes('--open') && process.platform === 'win32') {
      require('node:child_process').spawn('explorer.exe', [url], {stdio:'ignore'}).unref();
    }
  });
  process.on('SIGINT',() => server.close());
}
module.exports = {createServer,localAssets};
