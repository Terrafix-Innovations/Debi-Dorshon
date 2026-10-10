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
import * as Location from 'expo-location';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import ScreenBackground from '../../components/common/ScreenBackground';
import FloatingRouteCard from '../../components/trip/FloatingRouteCard';

import PandalCarousel from '../../components/trip/PandalCarousel';
import { fetchRoutePlan } from '../../services/routeService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import InteractiveMapView from '../../components/map/InteractiveMapView';

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

export default function TripScreen({ navigation, route }) {
  // Origin and Destination state - initialized to null for manual entry
  const [startPlace, setStartPlace] = useState(null);
  const [endPlace, setEndPlace] = useState(null);
  const [startText, setStartText] = useState('');
  const [endText, setEndText] = useState('');

  // Read incoming navigation params (e.g. from RouteScreen "Plan Route Here")
  useEffect(() => {
    if (route?.params?.endPlace) {
      const ep = route.params.endPlace;
      setEndPlace(ep);
      setEndText(ep.title || ep.name || '');
    }
    if (route?.params?.startPlace) {
      const sp = route.params.startPlace;
      setStartPlace(sp);
      setStartText(sp.title || sp.name || '');
    }
  }, [route?.params]);

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

  const [locating, setLocating] = useState(false);
  const handleUseCurrentLocation = async (field = 'start') => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Needed',
          'Enable location access to use your current position.'
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
      
      if (field === 'start') {
        setStartPlace(curr);
        setStartText(curr.title);
      } else {
        setEndPlace(curr);
        setEndText(curr.title);
      }
    } catch (err) {
      console.warn('[TripScreen] Location fetch failed:', err);
      // Fallback for Web/failure
      const fallback = {
        id: 'curr_loc',
        title: 'My Current Location (Kolkata)',
        latitude: 22.5726,
        longitude: 88.3639,
      };
      if (field === 'start') {
        setStartPlace(fallback);
        setStartText(fallback.title);
      } else {
        setEndPlace(fallback);
        setEndText(fallback.title);
      }
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

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [mapSelectionMode, setMapSelectionMode] = useState(null); // 'start' | 'end' | null

  // Tap an empty point on the map to auto-assign Start (if empty) then Destination.
  const handleMapPress = (lat, lng) => {
    if (isSearchActive) {
      setIsSearchActive(false);
      Keyboard.dismiss();
      return;
    }

    if (mapSelectionMode === 'start') {
      const picked = {
        id: `map_${Date.now()}`,
        title: `Dropped Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        latitude: lat,
        longitude: lng,
      };
      setStartPlace(picked);
      setStartText(picked.title);
      setMapSelectionMode(null);
      try { Vibration.vibrate(15); } catch (err) { }
    } else if (mapSelectionMode === 'end') {
      const picked = {
        id: `map_${Date.now()}`,
        title: `Dropped Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        latitude: lat,
        longitude: lng,
      };
      setEndPlace(picked);
      setEndText(picked.title);
      setMapSelectionMode(null);
      try { Vibration.vibrate(15); } catch (err) { }
    }
  };

  const handleUpdateOrigin = (lat, lng) => {
    setStartPlace(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      title: `Dropped Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    }));
    setStartText(`Dropped Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  };

  const handleUpdateDestination = (lat, lng) => {
    setEndPlace(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      title: `Dropped Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    }));
    setEndText(`Dropped Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
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
        mapRef.current.animateToRegion({
          latitude: lat,
          longitude: lng,
        });
      } catch (e) { }
    }
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Puja Parikrama Route Planner" />
      <SideDrawer navigation={navigation} />

      <ScreenBackground>
        <View style={styles.rootContainer}>
        {/* Fullscreen Map Layer */}
        <InteractiveMapView
          ref={mapRef}
          origin={startPlace}
          destination={endPlace}
          routePath={routePlan?.path || []}
          itinerary={itinerary}
          selectedPlace={itinerary[activeIndex]?.pandal || null}
          onMapClick={handleMapPress}
          onUpdateOrigin={handleUpdateOrigin}
          onUpdateDestination={handleUpdateDestination}
          onSelectPlace={(place) => {
            // Find index in itinerary if it's a pandal
            const idx = itinerary.findIndex(item => (item.pandal?.id || item.pandal?._id) === (place.id || place._id));
            if (idx !== -1) {
              handleSelectCard(idx, itinerary[idx]);
            }
          }}
        />

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
              } else {
                setStartPlace(null);
                setStartText('');
              }
            }}
            onSelectEndPlace={(place) => {
              if (place) {
                setEndPlace(place);
                setEndText(place.title);
              } else {
                setEndPlace(null);
                setEndText('');
              }
            }}
            onSwap={handleSwap}
            onUseCurrentLocation={handleUseCurrentLocation}
            onSearchActiveChange={setIsSearchActive}
            onChooseFromMap={(field) => setMapSelectionMode(field)}
            loading={loadingRoute || locating}
            hasRoute={!!routePlan}
          />
        </View>

        {/* Map Selection Tooltip Banner */}
        {mapSelectionMode && (
          <View style={styles.mapSelectionBanner}>
            <Ionicons name="map" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.mapSelectionBannerText}>
              Tap on map to select {mapSelectionMode === 'start' ? 'Start Point' : 'Destination'}
            </Text>
            <TouchableOpacity onPress={() => setMapSelectionMode(null)} style={{ marginLeft: 'auto' }}>
              <Ionicons name="close-circle" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

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
      </ScreenBackground>
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
    zIndex: 50,
    elevation: 10,
  },

  /* Bottom Carousel Position */
  bottomCarouselWrap: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  /* Map Selection Banner */
  mapSelectionBanner: {
    position: 'absolute',
    top: 190,
    alignSelf: 'center',
    backgroundColor: 'rgba(110, 20, 18, 0.95)', // Maroon
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  mapSelectionBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 12,
  },
});
