// Comprehensive mock data and fallbacks for Debi-Dorshon app when backend is unreachable
import debiDorshonData from './debi_dorshon.json';

export const MOCK_METRO_STATIONS = [
  { _id: 'm1', name: 'Kalighat', nameBn: 'কালীঘাট', lat: 22.5186, lng: 88.3468, line: 'Blue Line', pandal_count: 18 },
  { _id: 'm2', name: 'Shyambazar', nameBn: 'শ্যামবাজার', lat: 22.6006, lng: 88.3698, line: 'Blue Line', pandal_count: 14 },
  { _id: 'm3', name: 'Behala Bazar', nameBn: 'বেহালা বাজার', lat: 22.5020, lng: 88.3180, line: 'Purple Line', pandal_count: 8 },
  { _id: 'm4', name: 'Rabindra Sarobar', nameBn: 'রবীন্দ্র সরোবর', lat: 22.5082, lng: 88.3458, line: 'Blue Line', pandal_count: 7 },
  { _id: 'm5', name: 'Sovabazar-Sutanuti', nameBn: 'শোভাবাজার-সুতানুটি', lat: 22.5960, lng: 88.3640, line: 'Blue Line', pandal_count: 7 },
  { _id: 'm6', name: 'Netaji Bhavan', nameBn: 'নেতাজি ভবন', lat: 22.5350, lng: 88.3440, line: 'Blue Line', pandal_count: 6 },
  { _id: 'm7', name: 'Jessore Road', nameBn: 'যশোর রোড', lat: 22.6280, lng: 88.4050, line: 'Yellow Line', pandal_count: 5 },
  { _id: 'm8', name: 'Belgachhia', nameBn: 'বেলগাছিয়া', lat: 22.6080, lng: 88.3800, line: 'Blue Line', pandal_count: 4 },
  { _id: 'm9', name: 'Girish Park', nameBn: 'গিরিশ পার্ক', lat: 22.5855, lng: 88.3602, line: 'Blue Line', pandal_count: 4 },
  { _id: 'm10', name: 'Hemanta Mukhopadhyay', nameBn: 'হেমন্ত মুখোপাধ্যায়', lat: 22.5180, lng: 88.3980, line: 'Orange Line', pandal_count: 4 },
  { _id: 'm11', name: 'Jatin Das Park', nameBn: 'জতিন দাস পার্ক', lat: 22.5260, lng: 88.3450, line: 'Blue Line', pandal_count: 3 },
  { _id: 'm12', name: 'Netaji', nameBn: 'নেতাজি', lat: 22.4820, lng: 88.3580, line: 'Blue Line', pandal_count: 3 },
  { _id: 'm13', name: 'Taratala', nameBn: 'তারা তলা', lat: 22.5130, lng: 88.3120, line: 'Purple Line', pandal_count: 3 },
  { _id: 'm14', name: 'Sakher Bazar', nameBn: 'সখের বাজার', lat: 22.4900, lng: 88.3140, line: 'Purple Line', pandal_count: 2 },
  { _id: 'm15', name: 'Gitanjali', nameBn: 'গীতাঞ্জলি', lat: 22.4630, lng: 88.3750, line: 'Blue Line', pandal_count: 1 },
  { _id: 'm16', name: 'Kavi Nazrul', nameBn: 'কবি নজরুল', lat: 22.4550, lng: 88.3850, line: 'Blue Line', pandal_count: 1 },
  { _id: 'm17', name: 'Noapara', nameBn: 'নোয়াপাড়া', lat: 22.6390, lng: 88.3810, line: 'Blue Line', pandal_count: 1 },
];

