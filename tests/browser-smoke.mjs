#!/usr/bin/env node
// Browser smoke test for the gpx-map shortcode.
//
// Builds a throw-away Hugo site from exampleSite, serves it and drives a real
// Chromium through the maps. Covers the regressions that bit us before:
//   * a page-level `const L` shadowing window.L
//   * a Leaflet that shows up late (or never)
//   * GPX paths that have to survive a nested page / sub-path baseURL
//   * the elevation chart being drawn while its container has no size
//
// Requirements: hugo on PATH (or HUGO_BIN), node >= 18, playwright
// (`npm i playwright` or `npx playwright install chromium`).
//
// Run: node tests/browser-smoke.mjs [--keep]

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { cpSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, resolve } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const TMP = join(ROOT, 'tests/.tmp');
const SITE = join(TMP, 'site');
const HUGO_BIN = process.env.HUGO_BIN || 'hugo';
const KEEP = process.argv.includes('--keep');

let playwright;
async function loadPlaywright() {
  for (const mod of ['playwright', 'playwright-core']) {
    try { return await import(mod); } catch { /* try next */ }
  }
  if (process.env.PLAYWRIGHT_MODULE) {
    // Point at any node_modules directory that contains playwright.
    const req = createRequire(join(process.env.PLAYWRIGHT_MODULE, 'index.js'));
    for (const mod of ['playwright', 'playwright-core']) {
      try { return req(mod); } catch { /* try next */ }
    }
  }
  return null;
}
playwright = await loadPlaywright();
if (!playwright) {
  console.error('browser-smoke: playwright not found. Install with `npm i playwright` and `npx playwright install chromium`,');
  console.error('or point PLAYWRIGHT_MODULE at a node_modules directory containing playwright and CHROME_PATH at a Chromium binary.');
  process.exit(2);
}

let failed = 0;
const check = (name, cond, detail = '') => {
  if (cond) console.log(`  ok   ${name}`);
  else { failed++; console.log(`  FAIL ${name}${detail ? '\n       ' + detail : ''}`); }
};
const section = t => console.log(`\n${t}`);

// ------------------------------------------------------------------ fixture
async function buildFixture() {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
  cpSync(join(ROOT, 'exampleSite'), SITE, {
    recursive: true,
    filter: src => !/\/(public|resources|\.hugo_build\.lock)$/.test(src),
  });

  await writeFile(join(SITE, 'go.mod'), `module exampleSite

go 1.22.0

replace github.com/ravelzh/hugo-gpx-module => ${ROOT}

require github.com/ravelzh/hugo-gpx-module v1.2.2 // indirect
`);

  await writeFile(join(SITE, 'hugo.toml'), `baseURL = 'http://example.invalid/'
languageCode = 'en-us'
title = 'GPX Module Test Site'

[module]
  [[module.imports]]
    path = "github.com/ravelzh/hugo-gpx-module"

[params.gpx]
  defaultLayer = "osm"
  showStats = true

[markup.goldmark.renderer]
  unsafe = true
`);

  // Fixture: a page-level lexical `const L` that shadows window.L.
  await writeFile(join(SITE, 'content/global-shadow.md'), `---
title: "Global L shadowing"
---

<script>const L = { version: "not-leaflet" };</script>

{{< gpx-map file="gpx/global.gpx" file2="gpx/global.gpx" height="400px" >}}
`);

  // Fixture: path resolution variants.
  await writeFile(join(SITE, 'content/paths.md'), `---
title: "Path resolution"
---

Plain relative: {{< gpx-map file="test.gpx" height="200px" >}}

Root relative: {{< gpx-map file="/test.gpx" height="200px" >}}

Parent relative: {{< gpx-map file="../test.gpx" height="200px" >}}

Absolute URL: {{< gpx-map file="https://example.com/track.gpx" height="200px" >}}
`);

  const build = (extra) => execFileSync(HUGO_BIN, ['--source', SITE, '--quiet', ...extra], { stdio: 'pipe' });
  build(['-d', join(SITE, 'public')]);
  // Sub-path baseURL: verifies that relative GPX paths are resolved via relURL.
  build(['-d', join(SITE, 'public/sub'), '--baseURL', 'http://localhost:1/sub/']);

  const resolved = await readFile(join(SITE, 'public/paths/index.html'), 'utf8');
  return resolved;
}

// -------------------------------------------------------------- static files
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.gpx': 'application/gpx+xml', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json', '.xml': 'application/xml',
  '.woff2': 'font/woff2', '.map': 'application/json',
};

