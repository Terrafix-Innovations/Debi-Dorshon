# Debi-Dorshon Route Planner Testing Lab (React + Vite)

A modern, responsive React testing workbench for testing the Debi-Dorshon Route Planner API (`/api/v1/route/plan`).

## Features
- **Live Search Autocomplete**: Search locations with Kolkata bias (OSM Nominatim geocoding).
- **Interactive Leaflet Map**:
  - Origin pin (Green `A`, draggable)
  - Destination pin (Red `B`, draggable)
  - Route line rendering using GeoJSON `LineString` from backend OSRM
  - Numbered pandal stops (`1`, `2`, `3`...) along the path
  - Popups showing pandal name, zone/cluster, detour distance, and nearest metro/ferry
  - Direct map click to set Origin or Destination
- **Sidebar Itinerary**: Ordered card list of stops. Clicking any card flies to the pandal on the map.
- **Summary Metrics**: Total Pandals, Total Driving Distance (km), Max Detour (km).
- **1-Click Presets**: "Ahiritola ➔ Maniktala", "Dum Dum ➔ Maniktala", "Bagbazar ➔ College St".
- **Raw API JSON Inspector**: Accordion with a 1-click **Copy JSON** button.

## Running Locally

```bash
cd frontend-map_testing
npm run dev
```
Open **`http://localhost:5173/`** in your browser.
