import React, { createContext, useState, useContext, useEffect } from 'react';
import { getPujaGreeting, PUJA_DAYS_2026 } from '../utils/pujaCalendar';

const DrawerContext = createContext();

export function DrawerProvider({ children }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Calculate active day based on current date & time
  const [activePujaDay, setActivePujaDay] = useState(() => getPujaGreeting(new Date()));

  useEffect(() => {
    const updateGreeting = () => {
      setActivePujaDay(getPujaGreeting(new Date()));
    };

    updateGreeting();

    // Auto-update greeting based on current date & time every minute
    const intervalId = setInterval(updateGreeting, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  const pujaDays = [
    'শুভ শারদীয়া',
    'শুভ তৃতীয়া',
    'শুভ চতুর্থী',
    'শুভ পঞ্চমী',
    'শুভ ষষ্ঠী',
    'শুভ সপ্তমী',
    'শুভ মহাঅষ্টমী',
    'শুভ মহানবমী',
    'শুভ বিজয়া',
  ];

  return (
    <DrawerContext.Provider
      value={{
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        activePujaDay,
        setActivePujaDay,
        pujaDays,
        PUJA_DAYS_2026,
        getPujaGreeting,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  return useContext(DrawerContext);
}