function serve(dir) {
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = resolve(dir, '.' + url);
    if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
    try {
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

// ------------------------------------------------------------------- helpers
const wait = ms => new Promise(r => setTimeout(r, ms));

async function loadPage(ctx, url, opts = {}) {
  const page = await ctx.newPage();
  const errors = [];
  const notFound = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().split('\n')[0].slice(0, 160)); });
  page.on('pageerror', e => errors.push('pageerror: ' + String(e.message).split('\n')[0].slice(0, 160)));
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(opts.origin || '')) notFound.push(r.status() + ' ' + r.url()); });
  if (opts.route) await opts.route(page);
  await page.goto(url, { waitUntil: 'load' });
  return { page, errors, notFound };
}

async function mapState(page) {
  return page.evaluate(() => [...document.querySelectorAll('.gpx-map')].map(m => {
    const sec = m.closest('.gpx-map-container');
    const loader = m.querySelector('.gpx-loading');
    const svg = sec.querySelector('.elevation-chart-wrapper svg');
    const rect = svg && svg.querySelector('rect');
    return {
      init: m.classList.contains('leaflet-container'),
      loaderHidden: loader ? getComputedStyle(loader).display === 'none' : true,
      markers: m.querySelectorAll('.leaflet-marker-icon').length,
      routes: sec.querySelectorAll('.gpx-route-checkbox').length,
      selectorVisible: (() => { const s = sec.querySelector('.gpx-route-selector'); return s ? getComputedStyle(s).display !== 'none' : false; })(),
      elevation: svg ? svg.querySelectorAll('path').length : 0,
      chartWidth: rect ? Number(rect.getAttribute('width')) : null,
      chartHeight: rect ? Number(rect.getAttribute('height')) : null,
    };
  }));
}

async function initAllMaps(page) {
  const maps = page.locator('.gpx-map');
  for (let i = 0; i < await maps.count(); i++) {
    await maps.nth(i).scrollIntoViewIfNeeded();
    await wait(1500);
  }
  await wait(500);
}

// ---------------------------------------------------------------------- main
const resolvedHtml = await buildFixture();
const server = await serve(join(SITE, 'public'));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await playwright.chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

