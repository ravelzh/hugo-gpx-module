# Changelog

All notable changes to the Hugo GPX Module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
