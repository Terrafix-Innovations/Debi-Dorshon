import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import ItineraryPanel from './components/ItineraryPanel';
import './App.css';

const PRESETS = {
  ahiritola: {
    origin: { latitude: 22.596474, longitude: 88.353293, name: 'Ahiritola Ghat, Kolkata' },
    destination: { latitude: 22.618676, longitude: 88.373191, name: 'Maniktala More, Kolkata' },
    detour: 2.5
  },
  dumdum: {
    origin: { latitude: 22.620117, longitude: 88.391848, name: 'Dum Dum Metro Station' },
    destination: { latitude: 22.618676, longitude: 88.373191, name: 'Maniktala More, Kolkata' },
    detour: 2.5
  },
  bagbazar: {
    origin: { latitude: 22.603500, longitude: 88.368500, name: 'Bagbazar, Kolkata' },
    destination: { latitude: 22.573100, longitude: 88.364300, name: 'College Street, Kolkata' },
    detour: 2.0
  }
};

export default function App() {
  const [origin, setOrigin] = useState(PRESETS.ahiritola.origin);
  const [destination, setDestination] = useState(PRESETS.ahiritola.destination);
  const [maxDetour, setMaxDetour] = useState(2.5);
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:8000');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePandal, setActivePandal] = useState(null);

  // Check backend health on mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const cleanUrl = apiBaseUrl.trim().replace(/\/+$/, '');
        const res = await fetch(`${cleanUrl}/api/v1/health`);
        if (res.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    }
    checkHealth();
  }, [apiBaseUrl]);

  // Handle Preset selection
  const handleSelectPreset = (key) => {
    const p = PRESETS[key];
    if (!p) return;
    setOrigin(p.origin);
    setDestination(p.destination);
    setMaxDetour(p.detour);
    setRouteData(null);
    setActivePandal(null);
  };

  // Swap endpoints
  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setRouteData(null);
    setActivePandal(null);
  };

  // Handle Map Click
  const handleMapClick = (lat, lng) => {
    if (!origin) {
      setOrigin({ latitude: lat, longitude: lng, name: `Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
    } else if (!destination) {
      setDestination({ latitude: lat, longitude: lng, name: `Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
    } else {
      setDestination({ latitude: lat, longitude: lng, name: `Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
    }
    setRouteData(null);
  };

  // Plan Route API
  const handlePlanRoute = async () => {
    if (!origin || !destination) {
      alert('Please select both Origin and Destination');
      return;
    }

    setLoading(true);
    try {
      const cleanUrl = apiBaseUrl.trim().replace(/\/+$/, '');
      const body = {
        origin: {
          latitude: origin.latitude,
          longitude: origin.longitude
        },
        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude
        },
        max_detour_km: maxDetour
      };

      const res = await fetch(`${cleanUrl}/api/v1/route/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errJson.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setRouteData(data);
      setActivePandal(null);
    } catch (err) {
      alert(`Route Planning Error: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar 
        onSelectPreset={handleSelectPreset} 
        backendStatus={backendStatus} 
      />

      <div className="main-content">
        <ItineraryPanel
          origin={origin}
          destination={destination}
          onSelectOrigin={(pt) => { setOrigin(pt); setRouteData(null); }}
          onSelectDestination={(pt) => { setDestination(pt); setRouteData(null); }}
          onClearOrigin={() => { setOrigin(null); setRouteData(null); }}
          onClearDestination={() => { setDestination(null); setRouteData(null); }}
          onSwap={handleSwap}
          maxDetour={maxDetour}
          setMaxDetour={setMaxDetour}
          apiBaseUrl={apiBaseUrl}
          setApiBaseUrl={setApiBaseUrl}
          onPlanRoute={handlePlanRoute}
          loading={loading}
          routeData={routeData}
          activePandal={activePandal}
          setActivePandal={setActivePandal}
        />

        <MapView
          origin={origin}
          destination={destination}
          routeData={routeData}
          activePandal={activePandal}
          setActivePandal={setActivePandal}
          loading={loading}
          onMapClick={handleMapClick}
          onUpdateOrigin={(lat, lng) => setOrigin(prev => ({ ...prev, latitude: lat, longitude: lng }))}
          onUpdateDestination={(lat, lng) => setDestination(prev => ({ ...prev, latitude: lat, longitude: lng }))}
        />
      </div>
    </div>
  );
}
