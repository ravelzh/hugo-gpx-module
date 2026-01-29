# Changelog

All notable changes to the Hugo GPX Module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
