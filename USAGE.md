# Usage & Configuration

This module provides the `gpx-map` shortcode for Hugo. It allows you to embed interactive GPX maps into your posts and pages with ease.

## 🟢 Basic Usage

### Single Route
To display a single GPX file, simply provide the path. The file should generally be located in your site's `static/` folder or within a Page Bundle.

```go
{{< gpx-map file="/gpx/hike-alps.gpx" >}}
````

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

## ⚙️ Configuration Parameters

You can customize almost every aspect of the map using the following parameters:

### Map Dimensions

| Parameter | Default | Description |
| :--- | :--- | :--- |
| **width** | `100%` | Width of the map container (e.g., `100%`, `800px`). |
| **height** | `600px` | Height of the map container. |

### Features & Markers

| Parameter | Default | Description |
| :--- | :--- | :--- |
| **show-stats** | `true` | Shows the dashboard (Distance, Elevation, Time) below the map. |
| **markers** | `true` | Toggles Start (Circle) and End (Square) markers on/off. |
| **marker-start-color** | `#2ecc71` | Hex color code for the **Start** marker (Default: Emerald Green). |
| **marker-end-color** | `#e74c3c` | Hex color code for the **End** marker (Default: Red). |

### Responsive Layout

| Parameter | Default | Description |
| :--- | :--- | :--- |
| **route-min-width** | `300px` | Minimum width for columns in the route selection list. |
| **stat-min-width** | `110px` | Minimum width for statistic boxes in the dashboard. |

### Elevation Profile

| Parameter | Default | Description |
| :--- | :--- | :--- |
| **elevation** | `true` | Controls whether the elevation profile is visible on load (`true` or `false`). |
| **elevation-height** | `200px` | Height of the chart container (e.g., `200px`, `15rem`). |
| **elevation-color** | `#2980b9` | Hex color code for the chart line and area fill. |

-----

## 💡 Advanced Examples

### 1. Minimalist Map

If you want a clean map without the data dashboard below it:

```go
{{< gpx-map file="tour.gpx" show-stats="false" height="400px" >}}
```

### 2. Dark Mode & Custom Colors

Perfect for dark website themes. This example enables dark mode and changes the markers to Blue (start) and Orange (end).

```go
{{< gpx-map 
    file="night-ride.gpx" 
    theme="dark" 
    marker-start-color="#3498db" 
    marker-end-color="#e67e22"
>}}
```

### 3. Compact View (No Markers)

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