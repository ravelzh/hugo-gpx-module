# Hugo GPX Map Module

A modern, high-performance, and privacy-friendly Hugo module for displaying GPX tracks on interactive maps. Built with [Leaflet.js](https://leafletjs.com/), it requires no heavy dependencies (like jQuery) and is optimized for speed and user experience.

![Map Preview](https://go-offroad.ch/posts/marokko_2023_01-05_01-12/#tracks)

## 🌟 Features

* **🚀 High Performance:** Uses **Lazy Loading** (IntersectionObserver) to load the map only when visible, and **Canvas Rendering** for handling large GPX files smoothly.
* **📊 Smart Statistics:** Automatically calculates distance, duration, and elevation gain/loss. Includes **elevation smoothing** to filter out GPS noise (< 5m).
* **🗺️ Multi-Track Support:** Display up to 20 GPX files on a single map with an interactive toggle list.
* **🎨 Fully Customizable:** Custom marker colors, and responsive sizing via parameters.
* **✨ Excellent UX:** Smooth zoom animations (`flyToBounds`), route highlighting on hover, and direct GPX download buttons.
* **🔒 Privacy Friendly:** Uses OpenStreetMap and OpenTopoMap tiles. No data is sent to Google.

## 📦 Installation

This project is packaged as a Hugo Module.

### 1. Initialize your project (if not already done)
If your Hugo project is not yet a Go module, initialize it:
```bash
hugo mod init github.com/your-username/your-project-name
````

### 2. Add the Module

Add the following to your site configuration file:

**`hugo.toml`**

```toml
[module]
  [[module.imports]]
    path = "github.com/ravelzh/hugo-gpx-module"
```

**OR `config.yaml`**

```yaml
module:
  imports:
    - path: github.com/ravelzh/hugo-gpx-module
```

### 3. Download dependencies

Run the following command in your terminal to download the module:

```bash
hugo mod get github.com/ravelzh/hugo-gpx-module
hugo mod tidy
```

## 🚀 Quick Start

To display a map, simply use the `gpx-map` shortcode in your Markdown content. The GPX file should be located in your `static/` folder or within a Page Bundle.

**Single Track:**

```go
{{< gpx-map file="hike.gpx" >}}
```

**Multiple Tracks:**

```go
{{< gpx-map 
    file="day1.gpx" 
    file2="day2.gpx" 
    file3="day3.gpx" 
>}}
```

## 📖 Configuration & Usage

This module offers extensive configuration options, including:

  * Toggling markers (Start/End)
  * Customizing colors
  * Dark mode
  * Disabling statistics

👉 **[Read the full USAGE documentation here](USAGE.md)** for a complete list of parameters and advanced examples.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/ravelzh/hugo-gpx-module/issues).

## 📄 License

GNU General Public License v3 (GPL v3) - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Martin Vögeli**

- **Demo**: [go-offroad.ch](https://go-offroad.ch)
- **GitHub**: [@ravelzh](https://github.com/ravelzh)
