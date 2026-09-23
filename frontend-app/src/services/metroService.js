import { fetchMetroStationsApi, fetchMetroPandalsApi } from './stationService';
import { getMockMetroStations, MOCK_METRO_STATIONS, MOCK_PANDALS } from '../data/mockData';

// GET /api/v1/transit/metro/stations
export async function fetchMetroStations() {
  try {
    const res = await fetchMetroStationsApi();
    const liveStations = Array.isArray(res.data) ? res.data : [];

    if (liveStations.length > 0) {
      const mockMap = new Map(
        MOCK_METRO_STATIONS.map((s) => [s.name.toLowerCase().replace(/[^a-z0-9]/g, ''), s])
      );

      return liveStations.map((live, idx) => {
        const key = live.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const mockMatch = mockMap.get(key);
        return {
          _id: mockMatch?._id || `m_live_${idx + 1}`,
          name: live.name,
          nameBn: mockMatch?.nameBn || live.name,
          line: live.line ? (live.line.toLowerCase().includes('line') ? live.line : `${live.line} Line`) : (mockMatch?.line || 'Metro Network'),
          pandal_count: live.pandal_count || 0,
          lat: mockMatch?.lat || 22.5726,
          lng: mockMatch?.lng || 88.3639,
        };
      });
    }
  } catch (err) {
    console.warn('[metroService] fetchMetroStations backend failed, using mock data:', err?.message);
  }
  return getMockMetroStations();
}

// GET /api/v1/transit/metro/pandals
export async function fetchPandalsByMetro(stationName, line = null) {
  const nameStr = typeof stationName === 'string' ? stationName : stationName?.name;
  if (!nameStr) return [];
  try {
    const res = await fetchMetroPandalsApi(nameStr);
    if (res && res.data) {
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (Array.isArray(res.data.pandals)) list = res.data.pandals;
      if (list.length > 0) return list;
    }
  } catch (err) {
    console.warn('[metroService] fetchPandalsByMetro API error:', err?.message);
  }

  // Fallback: match directly from complete MOCK_PANDALS dataset strictly by nearest_metro
  const cleanName = nameStr.toLowerCase().trim();
  const matched = MOCK_PANDALS.filter((p) => {
    const mName = (p.nearest_metro?.name || '').toLowerCase().trim();
    return mName === cleanName;
  });
  return matched;
}

