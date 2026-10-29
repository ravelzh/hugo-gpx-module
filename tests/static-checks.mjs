#!/usr/bin/env node
// Dependency-free static checks for the module sources.
// Run: node tests/static-checks.mjs

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const JS = join(ROOT, 'assets/hugo-gpx-module/js/gpx-map.js');
const CHANGELOG = join(ROOT, 'CHANGELOG.md');

let failed = 0;
const pass = (name, detail = '') => console.log(`  ok   ${name}${detail ? ' — ' + detail : ''}`);
const fail = (name, detail) => { failed++; console.log(`  FAIL ${name}\n       ${detail}`); };

// ---------------------------------------------------------------- syntax
{
  const file = JS;
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    pass('JavaScript syntax', 'node --check');
  } catch (err) {
    fail('JavaScript syntax', String(err.stderr || err.message).split('\n').slice(0, 4).join('\n       '));
  }
}

// ------------------------------------------------- Leaflet global shadowing
// A bare `L.foo` reference resolves through the scope chain. If a page defines a
// global `const L`, that shadows window.L and every map breaks. The module must
// therefore only use `L` inside a scope that binds it explicitly via getLeaflet().
{
  const lines = readFileSync(JS, 'utf8').split('\n');
  const decl = /const L = getLeaflet\(\)/;
  const isMethodStart = l => /^ {4}(async )?[A-Za-z_$][\w$]*\(/.test(l);
  const isScopeEnd = l => /^ {4}\}$/.test(l);

  let depthOk = true;
  let scope = null;
  const problems = [];
  const scopesSeen = [];

  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, ''); // strip line comments
    if (isMethodStart(line)) {
      if (scope) scopesSeen.push(scope);
      scope = { name: line.trim().split('(')[0], declaresL: decl.test(line), first: i + 1 };
    } else if (decl.test(code) && scope) {
      scope.declaresL = true;
    }
    // bare L.xxx, but not global.L, foo.L, URL.createObjectURL
    const m = code.match(/(^|[^\w$.])L\.[A-Za-z_$]/g);
    if (m) {
      if (!scope || !scope.declaresL) problems.push(`line ${i + 1} (${scope ? scope.name : 'module scope'}): ${line.trim().slice(0, 70)}`);
    }
    if (isScopeEnd(line)) {
      if (scope) scopesSeen.push(scope);
      scope = null;
    }
  });
  if (scope) scopesSeen.push(scope);
  depthOk = scopesSeen.length > 0;

  if (!depthOk) fail('Leaflet scope analysis', 'no class methods detected — parser assumptions outdated');
  else if (problems.length) fail('no bare `L` outside a getLeaflet() scope', problems.join('\n       '));
  else pass('no bare `L` outside a getLeaflet() scope', `${scopesSeen.filter(s => s.declaresL).length} scopes bind L`);

  const usesHelper = (readFileSync(JS, 'utf8').match(/const L = getLeaflet\(\)/g) || []).length;
  if (usesHelper < 5) fail('getLeaflet() used across methods', `only ${usesHelper} call sites`);
  else pass('getLeaflet() used across methods', `${usesHelper} call sites`);

  if (!/function getLeaflet\(\)/.test(readFileSync(JS, 'utf8'))) fail('getLeaflet() helper present', 'missing');
}

// ------------------------------------------------------------- changelog
{
  const text = readFileSync(CHANGELOG, 'utf8');
  const versions = [...text.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map(m => m[1]);
  const dupes = versions.filter((v, i) => versions.indexOf(v) !== i);
  if (dupes.length) fail('CHANGELOG versions unique', `duplicated: ${[...new Set(dupes)].join(', ')}`);
  else pass('CHANGELOG versions unique', `${versions.length} releases`);

  const sorted = versions.every((v, i) => i === 0 || cmp(versions[i - 1], v) >= 0);
  if (!sorted) fail('CHANGELOG ordered newest first', versions.join(' > '));
  else pass('CHANGELOG ordered newest first', versions.slice(0, 3).join(' > '));
}

function cmp(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

console.log(failed === 0 ? '\nstatic checks: PASS' : `\nstatic checks: ${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
