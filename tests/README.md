# Tests

Two independent layers. Both build on the local sources — nothing is downloaded
from GitHub, so a change is validated before it is pushed.

## 1. Static checks (no dependencies)

```bash
node tests/static-checks.mjs
```

* JavaScript syntax of `gpx-map.js` (`node --check`).
* **Leaflet shadowing guard:** fails if a bare `L.foo` reference appears outside a
  scope that binds `L` via `getLeaflet()`. This is the regression that broke every
  map on pages defining a global `const L`.
* `CHANGELOG.md` structure: unique versions, newest first.

Runs in under a second and works in any environment with Node.js — suitable as a
pre-commit or CI gate.

## 2. Browser smoke test (Playwright)

```bash
node tests/browser-smoke.mjs
```

Builds a throw-away Hugo site from `exampleSite/` into `tests/.tmp/site`, serves it
with a built-in static server and drives Chromium through it:

| Area | Checks |
|---|---|
| Rendering | all demo pages, every map initialised, loader hidden, route counts, elevation chart, no console errors, no failed requests |
| Lazy loading | maps below the fold stay uninitialised until scrolled into view |
| Path resolution | plain relative, root relative, `../`, absolute URL, page bundle, global asset |
| Leaflet shadowing | page with `const L = {}` before the module script still renders |
| Late Leaflet | `leaflet.js` delayed by 1.2 s still initialises (retry path) |
| Missing Leaflet | aborting `leaflet.js` logs one clear error per map, no uncaught exception |
| Fullscreen | chart keeps positive dimensions, Escape closes, no SVG dimension errors |
| Sub-path `baseURL` | site built under `/sub/` loads its GPX files |

Requirements: `hugo` on `PATH` (override with `HUGO_BIN`), Node.js ≥ 18 and
Playwright with a Chromium build:

```bash
npm i playwright
npx playwright install chromium
```

If Playwright lives somewhere else (e.g. an npx cache), point the test at it:

```bash
PLAYWRIGHT_MODULE=/path/to/node_modules CHROME_PATH=/usr/bin/chromium node tests/browser-smoke.mjs
```

Useful flags: `--keep` leaves the generated site in `tests/.tmp/site` for manual
inspection. Exit code is `1` on failure, `2` when Playwright is missing.

## Interpreting failures

* `no failed requests` lists exact URLs — a `404 …/track.gpx` usually means the GPX
  path resolved against the page URL instead of the site root.
* `chart keeps a positive size` / `no SVG dimension errors` point at the elevation
  chart being drawn while its container has no layout size.
* `one clear message per map` guards the bounded Leaflet retry; a missing message
  means the retry silently gave up.
