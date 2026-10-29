# Changelog

All notable changes to the Hugo GPX Module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.8] - 2026-10-29

### Changed
- **Shortcode internals:** the per-page marker that keeps vendor assets to a single inclusion now uses `Page.Store` instead of `Page.Scratch`.

### Added
- **Tests:** guard that a page with several maps links every vendor script and stylesheet exactly once.

### Fixed
- **Security:** route names from GPX files are now escaped before being inserted into the route selector HTML.

## [1.5.7] - 2026-10-29

### Changed
- **Script loading:** the vendor and module scripts now use `defer`, so they no longer block HTML parsing. Execution order stays leaflet → d3 → module.

### Added
- **Tests:** guards for `defer` and script order, a late-loading module script, and a check that hostile shortcode parameters cannot break out of the inline config script.

## [1.5.6] - 2026-10-29

### Fixed
- **Elevation chart units:** the chart ignored nautical mode and always showed km, because `isNautical` was never set. Axis and tooltip now follow the km/nm toggle.
- **Harbor popups:** names, websites and phone numbers from the Overpass API are escaped, and website links are limited to http/https.
- **Translations:** layer names "Häfen"/"Meeresprofil", the fullscreen title, the duration label and the unit-toggle aria-label are no longer hardcoded (`gpx_layer_harbors`, `gpx_layer_sea_profile`, `gpx_fullscreen`, `gpx_duration`, `gpx_unit_toggle`).
- **exampleSite:** `languageCode` replaced by `locale` (deprecated since Hugo 0.158), taxonomies disabled to silence the missing-layout warning.

### Changed
- **Docs:** added a versioning section. Without a version suffix `hugo mod get` resolves to the newest stable tag, pre-releases are ignored, updates need `hugo mod get -u`.

### Added
- **Tests:** i18n key parity, a guard against hardcoded UI strings, and coverage for the km/nm toggle.

## [1.5.5] - 2026-10-29

### Changed
- **CSS pipeline:** the stylesheet is plain CSS and is now shipped as `assets/hugo-gpx-module/css/style.css` and minified, instead of being compiled with libsass. Removes the `css.Sass` deprecation warning with Hugo ≥ 0.153 and no longer needs a Sass transpiler. Rendered styles are unchanged.

### Added
- **Tests:** static checks and the browser smoke test now guard the stylesheet delivery as well.

## [1.5.4] - 2026-10-29

