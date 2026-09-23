import { KOLKATA_REGION } from './constants';

// Computes a MapView region that frames a full list of {latitude, longitude}
// points, so a source->destination path (plus checkpoints) is always in view.
export function getRegionForCoordinates(points) {
  if (!points || points.length === 0) return KOLKATA_REGION;

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  points.forEach((p) => {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  });

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.03),
    longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.03),
  };
}