export const MOCK_TRAIN_STATIONS = [
  { _id: 't1', name: 'New Alipur', nameBn: 'নিউ আলিপুর', lat: 22.5200, lng: 88.3280, zone: 'Circular Railway', pandal_count: 15 },
  { _id: 't2', name: 'Ballygunge Jn', nameBn: 'বালিগঞ্জ জংশন', lat: 22.5278, lng: 88.3667, zone: 'Eastern Railway', pandal_count: 15 },
  { _id: 't3', name: 'Bagbazar', nameBn: 'বাগবাজার', lat: 22.6020, lng: 88.3610, zone: 'Circular Railway', pandal_count: 11 },
  { _id: 't4', name: 'Bidhannagar Road', nameBn: 'বিধাননগর রোড', lat: 22.5937, lng: 88.3887, zone: 'Eastern Railway', pandal_count: 10 },
  { _id: 't5', name: 'Majherhat', nameBn: 'মাঝেরহাট', lat: 22.5181, lng: 88.3242, zone: 'Circular Railway', pandal_count: 10 },
  { _id: 't6', name: 'Tollygunj', nameBn: 'টালিগঞ্জ', lat: 22.5020, lng: 88.3450, zone: 'Eastern Railway', pandal_count: 8 },
  { _id: 't7', name: 'Khidirpur', nameBn: 'খিদিরপুর', lat: 22.5390, lng: 88.3260, zone: 'Circular Railway', pandal_count: 6 },
  { _id: 't8', name: 'Dum Dum Cant.', nameBn: 'দমদম ক্যান্টনমেন্ট', lat: 22.6280, lng: 88.3900, zone: 'Eastern Railway', pandal_count: 5 },
  { _id: 't9', name: 'Dhakuria', nameBn: 'ঢাকুরিয়া', lat: 22.5120, lng: 88.3680, zone: 'Eastern Railway', pandal_count: 5 },
  { _id: 't10', name: 'Sovabazar Ahiritola', nameBn: 'শোভাবাজার অহিরীটোলা', lat: 22.5950, lng: 88.3580, zone: 'Circular Railway', pandal_count: 4 },
  { _id: 't11', name: 'Tala', nameBn: 'টালা', lat: 22.6080, lng: 88.3720, zone: 'Circular Railway', pandal_count: 4 },
  { _id: 't12', name: 'Lake Gardens', nameBn: 'লেক গার্ডেনস', lat: 22.5080, lng: 88.3580, zone: 'Eastern Railway', pandal_count: 3 },
  { _id: 't13', name: 'Dumdum', nameBn: 'দমদম', lat: 22.6221, lng: 88.3780, zone: 'Eastern Railway', pandal_count: 1 },
  { _id: 't14', name: 'New Garia', nameBn: 'নিউ গড়িয়া', lat: 22.4690, lng: 88.3965, zone: 'Eastern Railway', pandal_count: 1 },
  { _id: 't15', name: 'Jadabpur', nameBn: 'যাদবপুর', lat: 22.4950, lng: 88.3720, zone: 'Eastern Railway', pandal_count: 1 },
];

export const DUMMY_USER_LOCATION = {
  address: 'Park Street Metro Area, Kolkata',
  lat: 22.5539,
  lng: 88.3512,
  accuracy: '12m',
};

export const MOCK_PANDALS = debiDorshonData.map((p, idx) => ({
  _id: p._id || `p_${idx + 1}`,
  id: p._id || `p_${idx + 1}`,
  name: p.name,
  nameBn: p.nameBn || p.name,
  region: p.region || 'Kolkata',
  cluster: p.cluster || p.region || 'Kolkata',
  area: p.cluster || p.region || 'Kolkata',
  zone: p.region || 'Kolkata',
  location: p.location || { latitude: 22.5726, longitude: 88.3639 },
  lat: p.location?.latitude || 22.5726,
  lng: p.location?.longitude || 88.3639,
  nearest_metro: p.nearest_metro || null,
  nearest_stations: p.nearest_stations || [],
  nearest_ferry: p.nearest_ferry || null,
  rating: p.rating || 4.8,
}));

// Helper to generate a polyline path between points
function generatePolyline(start, end, steps = 8) {
  const path = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    // Add slight curve offset for natural route visualization
    const offset = Math.sin(ratio * Math.PI) * 0.005;
    path.push({
      lat: start.lat + (end.lat - start.lat) * ratio + offset,
      lng: start.lng + (end.lng - start.lng) * ratio,
    });
  }
  return path;
}

// Calculate distance in km
function calculateDistance(start, end) {
  const dLat = (end.lat - start.lat) * 111;
  const dLng = (end.lng - start.lng) * 111 * Math.cos(start.lat * (Math.PI / 180));
  const dist = Math.sqrt(dLat * dLat + dLng * dLng);
  return parseFloat(Math.max(dist, 1.2).toFixed(1));
}

// Mock route generator
export function buildMockRouteResponse(sourceItem, destItem, availableCheckpoints = []) {
  const source = sourceItem || MOCK_METRO_STATIONS[0];
  const destination = destItem || MOCK_METRO_STATIONS[1];
  
  // Pick 2 intermediate checkpoints
  const filteredCP = availableCheckpoints.filter(
    (c) => c._id !== source._id && c._id !== destination._id
  );
  const checkpoints = filteredCP.slice(0, 2);

  const distanceKm = calculateDistance(source, destination);
  const durationMin = Math.round(distanceKm * 4 + 5);

  const path = generatePolyline(source, destination, 10);

  return {
    source: { _id: source._id, name: source.name, lat: source.lat, lng: source.lng },
    destination: { _id: destination._id, name: destination.name, lat: destination.lat, lng: destination.lng },
    checkpoints: checkpoints.map((cp) => ({ _id: cp._id, name: cp.name, lat: cp.lat, lng: cp.lng })),
    path,
    distanceKm,
    durationMin,
  };
}

