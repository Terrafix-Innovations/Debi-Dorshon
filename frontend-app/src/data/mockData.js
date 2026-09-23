// Comprehensive mock data and fallbacks for Debi-Dorshon app when backend is unreachable

export const MOCK_METRO_STATIONS = [
  { _id: 'm1', name: 'Dakshineswar', nameBn: 'দক্ষিণেশ্বর', lat: 22.6548, lng: 88.3582, line: 'Blue Line' },
  { _id: 'm2', name: 'Dum Dum', nameBn: 'দমদম', lat: 22.6221, lng: 88.3780, line: 'Blue Line' },
  { _id: 'm3', name: 'Shyambazar', nameBn: 'শ্যামবাজার', lat: 22.6006, lng: 88.3698, line: 'Blue Line' },
  { _id: 'm4', name: 'Sovabazar Sutanuti', nameBn: 'শোভাবাজার সুতানুটি', lat: 22.5960, lng: 88.3640, line: 'Blue Line' },
  { _id: 'm5', name: 'Girish Park', nameBn: 'গিরিশ পার্ক', lat: 22.5855, lng: 88.3602, line: 'Blue Line' },
  { _id: 'm6', name: 'Mahatma Gandhi Road', nameBn: 'মহাত্মা গান্ধী রোড', lat: 22.5802, lng: 88.3590, line: 'Blue Line' },
  { _id: 'm7', name: 'Central', nameBn: 'সেন্ট্রাল', lat: 22.5694, lng: 88.3596, line: 'Blue Line' },
  { _id: 'm8', name: 'Esplanade', nameBn: 'এসপ্ল্যানেড', lat: 22.5649, lng: 88.3517, line: 'Blue Line' },
  { _id: 'm9', name: 'Park Street', nameBn: 'পার্ক স্ট্রিট', lat: 22.5539, lng: 88.3512, line: 'Blue Line' },
  { _id: 'm10', name: 'Kalighat', nameBn: 'কালীঘাট', lat: 22.5186, lng: 88.3468, line: 'Blue Line' },
  { _id: 'm11', name: 'Rabindra Sarobar', nameBn: 'রবীন্দ্র সরোবর', lat: 22.5082, lng: 88.3458, line: 'Blue Line' },
  { _id: 'm12', name: 'Kavi Subhash (New Garia)', nameBn: 'কবি সুভাষ', lat: 22.4690, lng: 88.3965, line: 'Blue Line' },
  { _id: 'm13', name: 'Sealdah Metro', nameBn: 'শিয়ালদহ মেট্ৰো', lat: 22.5670, lng: 88.3712, line: 'Green Line' },
  { _id: 'm14', name: 'Salt Lake Sector V', nameBn: 'সল্টলেক সেক্টর ৫', lat: 22.5808, lng: 88.4346, line: 'Green Line' },
  { _id: 'm15', name: 'Karunamoyee', nameBn: 'করুণাময়ী', lat: 22.5862, lng: 88.4191, line: 'Green Line' },
];

export const MOCK_TRAIN_STATIONS = [
  { _id: 't1', name: 'Howrah Junction', nameBn: 'হাওড়া জংশন', lat: 22.5839, lng: 88.3426, zone: 'Eastern Railway' },
  { _id: 't2', name: 'Sealdah Junction', nameBn: 'শিয়ালদহ জংশন', lat: 22.5670, lng: 88.3712, zone: 'Eastern Railway' },
  { _id: 't3', name: 'Bidhannagar Road', nameBn: 'বিধাননগর রোড', lat: 22.5937, lng: 88.3887, zone: 'Eastern Railway' },
  { _id: 't4', name: 'Dum Dum Junction', nameBn: 'দমদম জংশন', lat: 22.6221, lng: 88.3780, zone: 'Eastern Railway' },
  { _id: 't5', name: 'Majerhat', nameBn: 'মাঝেরহাট', lat: 22.5181, lng: 88.3242, zone: 'Circular Railway' },
  { _id: 't6', name: 'Ballygunge Junction', nameBn: 'বালিগঞ্জ জংশন', lat: 22.5278, lng: 88.3667, zone: 'Eastern Railway' },
  { _id: 't7', name: 'Shalimar', nameBn: 'শালিমার', lat: 22.5540, lng: 88.3180, zone: 'South Eastern Railway' },
  { _id: 't8', name: 'Kolkata Terminal', nameBn: 'কলকাতা টার্মিনাল', lat: 22.6033, lng: 88.3710, zone: 'Eastern Railway' },
];

