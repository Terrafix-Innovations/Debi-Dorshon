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
import RouteSummaryChip from './components/RouteSummaryChip';
import PandalCarousel from './components/PandalCarousel';
import { useAuth } from './context/AuthContext';

const MAX_DETOUR_KM = 2.5;
const CAROUSEL_INSET = 200; // px reserved at bottom for carousel + tab bar

// Popular Route Presets
const POPULAR_PRESETS = {
  heritage: {
    origin: {
      latitude: 22.5960,
      longitude: 88.3640,
      name: 'Sovabazar Metro Station',
    },
    destination: {
      latitude: 22.6020,
      longitude: 88.3610,
      name: 'Bagbazar Sarbojanin Durgotsav',
      cluster: 'North Kolkata',
    },
  },
  south_mega: {
    origin: {
      latitude: 22.5082,
      longitude: 88.3458,
      name: 'Rabindra Sarobar Metro',
    },
    destination: {
      latitude: 22.5180,
      longitude: 88.3685,
      name: 'Ekdalia Evergreen Club',
      cluster: 'South Kolkata',
    },
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

    if (station) {
      const stationCoords = station.location || {
        latitude: station.latitude || 22.5179,
        longitude: station.longitude || 88.3437,
      };
      setOrigin({
        latitude: stationCoords.latitude,
        longitude: stationCoords.longitude,
        name: station.name || 'Station',
      });
    } else if (!origin) {
      // If no start location set yet, default to central Kolkata or nearest point
      setOrigin({
        latitude: 22.5726,
        longitude: 88.3639,
        name: 'Kolkata City Center',
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
  const handleSelectPopularRoute = (presetId) => {
    const preset = POPULAR_PRESETS[presetId];
    if (preset) {
      setOrigin(preset.origin);
      setDestination(preset.destination);
      resetRoute();
      setActiveTab('trips');
    }
  };

  // Select Recommendation from Modal
  const handleSelectRecommendation = (rec) => {
    if (rec.origin && rec.destination) {
      setOrigin(rec.origin);
      setDestination(rec.destination);
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
            loading={loading}
            apiBaseUrl={apiBaseUrl}
          />

          {/* Dedicated Aesthetic Save Button & Compact Summary Bar (Floats right above bottom carousel, leaving map 100% visible) */}
          {hasRoute && (
            <div className="pointer-events-none absolute inset-x-3 sm:inset-x-6 bottom-[204px] z-30 flex items-center justify-between">
              {/* Sleek, mini Route Summary Pill */}
              <div className="pointer-events-auto animate-fade-in">
                <RouteSummaryChip distanceKm={distanceKm} pandalCount={itinerary.length} />
              </div>

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
      onSelectRecommendation={handleSelectRecommendation}
    />
  </>
  );
}
