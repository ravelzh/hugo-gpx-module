# Usage & Configuration

This module provides the `gpx-map` shortcode for Hugo. It allows you to embed interactive GPX maps into your posts and pages with ease. You can configure settings globally in your site configuration or individually per shortcode.

## 🟢 Basic Usage

### Single Route

To display a single GPX file, simply provide the path. The file should generally be located in your site's `static/` folder or within a Page Bundle.

```go
{{< gpx-map file="/gpx/hike-alps.gpx" >}}
```

### Multiple Routes

You can load up to 20 files simultaneously. The list is automatically sorted based on the parameter order (`file` -\> `file2` -\> `file3`...), ensuring the list order stays consistent regardless of download speed.

```go
{{< gpx-map 
    file="/gpx/day1.gpx" 
    file2="/gpx/day2.gpx" 
    file3="/gpx/day3.gpx" 
>}}
```

-----

## 🌍 Global Configuration

You can define default settings for **all** maps across your site in your main configuration file `hugo.toml`. These values will be used unless overridden by a specific shortcode parameter.

### TOML Example (`hugo.toml`)

```toml
[params.gpx]
  # --- Map Provider (Tile Layers) ---
  # Default active layer. Options: "osm", "topo", "satellite"
  defaultLayer = "topo"

  # Override URLs (optional, e.g. for API keys)
  osmUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  osmAttr = "© OpenStreetMap"
  topoUrl = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
  topoAttr = "© OpenTopoMap"
  satUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  satAttr = "© Esri"

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
```
-----

## ⚙️ Shortcode Parameters

Any parameter set in the shortcode will override the global configuration.

### Map Dimensions

| Parameter | Default (if not set in Config) | Description |
| :--- | :--- | :--- |
| **width** | `100%` | Width of the map container. |
| **height** | `600px` | Height of the map container. |

### Features & Markers

| Parameter | Default | Description |
| :--- | :--- | :--- |
| **show-stats** | `true` | Shows the dashboard (Distance, Elevation, Time) below the map. |
| **markers** | `true` | Toggles Start (Circle) and End (Square) markers on/off. |
| **marker-start-color** | `#2ecc71` | Hex color code for the **Start** marker. |
| **marker-end-color** | `#e74c3c` | Hex color code for the **End** marker. |

### Responsive Layout

| Parameter | Default | Description |
| :--- | :--- | :--- |
| **route-min-width** | `380px` | Minimum width for columns in the route selection list before wrapping. |
| **stat-min-width** | `110px` | Minimum width for statistic boxes in the dashboard before wrapping. |

### Elevation Profile

| Parameter | Default | Description |
| :--- | :--- | :--- |
| **elevation** | `true` | Controls whether the elevation profile is visible on load. |
| **elevation-height** | `150px` | Height of the chart container. |
| **elevation-color** | `#2980b9` | Hex color code for the chart line and area fill. |

-----

## 💡 Advanced Examples

### 1\. Minimalist Map

If you want a clean map without the data dashboard below it:

```go
{{< gpx-map file="tour.gpx" show-stats="false" height="400px" >}}
```

### 2\. Custom Colors

This example changes the markers to Blue (start) and Orange (end).

```go
{{< gpx-map 
    file="night-ride.gpx" 
    marker-start-color="#3498db" 
    marker-end-color="#e67e22"
>}}
```

### 3\. Compact View (No Markers)

Useful for smaller areas (e.g., inside a sidebar) where markers might add too much clutter.

```go
{{< gpx-map 
    file="short-trail.gpx" 
    width="100%" 
    height="300px" 
    show-stats="false" 
    markers="false"
>}}
```