try {
  // ---------------------------------------------------------------- expected
  // pages: [path, expected routes per map (null = don't care), expect selector?]
  const EXPECT = [
    { path: '/', maps: 5, routes: [1, 1, 2, 2, 0] },
    { path: '/marine/', maps: 1, routes: [1] },
    { path: '/bundle-test/', maps: 2, routes: [1, 1] },
    { path: '/global-shadow/', maps: 1, routes: [2] },
  ];

  section('Rendering (all demo pages, lazy loading triggered)');
  for (const exp of EXPECT) {
    const { page, errors, notFound } = await loadPage(ctx, base + exp.path, { origin: base });
    await initAllMaps(page);
    const state = await mapState(page);
    const detail = JSON.stringify(state);
    check(`${exp.path}: no console errors`, errors.length === 0, errors.join('\n       '));
    check(`${exp.path}: no failed requests`, notFound.length === 0, notFound.join('\n       '));
    check(`${exp.path}: ${exp.maps} maps initialised`, state.length === exp.maps && state.every(m => m.init), detail);
    check(`${exp.path}: loaders hidden`, state.every(m => m.loaderHidden), detail);
    check(`${exp.path}: route counts ${exp.routes.join('/')}`, JSON.stringify(state.map(m => m.routes)) === JSON.stringify(exp.routes), detail);
    check(`${exp.path}: route selection rendered`, state.filter(m => m.selectorVisible).length === exp.routes.filter(r => r > 0).length, detail);
    check(`${exp.path}: elevation charts drawn`, state.every(m => m.elevation >= 1), detail);
    check(`${exp.path}: no negative chart dimensions`, state.every(m => (m.chartWidth ?? 1) > 0 && (m.chartHeight ?? 1) > 0), detail);
    await page.close();
  }

  section('Lazy loading stays lazy');
  {
    const { page, errors } = await loadPage(ctx, base + '/');
    await wait(2000);
    const before = await mapState(page);
    check('maps below the fold are not initialised yet', before.some(m => !m.init), JSON.stringify(before.map(m => m.init)));
    await page.locator('.gpx-map').last().scrollIntoViewIfNeeded();
    await wait(2500);
    const after = await mapState(page);
    check('map initialises once scrolled into view', after[after.length - 1].init, JSON.stringify(after.map(m => m.init)));
    check('already visible maps stay initialised', after.slice(0, 2).every(m => m.init), JSON.stringify(after.map(m => m.init)));
    check('no console errors while scrolling', errors.filter(e => !e.includes('404')).length === 0, errors.join('\n       '));
    await page.close();
  }

  section('GPX path resolution');
  {
    const paths = [...resolvedHtml.matchAll(/gpxFiles\.push\("([^"]*)"\)/g)]
      .map(m => m[1].replace(/\\\//g, '/'));
    check('resolved in document order', JSON.stringify(paths) === JSON.stringify([
      '/test.gpx',                    // plain relative -> baseURL
      '/test.gpx',                    // root relative -> verbatim
      '../test.gpx',                  // parent relative -> verbatim
      'https://example.com/track.gpx',// absolute URL -> verbatim
    ]), JSON.stringify(paths));
    check('page bundle resource still wins',
      (await readFile(join(SITE, 'public/bundle-test/index.html'), 'utf8')).includes('bundle-test\\/track.gpx'));
    check('global asset still resolves',
      (await readFile(join(SITE, 'public/bundle-test/index.html'), 'utf8')).includes('\\/gpx\\/global.gpx'));
  }

  section('Leaflet arrives late (retry path)');
  {
    const { page, errors } = await loadPage(ctx, base + '/bundle-test/', {
      route: p => p.route('**/lib/leaflet/leaflet.min.*.js', async r => { await wait(1200); await r.continue(); }),
    });
    await initAllMaps(page);
    const state = await mapState(page);
    check('maps initialise after a delayed Leaflet', state.every(m => m.init), JSON.stringify(state.map(m => m.init)));
    check('no console errors', errors.length === 0, errors.join('\n       '));
    await page.close();
  }

  section('Leaflet never arrives (bounded retry, no crash)');
  {
    const { page, errors } = await loadPage(ctx, base + '/bundle-test/', {
      route: p => p.route('**/lib/leaflet/leaflet.min.*.js', r => r.abort()),
    });
    await page.locator('.gpx-map').first().scrollIntoViewIfNeeded();
    await wait(7000);
    const state = await mapState(page);
    check('maps stay uninitialised', state.every(m => !m.init), JSON.stringify(state.map(m => m.init)));
    check('one clear message per map', errors.filter(e => e.includes('Leaflet (window.L) is not available')).length === state.length, errors.join('\n       '));
    check('no uncaught exceptions', errors.filter(e => e.startsWith('pageerror')).length === 0, errors.join('\n       '));
    await page.close();
  }

  section('Fullscreen and elevation chart');
  {
    const { page, errors } = await loadPage(ctx, base + '/');
    const box = page.locator('.gpx-map-container').first();
    await box.locator('.gpx-map').scrollIntoViewIfNeeded();
    await wait(2000);
    await box.locator('.leaflet-control-custom').click();
    await wait(1500);
    const fs = await box.evaluate(s => s.classList.contains('gpx-fullscreen-mode'));
    check('fullscreen opens', fs);
    const inFs = (await mapState(page))[0];
    check('chart keeps a positive size in fullscreen', inFs.chartWidth > 0 && inFs.chartHeight > 0, JSON.stringify(inFs));
    await page.keyboard.press('Escape');
    await wait(1000);
    check('Escape closes fullscreen', !(await box.evaluate(s => s.classList.contains('gpx-fullscreen-mode'))));
    check('no SVG dimension errors', errors.filter(e => /negative value/.test(e)).length === 0, errors.join('\n       '));
    await page.close();
  }

  section('Sub-path baseURL');
  {
    const { page, errors, notFound } = await loadPage(ctx, base + '/sub/marine/', { origin: base });
    await initAllMaps(page);
    const state = await mapState(page);
    check('map initialises', state.length === 1 && state[0].init, JSON.stringify(state));
    check('route loaded', state[0].routes === 1, JSON.stringify(state));
    check('no failed requests', notFound.length === 0, notFound.join('\n       '));
    check('no console errors', errors.length === 0, errors.join('\n       '));
    await page.close();
  }
} finally {
  await ctx.close();
  await browser.close();
  server.close();
  if (!KEEP) await rm(TMP, { recursive: true, force: true });
  else console.log(`\nfixture kept at ${SITE}`);
}

console.log(failed === 0 ? '\nbrowser smoke: PASS' : `\nbrowser smoke: ${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
