# Usage & Configuration

This module provides the `gpx-map` shortcode for Hugo. It allows you to embed interactive GPX maps into your posts and pages with ease. You can configure settings globally in your site configuration or individually per shortcode.

## 🟢 Basic Usage

### Single Route

To display a single GPX file, simply provide the path. The file should generally be located in your site's `static/` folder or within a Page Bundle.

```go
{{< gpx-map file="/gpx/hike-alps.gpx" >}}
```

### Multiple Routes

You can load up to 100 files simultaneously. The list is automatically sorted based on the parameter order (`file` -> `file2` -> `file3`...), ensuring the list order stays consistent regardless of download speed.

```go
{{< gpx-map 
    file="/gpx/day1.gpx" 
    file2="/gpx/day2.gpx" 
    file3="/gpx/day3.gpx" 
>}}
```

## ⚓ Marine Navigation

The module supports **Nautical Miles (nm)** and **OpenSeaMap**.

### How it works
1.  **Toggle Switch**: Use `show-unit-toggle="true"` to display a button for switching between **km** and **nm**.
2.  **OpenSeaMap**: Use `show-seamarks="true"` to add the "Seamarks" layer to the map controls.

### Configuration
Ensure your `gpx` config in `hugo.toml` includes the tile providers.

-----

## 🌍 Global Configuration

You can define default settings for **all** maps across your site in your main configuration file (`hugo.toml`). These values will be used unless overridden by a specific shortcode parameter.

### TOML Example (`hugo.toml`)

```toml
[params.gpx]
  # --- Map Provider (Tile Layers) ---
  # Default active layer. Options: "osm", "topo", "satellite", "sea"
  defaultLayer = "topo"

  # Override URLs (optional, e.g. for API keys)
  osmUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  osmAttr = "© OpenStreetMap"
  topoUrl = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
  topoAttr = "© OpenTopoMap"
  satUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  satAttr = "© Esri"
  
  # --- Marine ---
  seaUrl = "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
  seaAttr = "Map data: © OpenSeaMap contributors"

  # --- Default View ---
  # Initial center if no GPX is loaded
  startLat = 48.2082
  startLon = 16.3738
  startZoom = 8

  # --- Design & Dimensions ---
  width = "100%"
  height = "600px"
  
  # Responsive Breakpoints
  routeMinWidth = "380px"  # Min width for route list columns
  statMinWidth = "110px"   # Min width for stat boxes

  # Track Line Style
  lineWeight = 4
  lineOpacity = 0.8
  
  # Color Palette (Cycles through these for multiple tracks)
  trackColors = [
    "#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", 
    "#1abc9c", "#e67e22", "#34495e", "#f1c40f", "#e91e63"
  ]

  # --- Markers & Elevation ---
  markerStartColor = "#2ecc71"
  markerEndColor = "#e74c3c"
  elevationHeight = "150px"
  elevationColor = "#2980b9"

  # --- Default Toggles ---
  showStats = true
  elevation = true
  markers = true
  showUnitToggle = false  # Show km/nm toggle button (starts in nm mode)
  showSeamarks = false    # Show Seamarks overlay option in layer control
```

-----

## ⚙️ Shortcode Parameters

Any parameter set in the shortcode will override the global configuration.

| Parameter | Default (if not set in Config) | Description |
| :--- | :--- | :--- |
| **file** | *Required* | Path to the first GPX file. |
| **width** | `100%` | Width of the map container. |
| **height** | `600px` | Height of the map container. |
| **route-min-width** | `370px` | Minimum width for columns in the route selection list before wrapping. |
| **stat-min-width** | `110px` | Minimum width for statistic boxes in the dashboard before wrapping. |
| **show-stats** | `true` | Shows the dashboard (Distance, Elevation, Time). |
| **elevation** | `true` | Show/Hide elevation profile on load. |
| **elevation-height** | `150px` | Height of the elevation chart container. |
| **elevation-color** | `#2980b9` | Hex color code for the elevation chart fill. |
| **markers** | `true` | Show/Hide start/end markers. |
| **show-unit-toggle** | `false` | Shows the km/nm toggle button (defaults to nm). |
| **show-seamarks** | `false` | Shows the Seamarks layer option in layer control. |
| **marker-start-color** | `#2ecc71` | Hex color code for the **Start** marker. |
| **marker-end-color** | `#e74c3c` | Hex color code for the **End** marker. |

### Minimalist Example (No Dashboard)
```go
{{< gpx-map file="tour.gpx" show-stats="false" height="400px" >}}
```
