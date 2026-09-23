import React, { createContext, useContext, useMemo, useState } from 'react';

const TripContext = createContext(null);

// Holds the in-progress Parikrama itinerary shared between the Trip tab
// (where stops are added/reordered) and the Route tab (where the full
// multi-stop path is calculated and displayed).
export function TripProvider({ children }) {
  const [stops, setStops] = useState([]); // { id, refId, type, name, lat, lng }

  const addStop = (stop) => setStops((prev) => [...prev, stop]);
  const removeStop = (id) => setStops((prev) => prev.filter((s) => s.id !== id));
  const reorderStops = (newOrder) => setStops(newOrder);
  const clearTrip = () => setStops([]);

  const value = useMemo(
    () => ({ stops, addStop, removeStop, reorderStops, clearTrip }),
    [stops]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within a TripProvider');
  return ctx;
}
