(function (global) {
  'use strict';

  class GPXMapHandler {
    constructor(mapId, statsId, gpxFiles, config) {
      this.mapId = mapId;
      this.statsId = statsId;
      this.gpxFiles = gpxFiles;
      this.config = config;

      this.map = null;
      this.routeLayers = new Map();
      this.markerLayers = new Map();
      this.routeData = new Map();
      this.routeStats = new Map();
      this.colorIndex = 0;

      this.colors = (config.colors && Array.isArray(config.colors) && config.colors.length > 0)
        ? config.colors
        : ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];

      this.focusMarker = null;
      this.isElevationVisible = this.config.ele.active;
    }

    async init() {
      if (typeof L === 'undefined') { setTimeout(() => this.init(), 50); return; }
      try { await this.initMap(); await this.loadGPXFiles(); }
      catch (err) { console.error("GPX Init Error:", err); }
    }

    async initMap() {
      return new Promise((resolve, reject) => {
        const el = document.getElementById(this.mapId);
        if (!el) return reject('Map element missing');

        this.map = L.map(this.mapId, {
          zoomControl: false, attributionControl: true, preferCanvas: true,
          zoomAnimation: true, markerZoomAnimation: true, fadeAnimation: true, inertia: true
        });

        // Dynamic Tile Layers from Config
        const osm = L.tileLayer(this.config.tiles.osm.url, { maxZoom: 19, attribution: this.config.tiles.osm.attr });
        const topo = L.tileLayer(this.config.tiles.topo.url, { maxZoom: 17, attribution: this.config.tiles.topo.attr });
        const satellite = L.tileLayer(this.config.tiles.sat.url, { attribution: this.config.tiles.sat.attr });

        const baseMaps = { "Standard": osm, "Topographic": topo, "Satellite": satellite };

        if (this.config.defaultLayer === 'satellite') satellite.addTo(this.map);
        else if (this.config.defaultLayer === 'topo') topo.addTo(this.map);
        else osm.addTo(this.map);

        L.control.layers(baseMaps, null, { position: 'topright' }).addTo(this.map);

        // Default View
        this.map.setView([this.config.view.lat, this.config.view.lon], this.config.view.zoom);
        this.setupResizeHandling();
        resolve();
      });
    }

    _getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371e3; const φ1 = lat1 * Math.PI / 180; const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180; const Δλ = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    async loadGPXFiles() {
      // Load sequentially to preserve color order
      for (let i = 0; i < this.gpxFiles.length; i++) {
        try { await this.loadSingleGPX(this.gpxFiles[i], i); }
        catch (e) { console.warn('Load failed: ' + this.gpxFiles[i], e); }
      }

      const loader = document.querySelector(`#${this.mapId} .gpx-loading`);
      if (loader) loader.style.display = 'none';

      this.createRouteSelector();
      this.fitToRoutes();
      if (this.config.showStats) this.calculateAndShowTotalStats();

      this.updateElevationButton();
      if (this.isElevationVisible) this._drawElevationProfile();
    }

    async loadSingleGPX(file, index) {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const gpxText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(gpxText, 'text/xml');

      // Helper to parse points
      const parsePoints = (pts) => Array.from(pts).map(point => {
        const ele = parseFloat(point.querySelector('ele')?.textContent || '0');
        const timeNode = point.querySelector('time');
        return { lat: parseFloat(point.getAttribute('lat')), lon: parseFloat(point.getAttribute('lon')), ele: ele, time: timeNode ? new Date(timeNode.textContent).getTime() : null };
      }).filter(p => !isNaN(p.lat));

      const tracks = Array.from(xmlDoc.querySelectorAll('trk')).map(trk => {
        const name = trk.querySelector('name')?.textContent || `Track ${index + 1}`;
        const segments = Array.from(trk.querySelectorAll('trkseg')).map(seg => parsePoints(seg.querySelectorAll('trkpt'))).filter(s => s.length > 0);
        return { name, segments };
      }).filter(t => t.segments.length > 0);

      const routes = Array.from(xmlDoc.querySelectorAll('rte')).map(rte => {
        const name = rte.querySelector('name')?.textContent || `Route ${index + 1}`;
        return { name, points: parsePoints(rte.querySelectorAll('rtept')) };
      }).filter(r => r.points.length > 0);

      if (!tracks.length && !routes.length) return;

      const geojson = { type: 'FeatureCollection', features: [] };
      const addFeatures = (list, isRoute) => list.forEach(item => {
        const coords = isRoute ? item.points : item.segments.flat();
        const coordinates = isRoute ? coords.map(p => [p.lon, p.lat, p.ele, p.time]) : item.segments.map(s => s.map(p => [p.lon, p.lat, p.ele, p.time]));
        const type = isRoute ? 'LineString' : 'MultiLineString';
        geojson.features.push({ type: 'Feature', properties: { name: item.name }, geometry: { type, coordinates } });
      });
      addFeatures(tracks, false); addFeatures(routes, true);

      const stats = this.calculateRouteStats(geojson);
      this.routeStats.set(index, stats);

      const nextColor = this.colors[this.colorIndex % this.colors.length];
      this.colorIndex++;

      this.routeData.set(index, { geojson, color: nextColor, originalFile: file, name: this.getFileName(file) });

      const layer = L.geoJSON(geojson, {
        style: {
          color: nextColor,
          weight: this.config.style.weight,
          opacity: this.config.style.opacity,
          lineCap: 'round', lineJoin: 'round'
        }, smoothFactor: 1.0
      }).addTo(this.map);
      this.routeLayers.set(index, layer);

      if (this.config.showMarkers) this.addStartEndMarkers(index, geojson);

      const routeName = tracks[0]?.name || routes[0]?.name || this.getFileName(file);
      layer.bindPopup(`
            <div class="gpx-popup-content">
                <span class="gpx-popup-title">${routeName}</span>
                <span class="gpx-popup-stat">📏 Dist: <b>${stats.distance.toFixed(1)} km</b></span>
                <span class="gpx-popup-stat">🏔️ Elev: <span style="color:#28a745">↗ ${stats.elevationGain}m</span> <span style="color:#dc3545">↘ ${stats.elevationLoss}m</span></span>
            </div>
        `);
    }

    addStartEndMarkers(index, geojson) {
      const markers = L.layerGroup();
      geojson.features.forEach(f => {
        const coords = f.geometry.coordinates;
        const flat = (f.geometry.type === 'MultiLineString') ? coords.flat() : coords;
        if (flat.length > 0) {
          const start = flat[0]; const end = flat[flat.length - 1];
          L.marker([start[1], start[0]], { icon: L.divIcon({ className: 'gpx-marker-start', html: '', iconSize: [12, 12] }), interactive: false }).addTo(markers);
          L.marker([end[1], end[0]], { icon: L.divIcon({ className: 'gpx-marker-end', html: '', iconSize: [12, 12] }), interactive: false }).addTo(markers);
        }
      });
      markers.addTo(this.map);
      this.markerLayers.set(index, markers);
    }

    calculateRouteStats(geojson) {
      let d = 0, eg = 0, el = 0, hp = -Infinity, startTime = null, endTime = null;
      const ELEVATION_THRESHOLD = 5;
      geojson.features.forEach(f => {
        const coords = (f.geometry.type === 'MultiLineString') ? f.geometry.coordinates.flat() : f.geometry.coordinates;
        if (!coords.length) return;
        const t1 = coords[0][3]; const t2 = coords[coords.length - 1][3];
        if (t1 && (!startTime || t1 < startTime)) startTime = t1;
        if (t2 && (!endTime || t2 > endTime)) endTime = t2;
        let prevEle = coords[0][2] || 0;
        for (let i = 1; i < coords.length; i++) {
          const [lon1, lat1] = coords[i - 1]; const [lon2, lat2, ele2] = coords[i];
          d += this._getDistance(lat1, lon1, lat2, lon2);
          const currentEle = ele2 || 0; const diff = currentEle - prevEle;
          if (Math.abs(diff) >= ELEVATION_THRESHOLD) {
            if (diff > 0) eg += diff; else el += Math.abs(diff);
            prevEle = currentEle;
          }
          hp = Math.max(hp, currentEle);
        }
      });
      return { distance: d / 1000, elevationGain: Math.round(eg), elevationLoss: Math.round(el), highestPoint: Math.round(hp === -Infinity ? 0 : hp), duration: (startTime && endTime) ? (endTime - startTime) : 0 };
    }

    _prepareElevationData() {
      let dataPoints = []; let totalDist = 0;
      const visibleIds = Array.from(this.routeData.keys()).sort((a, b) => a - b);
      visibleIds.forEach(id => {
        const layer = this.routeLayers.get(id);
        if (!this.map.hasLayer(layer)) return;
        const geojson = this.routeData.get(id).geojson;
        geojson.features.forEach(f => {
          const coords = (f.geometry.type === 'MultiLineString') ? f.geometry.coordinates.flat() : f.geometry.coordinates;
          for (let i = 0; i < coords.length; i++) {
            const [lon, lat, ele] = coords[i];
            if (i > 0) {
              const [prevLon, prevLat] = coords[i - 1];
              totalDist += this._getDistance(prevLat, prevLon, lat, lon);
            }
            dataPoints.push({ dist: totalDist / 1000, ele: ele || 0, lat: lat, lon: lon });
          }
        });
      });
      return dataPoints;
    }

    toggleElevation() {
      this.isElevationVisible = !this.isElevationVisible;
      this.updateElevationButton();
      if (this.isElevationVisible) this._drawElevationProfile();
      else { document.getElementById(`${this.mapId}-elevation`).style.display = 'none'; if (this.focusMarker) this.focusMarker.remove(); }
    }

    updateElevationButton() {
      const btn = document.getElementById(`${this.mapId}-btn-ele`);
      if (btn) {
        btn.style.backgroundColor = this.isElevationVisible ? '#5a6268' : '#6c757d';
        btn.style.boxShadow = this.isElevationVisible ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : 'none';
      }
    }

    _drawElevationProfile() {
      const containerId = `${this.mapId}-elevation`;
      const container = document.getElementById(containerId);
      const tooltip = document.getElementById(`${this.mapId}-ele-tooltip`);
      if (!this.isElevationVisible) { container.style.display = 'none'; return; }
      const data = this._prepareElevationData();
      if (data.length === 0) { container.style.display = 'none'; if (this.focusMarker) this.focusMarker.remove(); return; }
      container.style.display = 'block';
      d3.select("#" + containerId).selectAll("svg").remove();

      const margin = { top: 10, right: 5, bottom: 20, left: 35 };
      const width = container.clientWidth - margin.left - margin.right;
      const height = container.clientHeight - margin.top - margin.bottom;
      const color = this.config.ele.color;
      const svg = d3.select("#" + containerId).append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
      const x = d3.scaleLinear().domain(d3.extent(data, d => d.dist)).range([0, width]);
      const yExtent = d3.extent(data, d => d.ele);
      const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
      const y = d3.scaleLinear().domain([yExtent[0] - yPadding, yExtent[1] + yPadding]).range([height, 0]);

      svg.append("path").datum(data).attr("fill", color).attr("fill-opacity", 0.2).attr("stroke", color).attr("stroke-width", 2).attr("d", d3.area().x(d => x(d.dist)).y0(height).y1(d => y(d.ele)));
      svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5).tickFormat(d => d + " km"));
      svg.append("g").call(d3.axisLeft(y).ticks(5));

      const focusCircle = svg.append("circle").attr("class", "elevation-focus-circle").attr("r", 5).attr("fill", this.config.markerEndColor).style("opacity", 0);
      const focusLine = svg.append("line").attr("class", "elevation-focus-line").style("opacity", 0).attr("y1", 0).attr("y2", height);
      if (!this.focusMarker) this.focusMarker = L.circleMarker([0, 0], { radius: 6, color: this.config.markerEndColor, fillColor: this.config.markerEndColor, fillOpacity: 1 });

      svg.append("rect").attr("width", width).attr("height", height).style("fill", "none").style("pointer-events", "all")
        .on("mouseover", () => { focusCircle.style("opacity", 1); focusLine.style("opacity", 1); tooltip.style.display = "block"; this.focusMarker.addTo(this.map); })
        .on("mouseout", () => { focusCircle.style("opacity", 0); focusLine.style("opacity", 0); tooltip.style.display = "none"; this.focusMarker.remove(); })
        .on("mousemove", (event) => {
          const xDist = x.invert(d3.pointer(event)[0]);
          const bisect = d3.bisector(d => d.dist).left;
          const idx = bisect(data, xDist, 1);
          const d = data[idx] || data[idx - 1];
          if (!d) return;
          focusCircle.attr("cx", x(d.dist)).attr("cy", y(d.ele));
          focusLine.attr("x1", x(d.dist)).attr("x2", x(d.dist));
          let toolLeft = x(d.dist) + 10;
          if (toolLeft + 80 > width) toolLeft = x(d.dist) - 90;
          tooltip.innerHTML = `<strong style="color:#000!important;font-weight:bold;">${d.dist.toFixed(1)} km</strong><br><span style="color:#000!important;">${Math.round(d.ele)} m</span>`;
          tooltip.style.left = toolLeft + "px"; tooltip.style.top = (y(d.ele) - 30) + "px";
          this.focusMarker.setLatLng([d.lat, d.lon]);
        });
    }

    formatTime(ms) {
      if (!ms || ms <= 0) return "--:--";
      const min = Math.floor(ms / 60000);
      return `${Math.floor(min / 60).toString().padStart(2, '0')}:${(min % 60).toString().padStart(2, '0')}h`;
    }

    createRouteSelector() {
      const list = document.getElementById(this.mapId + '-routes');
      const sel = document.getElementById(this.mapId + '-route-selector');
      if (!list) return;
      if (this.routeData.size > 0 && sel) sel.style.display = 'block';
      list.innerHTML = '';
      const sortedIds = Array.from(this.routeData.keys()).sort((a, b) => a - b);

      sortedIds.forEach(id => {
        const d = this.routeData.get(id);
        const s = this.routeStats.get(id);
        const visible = this.map.hasLayer(this.routeLayers.get(id));
        const div = document.createElement('div');
        div.className = 'gpx-item-style gpx-route-item';
        div.style.borderLeft = `5px solid ${visible ? d.color : '#ccc'}`;
        div.onmouseenter = () => this.highlightRoute(id, true);
        div.onmouseleave = () => this.highlightRoute(id, false);
        const timeStr = s.duration ? `<span class="route-stat-pill gpx-text-muted" title="Duration">⏱ ${this.formatTime(s.duration)}</span>` : '';

        div.innerHTML = `
            <input type="checkbox" class="gpx-route-checkbox" ${visible ? 'checked' : ''} onchange="window.gpxMaps['${this.mapId}'].toggleRoute(${id})">
            <div class="gpx-route-content">
                <div class="gpx-route-title" title="${d.name}">${d.name}</div>
                <div class="route-details">
                    <span class="route-stat-pill gpx-text-muted">📏 ${s.distance.toFixed(1)} km</span>
                    <span class="route-stat-pill" style="color:#28a745 !important">↗ ${s.elevationGain}m</span>
                    <span class="route-stat-pill" style="color:#dc3545 !important">↘ ${s.elevationLoss}m</span>
                    ${timeStr}
                </div>
            </div>
            <button class="gpx-download-btn" onclick="window.gpxMaps['${this.mapId}'].downloadGPX(${id})" title="Download GPX">📥</button>
          `;
        list.appendChild(div);
      });
    }

    highlightRoute(id, active) {
      const layer = this.routeLayers.get(id);
      if (layer && this.map.hasLayer(layer)) {
        layer.setStyle({ weight: active ? (this.config.style.weight + 3) : this.config.style.weight, opacity: active ? 1.0 : this.config.style.opacity });
        if (active) layer.bringToFront();
      }
    }

    toggleRoute(id) {
      const l = this.routeLayers.get(id); const m = this.markerLayers.get(id);
      if (!l) return;
      if (this.map.hasLayer(l)) { this.map.removeLayer(l); if (m) this.map.removeLayer(m); }
      else { this.map.addLayer(l); if (m) this.map.addLayer(m); }
      this.updateAllComponents();
    }

    showAllRoutes() { this.batchUpdateRoutes(true); }
    hideAllRoutes() { this.batchUpdateRoutes(false); }
    batchUpdateRoutes(show) {
      this.routeLayers.forEach((l, id) => {
        const m = this.markerLayers.get(id);
        if (show && !this.map.hasLayer(l)) { this.map.addLayer(l); if (m) this.map.addLayer(m); }
        if (!show && this.map.hasLayer(l)) { this.map.removeLayer(l); if (m) this.map.removeLayer(m); }
      });
      this.updateAllComponents();
      if (show) this.fitToRoutes();
    }

    updateAllComponents() { this.createRouteSelector(); if (this.config.showStats) this.calculateAndShowTotalStats(); this._drawElevationProfile(); }

    fitToRoutes() {
      const layers = []; this.routeLayers.forEach(l => { if (this.map.hasLayer(l)) layers.push(l); });
      if (layers.length) this.map.flyToBounds(L.featureGroup(layers).getBounds(), { padding: [20, 20], duration: 1.5 });
    }

    calculateAndShowTotalStats() {
      const el = document.getElementById(this.statsId);
      if (!el) return;
      let d = 0, eg = 0, eloss = 0, c = 0, time = 0;
      this.routeLayers.forEach((l, id) => {
        if (this.map.hasLayer(l)) { c++; const s = this.routeStats.get(id); d += s.distance; eg += s.elevationGain; eloss += s.elevationLoss; time += s.duration; }
      });
      el.querySelector('[data-stat="distance"]').textContent = d.toFixed(2);

      el.querySelector('[data-stat="elevation"]').innerHTML = `
          <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; line-height:1.2;">
             <span style="color:#28a745 !important">↗ ${eg}m</span>
             <span style="color:#dc3545 !important">↘ ${eloss}m</span>
          </div>
        `;

      el.querySelector('[data-stat="time"]').textContent = this.formatTime(time);
      el.querySelector('[data-stat="routeCount"]').textContent = c;
      el.style.display = c > 0 ? 'block' : 'none';
    }

    getFileName(f) { return f.split('/').pop().replace('.gpx', '').replace(/[-_]/g, ' '); }

    downloadGPX(id) {
      const path = this.routeData.get(id)?.originalFile; if (!path) return;
      fetch(path).then(r => r.text()).then(t => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([t], { type: 'application/gpx+xml' }));
        a.download = path.split('/').pop();
        a.click();
      });
    }

    setupResizeHandling() {
      const el = document.getElementById(this.mapId);
      const redraw = () => { if (this.map) { this.map.invalidateSize(); } this._drawElevationProfile(); };
      window.addEventListener('resize', redraw);
      if (el && typeof ResizeObserver !== 'undefined') new ResizeObserver(redraw).observe(el);
      setTimeout(redraw, 500);
    }
    fitToVisibleRoutes() { this.fitToRoutes(); }
  }

  // Expose to global scope
  global.GPXMapHandler = GPXMapHandler;

})(window);
