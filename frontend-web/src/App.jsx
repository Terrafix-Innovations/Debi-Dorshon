import React, { useState, useCallback, useEffect } from 'react';
import Layout from './components/Layout';
import MapBackground from './components/MapBackground';
import RoutePanel from './components/RoutePanel';
import RouteSummaryChip from './components/RouteSummaryChip';
import PandalCarousel from './components/PandalCarousel';
import MetroTransitView from './components/MetroTransitView';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const MAX_DETOUR_KM = 2.5;
const CAROUSEL_INSET = 200; // px reserved at bottom for carousel + tab bar

export default function App() {
  const [activeTab, setActiveTab] = useState('trips');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePandal, setActivePandal] = useState(null);
  const [error, setError] = useState(null);

  const resetRoute = () => {
    setRouteData(null);
    setActivePandal(null);
    setError(null);
  };

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
    resetRoute();
  };

  const handleMapClick = useCallback((lat, lng) => {
    const label = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    setOrigin((prevOrigin) => {
      if (!prevOrigin) return { latitude: lat, longitude: lng, name: label };
      setDestination({ latitude: lat, longitude: lng, name: label });
      return prevOrigin;
    });
    setRouteData(null);
    setActivePandal(null);
    setError(null);
  }, []);

  const handleUpdateOrigin = useCallback((lat, lng) => {
    setOrigin((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      name: prev?.name && !prev.name.startsWith('Location')
        ? prev.name
        : `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    }));
    setRouteData(null);
    setActivePandal(null);
  }, []);

  const handleUpdateDestination = useCallback((lat, lng) => {
    setDestination((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      name: prev?.name && !prev.name.startsWith('Location')
        ? prev.name
        : `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    }));
    setRouteData(null);
    setActivePandal(null);
  }, []);

  const handlePlanRoute = useCallback(async () => {
    if (!origin || !destination) return;

    const dLat = Math.abs(origin.latitude - destination.latitude);
    const dLng = Math.abs(origin.longitude - destination.longitude);
    if (dLat < 0.0005 && dLng < 0.0005) {
      setError('Start and destination are too close together.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cleanUrl = API_BASE_URL.trim().replace(/\/+$/, '');
      const body = {
        origin: { latitude: origin.latitude, longitude: origin.longitude },
        destination: { latitude: destination.latitude, longitude: destination.longitude },
        max_detour_km: MAX_DETOUR_KM,
      };

      const res = await fetch(`${cleanUrl}/api/v1/route/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errJson.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setRouteData(data);
      setActivePandal(null);
    } catch (err) {
      setError(err.message || 'Failed to plan route.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [origin, destination]);

  // Auto-plan the route (Google Maps style) as soon as both start and
  // destination are set. Re-runs whenever either endpoint's coordinates
  // change (e.g. picking a new place or dragging a marker).
  useEffect(() => {
    if (origin && destination) {
      handlePlanRoute();
    }
  }, [
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
    handlePlanRoute,
  ]);

  const itinerary = routeData?.itinerary || [];
  const distanceKm = routeData?.estimated_distance_km || 0;
  const hasRoute = Boolean(routeData);

  const handleNavigateToPandal = (pandal, station) => {
    if (!pandal?.location) return;

    if (station) {
      const stationCoords = station.location || {
        latitude: station.latitude || 22.5179,
        longitude: station.longitude || 88.3437,
      };
      setOrigin({
        latitude: stationCoords.latitude,
        longitude: stationCoords.longitude,
        name: station.name,
      });
    }

    setDestination({
      latitude: pandal.location.latitude,
      longitude: pandal.location.longitude,
      name: pandal.name,
      cluster: pandal.cluster,
      nearest_metro: pandal.nearest_metro,
    });

    setActivePandal({
      ...pandal,
      location: pandal.location,
    });

    // Redirect to navigation tab
    setActiveTab('navigation');
  };

  return (
    <Layout activeTab={activeTab} onChangeTab={setActiveTab}>
      {activeTab === 'metro' ? (
        <MetroTransitView
          apiBaseUrl={API_BASE_URL}
          onNavigateToPandal={handleNavigateToPandal}
        />
      ) : (
        <>
          {/* Full-screen map background */}
          <MapBackground
            origin={origin}
            destination={destination}
            routeData={routeData}
            activePandal={activePandal}
            setActivePandal={setActivePandal}
            onMapClick={handleMapClick}
            onUpdateOrigin={handleUpdateOrigin}
            onUpdateDestination={handleUpdateDestination}
            bottomInset={CAROUSEL_INSET}
            apiBaseUrl={API_BASE_URL}
          />

          {/* Floating route card */}
          <RoutePanel
            origin={origin}
            destination={destination}
            onSelectOrigin={(pt) => { setOrigin(pt); resetRoute(); }}
            onSelectDestination={(pt) => { setDestination(pt); resetRoute(); }}
            onClearOrigin={() => { setOrigin(null); resetRoute(); }}
            onClearDestination={() => { setDestination(null); resetRoute(); }}
            onSwap={handleSwap}
            loading={loading}
            apiBaseUrl={API_BASE_URL}
          />

          {/* Floating route summary chip */}
          {hasRoute && (
            <RouteSummaryChip distanceKm={distanceKm} pandalCount={itinerary.length} />
          )}

          {/* Error toast */}
          {error && (
            <div className="pointer-events-none absolute inset-x-0 z-40 flex justify-center px-4" style={{ top: '254px' }}>
              <div className="pointer-events-auto rounded-full bg-rose-600 text-white text-xs font-semibold px-4 py-2 shadow-lg animate-fade-in">
                {error}
              </div>
            </div>
          )}

          {/* Bottom sliding pandal carousel */}
          <PandalCarousel
            itinerary={itinerary}
            activePandal={activePandal}
            onSelectPandal={setActivePandal}
            loading={loading}
            hasRoute={hasRoute}
          />
        </>
      )}
    </Layout>
  );
}

