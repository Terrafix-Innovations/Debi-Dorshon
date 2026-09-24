import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Alert,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

let MapView, Marker, Polyline;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
  } catch (e) {
    MapView = null;
  }
}
import * as Location from 'expo-location';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import FloatingRouteCard from '../../components/trip/FloatingRouteCard';
import RouteSummaryChip from '../../components/trip/RouteSummaryChip';
import PandalCarousel from '../../components/trip/PandalCarousel';
import { fetchRoutePlan } from '../../services/routeService';
import { MOCK_PANDALS } from '../../data/mockData';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

// Calculate distance in meters between two points
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function TripScreen({ navigation }) {
  // Origin and Destination state
  const [startPlace, setStartPlace] = useState({
    id: 'start_def',
    title: 'Shyambazar Metro Station',
    latitude: 22.6033,
    longitude: 88.3702,
  });

  const [endPlace, setEndPlace] = useState({
    id: 'end_def',
    title: 'Kalighat Metro Station',
    latitude: 22.5186,
    longitude: 88.3468,
  });

  const [startText, setStartText] = useState('Shyambazar Metro Station');
  const [endText, setEndText] = useState('Kalighat Metro Station');

  // Route calculation state
  const [routePlan, setRoutePlan] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const mapRef = useRef(null);

  // Auto-trigger route calculation when both Start and Destination are set
  useEffect(() => {
    async function calculateCorridorRoute() {
      if (!startPlace?.latitude || !endPlace?.latitude) {
        setRoutePlan(null);
        return;
      }

      // Check distance validation: if < 50 meters, show toast/alert
      const distMeters = calculateDistanceMeters(
        startPlace.latitude,
        startPlace.longitude,
        endPlace.latitude,
        endPlace.longitude
      );

      if (distMeters < 50) {
        Alert.alert(
          'Locations Too Close',
          'Start and destination are too close together. Please pick locations further apart.'
        );
        return;
      }

      setLoadingRoute(true);
      try {
        const plan = await fetchRoutePlan(
          {
            name: startPlace.title || startText,
            latitude: startPlace.latitude,
            longitude: startPlace.longitude,
          },
          {
            name: endPlace.title || endText,
            latitude: endPlace.latitude,
            longitude: endPlace.longitude,
          },
          2.5
        );
        setRoutePlan(plan);
        setActiveIndex(0);
      } catch (err) {
        console.warn('[TripScreen] Route calculation error:', err);
      } finally {
        setLoadingRoute(false);
      }
    }

    calculateCorridorRoute();
  }, [startPlace?.latitude, startPlace?.longitude, endPlace?.latitude, endPlace?.longitude]);

  // Handle Swap Start & End
  const handleSwap = () => {
    const tempPlace = startPlace;
    const tempText = startText;
    setStartPlace(endPlace);
    setStartText(endText);
    setEndPlace(tempPlace);
    setEndText(tempText);
  };

  // Handle Current Location Quick Select (real device GPS via expo-location)
  const [locating, setLocating] = useState(false);
  const handleUseCurrentLocation = async () => {
    // Web has no expo-location native module; fall back to Kolkata center.
    if (Platform.OS === 'web') {
      const fallback = {
        id: 'curr_loc',
        title: 'My Current Location (Kolkata)',
        latitude: 22.5726,
        longitude: 88.3639,
      };
      setStartPlace(fallback);
      setStartText(fallback.title);
      return;
    }

    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Needed',
          'Enable location access to use your current position as the start point.'
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const curr = {
        id: 'curr_loc',
        title: 'My Current Location',
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setStartPlace(curr);
      setStartText(curr.title);
    } catch (err) {
      console.warn('[TripScreen] Location fetch failed:', err);
      Alert.alert(
        'Location Unavailable',
        'Could not fetch your current location. Please try again or search manually.'
      );
    } finally {
      setLocating(false);
    }
  };

  // Extract path coordinates and markers for map rendering
  const polylineCoords = useMemo(() => {
    if (routePlan?.path && routePlan.path.length > 0) {
      return routePlan.path.map((p) => ({
        latitude: p.latitude || p.lat,
        longitude: p.longitude || p.lng,
      }));
    }
    if (startPlace && endPlace) {
      return [
        { latitude: startPlace.latitude, longitude: startPlace.longitude },
        { latitude: endPlace.latitude, longitude: endPlace.longitude },
      ];
    }
    return [];
  }, [routePlan, startPlace, endPlace]);

  const itinerary = useMemo(() => {
    return routePlan?.itinerary || [];
  }, [routePlan]);

  // Tap an empty point on the map to auto-assign Start (if empty) then Destination.
  const handleMapPress = (e) => {
    const coord = e?.nativeEvent?.coordinate;
    if (!coord) return;

    if (!startPlace?.latitude) {
      const picked = {
        id: `map_${Date.now()}`,
        title: `Dropped Pin (${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)})`,
        latitude: coord.latitude,
        longitude: coord.longitude,
      };
      setStartPlace(picked);
      setStartText(picked.title);
      try { Vibration.vibrate(15); } catch (err) { }
      return;
    }

    if (!endPlace?.latitude) {
      const picked = {
        id: `map_${Date.now()}`,
        title: `Dropped Pin (${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)})`,
        latitude: coord.latitude,
        longitude: coord.longitude,
      };
      setEndPlace(picked);
      setEndText(picked.title);
      try { Vibration.vibrate(15); } catch (err) { }
    }
  };

  // Map camera centering on active card selection
  const handleSelectCard = (index, item) => {
    setActiveIndex(index);
    try { Vibration.vibrate(12); } catch (err) { }
    const p = item.pandal || item;
    const lat = p.location?.latitude ?? p.lat;
    const lng = p.location?.longitude ?? p.lng;

    if (mapRef.current && lat && lng) {
      try {
        if (Platform.OS === 'web') {
          // Handled in Leaflet map view below
        } else {
          mapRef.current.animateCamera({
            center: { latitude: lat, longitude: lng },
            zoom: 15.5,
          });
        }
      } catch (e) { }
    }
  };

  // Fit map bounds whenever route plan completes
  useEffect(() => {
    if (mapRef.current && polylineCoords.length > 1 && Platform.OS !== 'web') {
      try {
        mapRef.current.fitToCoordinates(polylineCoords, {
          edgePadding: { top: 180, bottom: 220, left: 50, right: 50 },
          animated: true,
        });
      } catch (e) { }
    }
  }, [polylineCoords]);

  // Leaflet HTML generation for Web interactive preview
  const leafletWebHtml = useMemo(() => {
    const sLat = startPlace?.latitude || 22.5726;
    const sLng = startPlace?.longitude || 88.3639;
    const eLat = endPlace?.latitude || 22.5985;
    const eLng = endPlace?.longitude || 88.3712;

    const polyPoints = polylineCoords.map((c) => `[${c.latitude}, ${c.longitude}]`).join(',');
    const markersJson = itinerary.map((item, idx) => {
      const p = item.pandal;
      return {
        idx: idx + 1,
        lat: p.location?.latitude || p.lat || 22.57,
        lng: p.location?.longitude || p.lng || 88.36,
        name: (p.name || 'Pandal').replace(/'/g, "\\'"),
        cluster: (p.cluster || p.region || '').replace(/'/g, "\\'"),
        isActive: idx === activeIndex,
      };
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { width: 100%; height: 100%; background: #FAF7F2; }
          .pin {
            font-weight: 900;
            font-size: 11px;
            width: 26px;
            height: 26px;
            border-radius: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
          }
          .pin-active {
            transform: scale(1.3);
            border-color: #F4C430 !important;
            box-shadow: 0 0 12px #903f00;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${sLat}, ${sLng}], 13);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

          // Render Polyline Casing & Core
          var pts = [${polyPoints}];
          if (pts.length > 1) {
            L.polyline(pts, { color: '#903f00', weight: 6, opacity: 0.8 }).addTo(map);
            L.polyline(pts, { color: '#ffedd5', weight: 3, opacity: 1.0 }).addTo(map);
            map.fitBounds(pts, { padding: [60, 60] });
          }

          // Start Marker (Gold ring)
          var startIcon = L.divIcon({
            html: '<div class="pin" style="background:#8a7a2e;color:#fff;">S</div>',
            iconSize: [26, 26], iconAnchor: [13, 13]
          });
          L.marker([${sLat}, ${sLng}], { icon: startIcon }).addTo(map).bindPopup('<b>Start: ${startPlace?.title || 'Origin'}</b>');

          // Destination Marker (Maroon pin)
          var endIcon = L.divIcon({
            html: '<div class="pin" style="background:#5a1512;color:#fff;">D</div>',
            iconSize: [26, 26], iconAnchor: [13, 13]
          });
          L.marker([${eLat}, ${eLng}], { icon: endIcon }).addTo(map).bindPopup('<b>Destination: ${endPlace?.title || 'Destination'}</b>');

          // Pandal Markers
          var pandals = ${JSON.stringify(markersJson)};
          pandals.forEach(function(p, i) {
            var cls = p.isActive ? 'pin pin-active' : 'pin';
            var bg = p.isActive ? '#b45309' : '#903f00';
            var icon = L.divIcon({
              html: '<div class="' + cls + '" style="background:' + bg + ';color:#ffedd5;">#' + p.idx + '</div>',
              iconSize: [26, 26], iconAnchor: [13, 13]
            });
            var m = L.marker([p.lat, p.lng], { icon: icon }).addTo(map);
            m.bindPopup('<b>#' + p.idx + ' ' + p.name + '</b><br/>' + p.cluster);
            if (p.isActive) m.openPopup();
          });
        </script>
      </body>
      </html>
    `;
  }, [startPlace, endPlace, polylineCoords, itinerary, activeIndex]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Puja Parikrama Route Planner" />
      <SideDrawer navigation={navigation} />

      <View style={styles.rootContainer}>
        {/* Fullscreen Map Layer */}
        {Platform.OS === 'web' ? (
          <View style={styles.webMapWrap}>
            <iframe
              srcDoc={leafletWebHtml}
              width="100%"
              height="100%"
              style={{ border: 0, width: '100%', height: '100%' }}
              title="Full Route Map"
            />
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            onPress={handleMapPress}
            initialRegion={{
              latitude: startPlace?.latitude || 22.5726,
              longitude: startPlace?.longitude || 88.3639,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
          >
            {/* Polyline Route Corridor Casing & Core */}
            {polylineCoords.length > 1 && (
              <>
                <Polyline
                  coordinates={polylineCoords}
                  strokeColor="#903f00"
                  strokeWidth={5}
                />
                <Polyline
                  coordinates={polylineCoords}
                  strokeColor="#ffedd5"
                  strokeWidth={2}
                />
              </>
            )}

            {/* Start Marker (Gold Ring) */}
            {startPlace && (
              <Marker
                coordinate={{
                  latitude: startPlace.latitude,
                  longitude: startPlace.longitude,
                }}
                title={`Start: ${startPlace.title || 'Origin'}`}
                pinColor="#8a7a2e"
                draggable
                onDragEnd={(e) => {
                  const coord = e.nativeEvent.coordinate;
                  setStartPlace((prev) => ({ ...prev, latitude: coord.latitude, longitude: coord.longitude }));
                }}
              />
            )}

            {/* Destination Marker (Maroon Pin) */}
            {endPlace && (
              <Marker
                coordinate={{
                  latitude: endPlace.latitude,
                  longitude: endPlace.longitude,
                }}
                title={`Destination: ${endPlace.title || 'Destination'}`}
                pinColor="#5a1512"
                draggable
                onDragEnd={(e) => {
                  const coord = e.nativeEvent.coordinate;
                  setEndPlace((prev) => ({ ...prev, latitude: coord.latitude, longitude: coord.longitude }));
                }}
              />
            )}

            {/* En-route Pandal Markers */}
            {itinerary.map((item, idx) => {
              const p = item.pandal;
              const lat = p.location?.latitude ?? p.lat;
              const lng = p.location?.longitude ?? p.lng;
              const isSelected = idx === activeIndex;

              if (!lat || !lng) return null;

              return (
                <Marker
                  key={p.id || p._id || `marker_${idx}`}
                  coordinate={{ latitude: lat, longitude: lng }}
                  title={`Stop #${item.step || idx + 1}: ${p.name}`}
                  description={p.cluster || p.region}
                  pinColor={isSelected ? '#b45309' : '#903f00'}
                  onPress={() => handleSelectCard(idx, item)}
                />
              );
            })}
          </MapView>
        )}

        {/* Top Floating Overlay: Route Input Card */}
        <View style={styles.topOverlayCard}>
          <FloatingRouteCard
            startText={startText}
            endText={endText}
            onStartChange={setStartText}
            onEndChange={setEndText}
            onSelectStartPlace={(place) => {
              if (place) {
                setStartPlace(place);
                setStartText(place.title);
              }
            }}
            onSelectEndPlace={(place) => {
              if (place) {
                setEndPlace(place);
                setEndText(place.title);
              }
            }}
            onSwap={handleSwap}
            onUseCurrentLocation={handleUseCurrentLocation}
            loading={loadingRoute || locating}
          />

          {/* Floating Route Summary Chip under top card */}
          {routePlan ? (
            <View style={{ marginTop: spacing.xs }}>
              <RouteSummaryChip
                distanceKm={routePlan.distanceKm}
                pandalsCount={routePlan.totalPandals || itinerary.length}
              />
            </View>
          ) : null}
        </View>

        {/* Bottom Horizontal Snapping Carousel */}
        <View style={styles.bottomCarouselWrap}>
          <PandalCarousel
            itinerary={itinerary}
            activeIndex={activeIndex}
            onSelectCard={handleSelectCard}
            loading={loadingRoute}
            navigation={navigation}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#faf7f2' },
  rootContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#faf7f2',
  },
  webMapWrap: {
    width: '100%',
    height: '100%',
    backgroundColor: '#faf7f2',
  },

  /* Top Overlay Card */
  topOverlayCard: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
  },

  /* Bottom Carousel Position */
  bottomCarouselWrap: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
