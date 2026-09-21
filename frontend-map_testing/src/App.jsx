import React, { useState } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import ItineraryPanel from './components/ItineraryPanel';
import './App.css';

export default function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [maxDetour, setMaxDetour] = useState(2.5);
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:8000');
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePandal, setActivePandal] = useState(null);

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
      setOrigin({ latitude: lat, longitude: lng, name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
    } else if (!destination) {
      setDestination({ latitude: lat, longitude: lng, name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
    } else {
      setDestination({ latitude: lat, longitude: lng, name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
    }
    setRouteData(null);
  };

  // Handle Drag Updates
  const handleUpdateOrigin = (lat, lng) => {
    setOrigin(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      name: prev?.name?.startsWith('Location') ? `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` : prev?.name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    }));
    setRouteData(null);
    setActivePandal(null);
  };

  const handleUpdateDestination = (lat, lng) => {
    setDestination(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      name: prev?.name?.startsWith('Location') ? `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` : prev?.name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    }));
    setRouteData(null);
    setActivePandal(null);
  };

  // Plan Route API
  const handlePlanRoute = async () => {
    if (!origin || !destination) {
      alert('Please select both Start and End locations');
      return;
    }

    const dLat = Math.abs(origin.latitude - destination.latitude);
    const dLng = Math.abs(origin.longitude - destination.longitude);
    if (dLat < 0.0005 && dLng < 0.0005) {
      alert('Start and destination locations are identical or too close together. Please select distinct locations.');
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
      <Navbar />

      <div className="main-content">
        <ItineraryPanel
          origin={origin}
          destination={destination}
          onSelectOrigin={(pt) => { setOrigin(pt); setRouteData(null); setActivePandal(null); }}
          onSelectDestination={(pt) => { setDestination(pt); setRouteData(null); setActivePandal(null); }}
          onClearOrigin={() => { setOrigin(null); setRouteData(null); setActivePandal(null); }}
          onClearDestination={() => { setDestination(null); setRouteData(null); setActivePandal(null); }}
          onSwap={handleSwap}
          maxDetour={maxDetour}
          setMaxDetour={(val) => { setMaxDetour(val); setRouteData(null); setActivePandal(null); }}
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
          onUpdateOrigin={handleUpdateOrigin}
          onUpdateDestination={handleUpdateDestination}
          apiBaseUrl={apiBaseUrl}
        />
      </div>
    </div>
  );
}