### Fixed
- **Leaflet global shadowing:** Leaflet is read from `window.L` via `getLeaflet()` instead of the bare identifier `L`, so a page-level `const L = ...` no longer breaks every map with `L.map is not a function`. Based on the fix in [karstenmueller/hugo-gpx-module](https://github.com/karstenmueller/hugo-gpx-module).
- **Missing Leaflet:** init retries for about 5 seconds, then logs `GPX Init Error: Leaflet (window.L) is not available` instead of retrying forever.
- **Relative GPX paths:** `file="track.gpx"` is resolved against the site `baseURL` instead of the page URL, so nested pages no longer fail with a 404. Paths starting with `/`, `./`, `../` and absolute URLs are unchanged.
- **Elevation chart:** no longer drawn while its container has no layout size (fullscreen, hidden tabs), which produced negative SVG dimensions and console errors.

### Changed
- **exampleSite:** `marine.md` map loads again (path fix above); added a `favicon.ico`.

### Added
- **Tests:** `tests/` with dependency-free static checks and a Playwright smoke test.

## [1.5.3] - 2026-03-26

### Added
- **Resource Resolution:** GPX files can now be loaded directly from Hugo Page Bundles (`.Page.Resources.GetMatch`) or Global Assets (`resources.Get`). This resolves pathing issues in multilingual setups having subdirectories.

### Changed
- **Documentation:** Restructured `USAGE.md` to explicitly clarify the new file resolution priority (Page Bundle > Global Asset > Static/URL fallback).

## [1.5.2] - 2026-03-25

Integrated from the community fork **[navgatt/hugo-gpx-module](https://github.com/navgatt/hugo-gpx-module)** (fork of [ravelzh/hugo-gpx-module](https://github.com/ravelzh/hugo-gpx-module)): optional route-selector toggle and PhotoSwipe-friendly stacking (`z-index` rule for `.pswp` removed).

### Added
- **Shortcode / config:** `show-route-selector` (site param `showRouteSelector`) to hide the route selection panel (track list and its toolbar) while keeping map and elevation chart configurable.

### Fixed
- **CSS:** Removed `.pswp` (PhotoSwipe root) from the high `z-index` overlay list so PhotoSwipe can manage its own stacking; avoids broken lightbox UI when galleries and maps appear on the same page.

## [1.5.0] - 2026-02-02

### Added
- **Marine Mode:** Enhanced Nautic Mode to include **OpenSeaMap Seamarks**, **Harbors** (with website/phone info), and **Sea Depth Profiles** (GEBCO).
- **Fullscreen:** Added a dedicated Fullscreen control that isolates the map container (Z-Index fix) to prevent UI overlapping.
- **i18n:** Fully internationalized UI (English/German). All strings (`gpx_distance`, `gpx_download`, etc.) are now translatable via TOML files.

### Changed
- **Unit Toggle:** Enabling `show-unit-toggle` now automatically defaults the map to **Nautical Miles (nm)**.
- **Documentation:** Updated `README.md` and `USAGE.md` to reflect new Marine features and i18n capabilities.

### Fixed
- **Configuration:** The `elevation-info="false"` parameter now correctly hides elevation statistics in the summary, popups, and route list (handled string/boolean type mismatch).
- **Stability:** Hardened `gpx-map.html` against corruption by adding explicit config markers.

## [1.3.4] - 2026-01-29

### Fixed
- **Layout:** Added `min-width: 0` to grid items in the route selection list to allow proper truncation of long names on mobile devices.

## [1.3.3] - 2026-01-29

### Fixed
- **Mobile Layout:** Refactored route selection list to use a responsive Flexbox/Grid layout, fixing overflow and button visibility issues on small screens.

## [1.3.2] - 2026-01-29

### Fixed
- **Assets:** Fixed missing Leaflet icons (layers, markers, shadows) by vendoring them into `static/`.

## [1.3.1] - 2026-01-29

### Fixed
- **Build Error:** Renamed `vendor` directory to `lib` to prevent Go/Hugo from excluding assets.
- **Syntax:** Fixed template syntax error in `gpx-map.html`.

## [1.3.0] - 2026-01-28

### Added
- **Module Initialization:** Full Hugo Module setup with `go.mod` and `module.toml`.
- **Privacy:** Removed external CDNs; all assets (Leaflet, D3) are now vendored.
- **Optimization:** Implemented Hugo Pipes for asset processing (SCSS compilation, Minification, Fingerprinting).
- **Refactoring:** Separated inline CSS/JS into `assets/scss/style.scss` and `assets/js/gpx-map.js`.

## [1.1.0] - 2025-12-05

### Added
- **New Feature:** Added an interactive **Elevation Profile** using D3.js with mouse-hover synchronization (chart ↔ map).
- **UI Update:** Added a "Profile" toggle button to show/hide the chart.

### Improvements
- **Fix (Dark Mode):** Enforced strict **Light Mode** (CSS hardening) to prevent dark mode plugins from rendering invisible white text on white backgrounds (specifically for SVGs and tooltips).
- **Refactoring:** Centralized distance calculation (Haversine formula) to remove code duplication.
- **Cleanup:** Removed complex theme logic (light/dark) in favor of a consistent, single style and translated all code comments to English.

## [1.0.0] - 2025-12-05

### Added
- Initial release of Hugo GPX Module
- Interactive GPX track display with Leaflet.js
- Responsive design for desktop and mobile
- Support for GPX tracks (`<trk>`) and routes (`<rte>`)
- Automatic distance and elevation calculation
- Light and dark theme support
- Simple configuration via shortcode parameters
- Multiple map layer support (OpenStreetMap, Topographic, Satellite)
- Start/end markers for routes
- Popup information with route statistics
- Performance optimization for large GPX files

### Features
- **Shortcode Parameters**:
  - `file` (required): Path to GPX file
  - `width`: Map width (default: "100%")
  - `height`: Map height (default: "500px")
  - `show-stats`: Show/hide statistics (default: true)
  - `theme`: Light or dark theme (default: "light")

- **Core Functionality**:
  - Multi-segment track support
  - Automatic map bounds adjustment
  - Zoom and pan controls
  - Statistics display (distance, elevation, duration)
  - Mobile-responsive layout
  - Cross-browser compatibility

### Documentation
- Comprehensive README with quick start guide
- Detailed usage examples
- Configuration reference
- Troubleshooting guide
- Contributing guidelines
- GPL v3 License

### Technical Details
- Uses Leaflet.js 1.9.4 for map rendering
- Optimized for Hugo 0.120+
- No external dependencies beyond Leaflet
- Canvas rendering for performance
- Responsive CSS Grid layout

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Graceful degradation for older browsers

--

## Support

For questions or issues:
- **Author**: Martin Vögeli
- **Demo**: [go-offroad.ch](https://go-offroad.ch)
- **Repository**: [GitHub Issues](https://github.com/ravelzh/hugo-gpx-module/issues)

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.
