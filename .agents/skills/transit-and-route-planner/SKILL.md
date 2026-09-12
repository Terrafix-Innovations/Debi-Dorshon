---
name: transit-and-route-planner
description: >-
  Use this skill when modifying, testing, or debugging routing algorithms, A to B road route planning (/api/v1/route/plan),
  nearest transit stations (/api/v1/transit/*), or Puja Parikrama itinerary algorithms.
---

# Transit & Route Planner Workflow

## Overview
Debi-Dorshon calculates Puja Parikrama itineraries and transit links across Kolkata using:
1. **OSRM (Open Source Routing Machine)** for road polyline geometries.
2. **Cumulative distance projection** (`calculate_polyline_cumulative_distances`) to compute exact progress ratio along the route.
3. **Cluster-aware nearest-neighbor tour** (`order_pandals_along_polyline` in `app/utils/geo.py`) which:
   - Starts at the candidate closest to origin within the route corridor.
   - Sweeps neighboring pandals in the same cluster or walking distance (<= 0.65 km).
   - Advances forward along the corridor toward the destination without erratic cross-city jumping or backtracking.

## Key Files
- `backend/app/utils/geo.py`: Core mathematical and geospatial functions (`haversine_distance`, `order_pandals_along_polyline`).
- `backend/app/services/route_planner.py`: OSRM client and `RoutePlannerService`.
- `backend/app/api/v1/endpoints/route.py`: `POST /api/v1/route/plan` endpoint.

## Validation
Always run route planner unit tests after modifying routing logic:
```bash
uv run --project backend pytest backend/tests/test_route_planner.py -v
```
