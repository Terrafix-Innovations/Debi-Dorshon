import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/env';
import { getMockMetroStations, getMockMetroRoute, MOCK_METRO_STATIONS } from '../data/mockData';

// GET /api/v1/transit/metro/stations
export async function fetchMetroStations() {
  try {
    const res = await apiClient.get(API_ENDPOINTS.METRO_STATIONS);
    const liveStations = Array.isArray(res.data) ? res.data : [];
    
    // Create a map of live stations for quick lookup
    const liveMap = new Map(
      liveStations.map((s) => [s.name.toLowerCase(), s])
    );

    // Combine MOCK_METRO_STATIONS with any extra live stations not in mocks
    const combined = MOCK_METRO_STATIONS.map((mockStation) => {
      const live = liveMap.get(mockStation.name.toLowerCase());
      if (live) {
        liveMap.delete(mockStation.name.toLowerCase()); // Marked as handled
      }
      return {
        ...mockStation,
        pandal_count: live?.pandal_count || 0,
        line: live?.line ? (live.line.toLowerCase().includes('line') ? live.line : `${live.line} Line`) : mockStation.line,
      };
    });

    // Add remaining live stations that weren't in mocks
    liveMap.forEach((live, name) => {
      combined.push({
        _id: `m_live_${combined.length + 1}`,
        name: live.name,
        nameBn: live.name, // Fallback
        line: live.line ? (live.line.toLowerCase().includes('line') ? live.line : `${live.line} Line`) : 'Metro Network',
        pandal_count: live.pandal_count || 0,
        lat: 22.5726, // Generic Kolkata
        lng: 88.3639,
      });
    });

    return combined;
  } catch (err) {
    console.warn('[metroService] fetchMetroStations backend failed, using mock data:', err?.message);
  }
  return getMockMetroStations();
}

// GET /api/v1/transit/metro/pandals
export async function fetchPandalsByMetro(stationName, line = null) {
  try {
    const params = { station_name: stationName };
    if (line) params.line = line.replace(' Line', '');
    const res = await apiClient.get(API_ENDPOINTS.METRO_PANDALS || '/transit/metro/pandals', { params });
    if (res.data && res.data.pandals) {
      return res.data.pandals;
    }
  } catch (err) {
    console.warn('[metroService] fetchPandalsByMetro failed:', err?.message);
  }
  return [];
}
