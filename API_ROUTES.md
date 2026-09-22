# 🗺️ Debi-Dorshon API Routes Reference

This document provides a comprehensive reference for all available API endpoints in the **Debi-Dorshon** backend service for frontend and client developers.

---

## 📌 Base Information

- **Base URL**: `http://localhost:8000`
- **API v1 Prefix**: `http://localhost:8000/api/v1`
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI JSON Schema**: `http://localhost:8000/api/v1/openapi.json`

---

## 🚀 Quick Reference Table

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API Root / Welcome Message | ❌ No |
| `GET` | `/api/v1/health` | Health Check (Server & MongoDB) | ❌ No |
| `GET` | `/api/v1/pandals/` | List all pandals (Filter, Search & Paginate) | ❌ No |
| `GET` | `/api/v1/pandals/{pandal_id}` | Get pandal details by ObjectId | ❌ No |
| `GET` | `/api/v1/transit/metro/stations` | Ride by Metro: List all Metro stations | ❌ No |
| `GET` | `/api/v1/transit/metro/pandals` | Ride by Metro: Get pandals near a Metro station | ❌ No |
| `GET` | `/api/v1/transit/train/stations` | Ride by Train: List all Railway stations | ❌ No |
| `GET` | `/api/v1/transit/train/pandals` | Ride by Train: Get pandals near a Railway station | ❌ No |
| `POST` | `/api/v1/trip/plan` | Puja Parikrama: Generate itinerary from GPS origin | ❌ No |
| `GET` | `/api/v1/route/autocomplete` | Search places and pandals (Rate limited: 60/min) | ❌ No |
| `POST` | `/api/v1/route/plan` | A → B Route Planner: Road route itinerary & polyline (Rate limited: 7/min) | ❌ No |

> [!NOTE]
> - Pandal data is managed exclusively via internal database seeding scripts. Public mutation endpoints (`POST/PUT/DELETE /pandals`) are disabled.
> - High-performance caching is enabled (Redis with seamless in-memory fallback) across transit hubs, pandal lookups, and route plans.
> - `/api/v1/route/plan` enforces a strict rate limit of **7 requests per minute** to protect downstream routing resources.

---

## 🧱 Data Schemas

### 1. `LocationSchema`
```json
{
  "latitude": 22.5986,
  "longitude": 88.3712
}
```

### 2. `TransportInfoSchema`
```json
{
  "name": "Shyambazar",
  "line": "Blue Line"
}
```

### 3. `PandalResponse`
```json
{
  "id": "64d3f1a2b3c4d5e6f7a8b9c0",
  "name": "Shikdar Bagan Pushparaj",
  "region": "North",
  "cluster": "Shyambazar",
  "location": {
    "latitude": 22.598634,
    "longitude": 88.371205
  },
  "nearest_metro": {
    "name": "Shyambazar",
    "line": "Blue Line"
  },
  "nearest_stations": [
    {
      "name": "Kolkata Railway Station"
    }
  ],
  "nearest_ferry": {
    "name": "Bagbazar Ghat"
  }
}
```

### 4. `TripPlanRequest`
```json
{
  "origin_latitude": 22.5986,
  "origin_longitude": 88.3712,
  "region": "North",
  "cluster": "Shyambazar",
  "max_pandals": 5
}
```

### 5. `RoutePlanRequest` (A → B Route Planner)
```json
{
  "origin": {
    "latitude": 22.5726,
    "longitude": 88.3639
  },
  "destination": {
    "latitude": 22.5958,
    "longitude": 88.2636
  },
  "max_detour_km": 1.0,
  "max_pandals": 15
}
```

---

## 🛰️ Detailed Endpoint Specifications

### 1. Welcome Root Endpoint
Returns a basic welcome message and documentation links.
- **Method**: `GET`
- **Path**: `/`

### 2. Health Check
Verifies server health and active connection to MongoDB.
- **Method**: `GET`
- **Path**: `/api/v1/health`

### 3. List Pandals
- **Method**: `GET`
- **Path**: `/api/v1/pandals/`
- **Query Parameters**: `region`, `cluster`, `search`, `skip`, `limit`

### 4. Get Pandal by ID
- **Method**: `GET`
- **Path**: `/api/v1/pandals/{pandal_id}`

### 5. Ride by Metro: Metro Stations
- **Method**: `GET`
- **Path**: `/api/v1/transit/metro/stations`

### 6. Ride by Metro: Pandals by Metro Station
- **Method**: `GET`
- **Path**: `/api/v1/transit/metro/pandals`
- **Query Parameters**: `station_name` (required), `line` (optional)

### 7. Ride by Train: Railway Stations
- **Method**: `GET`
- **Path**: `/api/v1/transit/train/stations`

### 8. Ride by Train: Pandals by Train Station
- **Method**: `GET`
- **Path**: `/api/v1/transit/train/pandals`
- **Query Parameters**: `station_name` (required)

### 9. Puja Parikrama: Plan Trip Itinerary
Stateless route calculation calculating nearest candidate pandals from GPS coordinates.
- **Method**: `POST`
- **Path**: `/api/v1/trip/plan`

### 10. A → B Road Route-Based Puja Pandal Planner
Stateless road route-based itinerary planner evaluating candidate pandals against an OSRM OpenStreetMap polyline.
- **Method**: `POST`
- **Path**: `/api/v1/route/plan`