export const DUMMY_USER_LOCATION = {
  address: 'Park Street Metro Area, Kolkata',
  lat: 22.5539,
  lng: 88.3512,
  accuracy: '12m',
};

export const MOCK_PANDALS = [
  { _id: 'p1', name: 'Sree Bhumi Sporting Club', nameBn: 'শ্রীভূমি স্পোর্টিং ক্লাব', lat: 22.6022, lng: 88.3985, area: 'Lake Town', zone: 'North Kolkata', rating: 4.9 },
  { _id: 'p2', name: 'College Square Sarbojanin', nameBn: 'কলেজ স্কয়ার সর্বজনীন', lat: 22.5746, lng: 88.3638, area: 'College Street', zone: 'Central Kolkata', rating: 4.8 },
  { _id: 'p3', name: 'Mohammad Ali Park', nameBn: 'মহম্মদ আলী পার্ক', lat: 22.5768, lng: 88.3601, area: 'MG Road', zone: 'Central Kolkata', rating: 4.7 },
  { _id: 'p4', name: 'Chetla Agrani Club', nameBn: 'চেতলা অগ্রণী ক্লাব', lat: 22.5195, lng: 88.3412, area: 'Chetla', zone: 'South Kolkata', rating: 4.8 },
  { _id: 'p5', name: 'Ekdalia Evergreen', nameBn: 'একডালিয়া এভারগ্রিন', lat: 22.5180, lng: 88.3685, area: 'Gariahat', zone: 'South Kolkata', rating: 4.9 },
  { _id: 'p6', name: 'Singhi Park', nameBn: 'সিংহি পার্ক', lat: 22.5198, lng: 88.3662, area: 'Gariahat', zone: 'South Kolkata', rating: 4.6 },
  { _id: 'p7', name: 'Suruchi Sangha', nameBn: 'সুরুচি সংঘ', lat: 22.5140, lng: 88.3305, area: 'New Alipore', zone: 'South Kolkata', rating: 4.9 },
  { _id: 'p8', name: 'Maddox Square', nameBn: 'ম্যাডক্স স্কয়ার', lat: 22.5332, lng: 88.3615, area: 'Ballygunge', zone: 'South Kolkata', rating: 4.7 },
  { _id: 'p9', name: 'FD Block Salt Lake', nameBn: 'এফডি ব্লক সল্টলেক', lat: 22.5815, lng: 88.4110, area: 'Salt Lake', zone: 'East Kolkata', rating: 4.5 },
  { _id: 'p10', name: 'Mudiali Club', nameBn: 'মুদিয়ালী ক্লাব', lat: 22.5098, lng: 88.3490, area: 'Southern Avenue', zone: 'South Kolkata', rating: 4.6 },
  { _id: 'p11', name: 'Badamtala Ashar Sangha', nameBn: 'বাদামতলা আষাঢ় সংঘ', lat: 22.5170, lng: 88.3498, area: 'Kalighat', zone: 'South Kolkata', rating: 4.7 },
  { _id: 'p12', name: 'Tridhara Sammilani', nameBn: 'ত্রিধারা সম্মিলনী', lat: 22.5225, lng: 88.3620, area: 'Manoharpukur', zone: 'South Kolkata', rating: 4.8 },
  { _id: 'p13', name: 'Sovabazar Rajbari', nameBn: 'শোভাবাজার রাজবাড়ি', lat: 22.5950, lng: 88.3628, area: 'Sovabazar', zone: 'North Kolkata', rating: 4.6 },
];

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

