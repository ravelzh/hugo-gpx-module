---
title: "GPX Map Test"
date: 2026-01-28
---

## Single Map Test

{{< gpx-map file="test.gpx" height="500px" >}}

## Marine Mode Test (km/nm toggle + Seamarks)

{{< gpx-map file="test.gpx" height="500px" show-unit-toggle="true" show-seamarks="true" >}}

## Multi Map Test

{{< gpx-map file="test.gpx" file2="test.gpx" height="500px" >}}


## No Elevation Info

This map should NOT show elevation gain/loss in the summary box, and popups should generally hide elevation if configured (current implementation hides summary stats mostly).

{{< gpx-map file="test.gpx" file2="test.gpx" elevation-info="false" >}}