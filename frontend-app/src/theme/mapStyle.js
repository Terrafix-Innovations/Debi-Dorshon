// Debi-Dorshon custom Google Maps JSON styling
// Color palette: Cream/Parchment land (#FAF2E4), Muted Hooghly River blue (#C6DDE8),
// Gold-tinted highways (#D4A017), Espresso labels (#2B1608), and Maroon accents (#8B1A1A).

export const DEBI_DORSHON_MAP_STYLE = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#FAF2E4' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2B1608' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#FFF8ED' }, { weight: 2 }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#C9A227' }, { weight: 0.8 }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8C6D46' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [{ color: '#F5EBD7' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry.fill',
    stylers: [{ color: '#F0E5CF' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#EBE0C7' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6E4522' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#E2E8CE' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#446633' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E4D5BC' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3E2412' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#FBF3E1' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#F5DEB3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#D4A017' }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: '#EDC967' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#E8DCB8' }],
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [{ color: '#C9A227' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'geometry',
    stylers: [{ color: '#DFCCA2' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#BED6E3' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3A5A6D' }],
  },
];