export function getMockMetroStations() {
  return MOCK_METRO_STATIONS;
}

export function getMockMetroRoute(sourceId, destinationId) {
  const src = MOCK_METRO_STATIONS.find((s) => s._id === sourceId) || MOCK_METRO_STATIONS[2];
  const dest = MOCK_METRO_STATIONS.find((s) => s._id === destinationId) || MOCK_METRO_STATIONS[9];
  return buildMockRouteResponse(src, dest, MOCK_METRO_STATIONS);
}

export function getMockTrainStations() {
  return MOCK_TRAIN_STATIONS;
}

export function getMockTrainRoute(sourceId, destinationId) {
  const src = MOCK_TRAIN_STATIONS.find((s) => s._id === sourceId) || MOCK_TRAIN_STATIONS[0];
  const dest = MOCK_TRAIN_STATIONS.find((s) => s._id === destinationId) || MOCK_TRAIN_STATIONS[1];
  return buildMockRouteResponse(src, dest, MOCK_TRAIN_STATIONS);
}

export function getMockPandals() {
  return MOCK_PANDALS;
}

export function getMockPandalRoute(sourceId, destinationId, mode = 'walking') {
  const src = MOCK_PANDALS.find((p) => p._id === sourceId) || MOCK_PANDALS[0];
  const dest = MOCK_PANDALS.find((p) => p._id === destinationId) || MOCK_PANDALS[3];

  const intermediateStations = mode === 'metro' ? MOCK_METRO_STATIONS : MOCK_TRAIN_STATIONS;
  const res = buildMockRouteResponse(src, dest, intermediateStations);
  res.mode = mode;
  return res;
}

export function getMockMultiStopRoute(stopIds = []) {
  const selectedPandals = MOCK_PANDALS.filter((p) => stopIds.includes(p._id));
  const stops = selectedPandals.length >= 2 ? selectedPandals : [MOCK_PANDALS[0], MOCK_PANDALS[1], MOCK_PANDALS[4]];
  
  const first = stops[0];
  const last = stops[stops.length - 1];

  let fullPath = [];
  let totalDistanceKm = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const legPath = generatePolyline(stops[i], stops[i + 1], 6);
    fullPath = fullPath.concat(legPath);
    totalDistanceKm += calculateDistance(stops[i], stops[i + 1]);
  }

  const checkpoints = stops.slice(1, -1).map((s) => ({ _id: s._id, name: s.name, lat: s.lat, lng: s.lng }));
  const totalDurationMin = Math.round(totalDistanceKm * 6 + 10);

  return {
    stops: stops.map((s) => ({ _id: s._id, name: s.name, lat: s.lat, lng: s.lng })),
    checkpoints,
    path: fullPath,
    totalDistanceKm: parseFloat(totalDistanceKm.toFixed(1)),
    totalDurationMin,
  };
}

let mockTripsDatabase = {};

export function saveMockTrip(trip) {
  const tripId = `trip_${Date.now()}`;
  const saved = {
    _id: tripId,
    name: trip.name || 'My Durga Puja Parikrama',
    stops: trip.stops || [],
    createdAt: new Date().toISOString(),
  };
  mockTripsDatabase[tripId] = saved;
  return saved;
}

export function getMockTrip(tripId) {
  if (mockTripsDatabase[tripId]) return mockTripsDatabase[tripId];
  return {
    _id: tripId || 'trip_default',
    name: 'Sample Parikrama',
    stops: [
      { id: '1', refId: 'p1', name: 'Sree Bhumi Sporting Club', type: 'pandal', lat: 22.6022, lng: 88.3985 },
      { id: '2', refId: 'p2', name: 'College Square Sarbojanin', type: 'pandal', lat: 22.5746, lng: 88.3638 },
      { id: '3', refId: 'p5', name: 'Ekdalia Evergreen', type: 'pandal', lat: 22.5180, lng: 88.3685 },
    ],
    createdAt: new Date().toISOString(),
  };
}

export function getMockTripPlan(params = {}) {
  return {
    planId: 'plan_kolkata_2026',
    title: 'Kolkata Sharadotsav Parikrama Plan',
    totalPandals: MOCK_PANDALS.length,
    pandals: MOCK_PANDALS,
    recommendedRoute: {
      totalDistanceKm: 14.5,
      totalDurationMin: 95,
      startLocation: DUMMY_USER_LOCATION,
    },
    status: 'mock_fallback',
  };
}

