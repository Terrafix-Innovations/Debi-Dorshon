import React, { useState, useCallback, useEffect } from 'react';
import Layout from './components/Layout';
import SideDrawer from './components/SideDrawer';
import HomeScreen from './components/HomeScreen';
import NavigationScreen from './components/NavigationScreen';
import ProfileScreen from './components/ProfileScreen';
import MetroTransitView from './components/MetroTransitView';
import InfoModals from './components/InfoModals';
import MapBackground from './components/MapBackground';
import RoutePanel from './components/RoutePanel';
import PandalCarousel from './components/PandalCarousel';
import { useAuth } from './context/AuthContext';

const MAX_DETOUR_KM = 2.5;
const CAROUSEL_INSET = 200; // px reserved at bottom for carousel + tab bar

// Popular Route Presets resolved live via real-time OpenStreetMap transit & DB pandals
const POPULAR_PRESETS = {
  heritage: {
    originName: 'Sovabazar Metro Station',
    destinationName: 'Bagbazar Sarbojanin Durgotsav',
  },
  south_mega: {
    originName: 'Rabindra Sarobar Metro',
    destinationName: 'Ekdalia Evergreen Club',
  },
};

export default function App() {
  const { saveTrip, isAuthenticated, openAuthModal, apiBaseUrl } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePandal, setActivePandal] = useState(null);
  const [error, setError] = useState(null);
  const [navigationTargetPandal, setNavigationTargetPandal] = useState(null);
  const [isRouteSaved, setIsRouteSaved] = useState(false);

  // Side Drawer & Info Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'recommendations' | 'about' | 'contact' | 'privacy' | 'redeem' | null
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  const resetRoute = () => {
    setRouteData(null);
    setActivePandal(null);
    setError(null);
    setIsRouteSaved(false);
  };

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
    resetRoute();
  };

  const [mapSelectionMode, setMapSelectionMode] = useState(null);

  const handleMapClick = useCallback((lat, lng) => {
    if (!mapSelectionMode) return;
    const label = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    if (mapSelectionMode === 'origin' || mapSelectionMode === 'start') {
      setOrigin({ latitude: lat, longitude: lng, name: label });
      setMapSelectionMode(null);
    } else {
      setDestination({ latitude: lat, longitude: lng, name: label });
      setMapSelectionMode(null);
    }
    setRouteData(null);
    setActivePandal(null);
    setError(null);
  }, [mapSelectionMode]);

  const handleUseCurrentLocation = useCallback((field = 'origin') => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const curr = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          name: "My Current Location"
        };
        if (field === 'origin' || field === 'start') {
          setOrigin(curr);
        } else {
          setDestination(curr);
        }
      },
      (err) => setError("Unable to retrieve location: " + err.message)
    );
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
      const cleanUrl = (apiBaseUrl || 'https://debi-dorshon-backend.vercel.app').trim().replace(/\/+$/, '');
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

  // Auto-plan route when endpoints are set
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

  // Navigate directly to a pandal (from Home, Navigation, Metro, Profile)
  const handleNavigateToPandal = (pandal, station) => {
    if (!pandal) return;

    if (station && (station.latitude || station.location?.latitude)) {
      const lat = station.location?.latitude ?? station.latitude;
      const lng = station.location?.longitude ?? station.longitude;
      setOrigin({
        latitude: lat,
        longitude: lng,
        name: station.name ? `${station.name} Station` : 'Station',
      });
    }

    const lat = pandal.location?.latitude ?? pandal.lat;
    const lng = pandal.location?.longitude ?? pandal.lng;

    setDestination({
      latitude: lat,
      longitude: lng,
      name: pandal.name,
      cluster: pandal.cluster || pandal.region,
      nearest_metro: pandal.nearest_metro,
    });

    setActivePandal({
      ...pandal,
      location: { latitude: lat, longitude: lng },
    });

    setActiveTab('trips');
  };

  // Navigate from Metro / Train ">" button directly to Navigation Screen
  const handleMetroNavigateToPandal = (pandal) => {
    if (!pandal) return;
    setNavigationTargetPandal(pandal);
    setActiveTab('navigation');
  };

  // Select Popular Route Preset (North Kolkata Heritage, South Mega, etc.)
  const handleSelectPopularRoute = async (presetId) => {
    const preset = POPULAR_PRESETS[presetId];
    if (preset) {
      const cleanUrl = (apiBaseUrl || 'https://debi-dorshon-backend.vercel.app').trim().replace(/\/+$/, '');
      try {
        const [origRes, destRes] = await Promise.all([
          fetch(`${cleanUrl}/api/v1/route/autocomplete?q=${encodeURIComponent(preset.originName)}&limit=1`),
          fetch(`${cleanUrl}/api/v1/route/autocomplete?q=${encodeURIComponent(preset.destinationName)}&limit=1`),
        ]);
        const [origList, destList] = await Promise.all([origRes.json(), destRes.json()]);
        if (origList?.[0] && destList?.[0]) {
          setOrigin({
            latitude: origList[0].latitude,
            longitude: origList[0].longitude,
            name: origList[0].title,
          });
          setDestination({
            latitude: destList[0].latitude,
            longitude: destList[0].longitude,
            name: destList[0].title,
            cluster: destList[0].subtitle,
          });
        }
      } catch (err) {
        console.warn('Failed to resolve preset live coordinates:', err);
      }
      resetRoute();
      setActiveTab('trips');
    }
  };


  // Load Saved Trip from Profile
  const handleLoadSavedTrip = (trip) => {
    if (trip?.origin && trip?.destination) {
      setOrigin(trip.origin);
      setDestination(trip.destination);
      resetRoute();
      setActiveTab('trips');
    }
  };

  // Save current route (strictly gated for signed-in accounts)
  const handleSaveCurrentRoute = async () => {
    if (!origin || !destination) return;
    if (!isAuthenticated) {
      openAuthModal('Sign in with Google to save your custom Parikrama routes to your account.');
      return;
    }
    const success = await saveTrip({
      name: `${destination.name} Parikrama`,
      origin,
      destination,
      distanceKm,
      pandalCount: itinerary.length,
    });
    if (success !== false) {
      setIsRouteSaved(true);
      setSaveSuccessToast(true);
      setTimeout(() => setSaveSuccessToast(false), 3000);
    }
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onMenuClick={() => setIsDrawerOpen(true)}
        onProfileClick={() => setActiveTab('profile')}
      >
        {/* Screen Views by Active Tab */}
        {activeTab === 'home' && (
        <HomeScreen
          onNavigate={setActiveTab}
          onSelectPopularRoute={handleSelectPopularRoute}
        />
      )}

      {activeTab === 'navigation' && (
        <NavigationScreen
          apiBaseUrl={apiBaseUrl}
          targetPandal={navigationTargetPandal}
          onNavigateToPandal={handleNavigateToPandal}
        />
      )}

      {activeTab === 'metro' && (
        <MetroTransitView
          apiBaseUrl={apiBaseUrl}
          onNavigateToPandal={handleMetroNavigateToPandal}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileScreen
          onNavigateToPandal={handleNavigateToPandal}
          onNavigateToTrip={handleLoadSavedTrip}
        />
      )}

      {activeTab === 'trips' && (
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
            apiBaseUrl={apiBaseUrl}
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
            onChooseFromMap={setMapSelectionMode}
            onUseCurrentLocation={handleUseCurrentLocation}
            loading={loading}
            apiBaseUrl={apiBaseUrl}
            hasRoute={hasRoute}
          />

          {/* Map Selection Banner */}
          {mapSelectionMode && (
            <div className="absolute top-[32px] left-1/2 -translate-x-1/2 z-40 bg-[#6E1412]/95 text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-3 backdrop-blur-md animate-slide-up whitespace-nowrap">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-bold text-sm tracking-wide">
                Tap on map to select {mapSelectionMode === 'origin' || mapSelectionMode === 'start' ? 'Start Point' : 'Destination'}
              </span>
              <button onClick={() => setMapSelectionMode(null)} className="ml-2 bg-[#FAF0E6]/20 hover:bg-[#FAF0E6]/40 p-1 rounded-full transition-colors">
                <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Dedicated Aesthetic Save Button (Floats right above bottom carousel, leaving map 100% visible) */}
          {hasRoute && (
            <div className="pointer-events-none absolute inset-x-3 sm:inset-x-6 bottom-[204px] z-30 flex items-center justify-end">
              {/* Dedicated Aesthetic Save Route Action Pill */}
              <div className="pointer-events-auto animate-fade-in">
                <button
                  type="button"
                  onClick={handleSaveCurrentRoute}
                  className={`h-8 px-3.5 rounded-full border shadow-md font-extrabold text-xs flex items-center gap-1.5 active:scale-95 transition-all ${
                    isRouteSaved
                      ? 'bg-emerald-700 text-white border-emerald-600'
                      : 'bg-[#FFFDF8]/95 backdrop-blur-md border-[#E5D2A8] text-[#8E1B1B] hover:bg-[#FAF0E6]'
                  }`}
                  title="Save Route to Profile"
                >
                  <span>{isRouteSaved ? '✓' : '🔖'}</span>
                  <span>{isRouteSaved ? 'Saved to Profile' : 'Save Route'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Save Success Toast */}
          {saveSuccessToast && (
            <div className="pointer-events-none absolute inset-x-0 z-50 flex justify-center px-4 bottom-[248px]">
              <div className="pointer-events-auto rounded-full bg-emerald-700 text-white text-xs font-bold px-4 py-2 shadow-lg animate-fade-in flex items-center gap-1.5">
                <span>✓</span>
                <span>Route saved to your profile!</span>
              </div>
            </div>
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

    {/* Side Drawer Menu (From Hamburger) - Placed outside Layout for full unclipped overlay */}
    <SideDrawer
      isOpen={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      onNavigate={(tab) => {
        setActiveTab(tab);
        setIsDrawerOpen(false);
      }}
      onOpenModal={(modal) => {
        setActiveModal(modal);
        setIsDrawerOpen(false);
      }}
    />

    {/* Consolidated Info Modals */}
    <InfoModals
      activeModal={activeModal}
      onClose={() => setActiveModal(null)}
      onSwitchModal={(modal) => setActiveModal(modal)}
    />
  </>
  );
}
