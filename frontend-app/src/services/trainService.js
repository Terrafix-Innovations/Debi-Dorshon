import { fetchTrainStationsApi, fetchTrainPandalsApi } from './stationService';
import { getMockTrainStations, MOCK_TRAIN_STATIONS, MOCK_PANDALS } from '../data/mockData';

// GET /api/v1/transit/train/stations
export async function fetchTrainStations() {
  try {
    const res = await fetchTrainStationsApi();
    const liveStations = Array.isArray(res.data) ? res.data : [];

    if (liveStations.length > 0) {
      const mockMap = new Map(
        MOCK_TRAIN_STATIONS.map((s) => [s.name.toLowerCase().replace(/[^a-z0-9]/g, ''), s])
      );

      return liveStations.map((live, idx) => {
        const key = live.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const mockMatch = mockMap.get(key);
        return {
          _id: mockMatch?._id || `t_live_${idx + 1}`,
          name: live.name,
          nameBn: mockMatch?.nameBn || live.name,
          zone: mockMatch?.zone || 'Railway Network',
          pandal_count: live.pandal_count || 0,
          lat: mockMatch?.lat || 22.5839,
          lng: mockMatch?.lng || 88.3426,
        };
      });
    }
  } catch (err) {
    console.warn('[trainService] fetchTrainStations backend failed, using mock data:', err?.message);
  }
  return getMockTrainStations();
}

// GET /api/v1/transit/train/pandals
export async function fetchPandalsByTrain(stationName) {
  const nameStr = typeof stationName === 'string' ? stationName : stationName?.name;
  if (!nameStr) return [];
  try {
    const res = await fetchTrainPandalsApi(nameStr);
    if (res && res.data) {
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (Array.isArray(res.data.pandals)) list = res.data.pandals;
      if (list.length > 0) return list;
    }
  } catch (err) {
    console.warn('[trainService] fetchPandalsByTrain API error:', err?.message);
  }

  // Fallback: match directly from complete MOCK_PANDALS dataset strictly by nearest_stations
  const cleanName = nameStr.toLowerCase().trim();
  const matched = MOCK_PANDALS.filter((p) => {
    const stations = p.nearest_stations || [];
    return stations.some((s) => {
      const sName = (s.name || '').toLowerCase().trim();
      return sName === cleanName;
    });
  });
  return matched;
}

