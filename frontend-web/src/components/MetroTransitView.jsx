import React, { useState, useEffect, useMemo, useRef } from 'react';

export default function MetroTransitView({
  apiBaseUrl = 'http://localhost:8000',
  onNavigateToPandal,
}) {
  const [activeTab, setActiveTab] = useState('metro'); // 'metro' | 'train'
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [pandals, setPandals] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingPandals, setLoadingPandals] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when tapping/clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Fetch stations for current mode (Metro vs Train)
  useEffect(() => {
    let isMounted = true;
    async function loadStations() {
      setLoadingStations(true);
      try {
        const cleanUrl = apiBaseUrl.trim().replace(/\/+$/, '');
        const endpoint = activeTab === 'metro'
          ? `${cleanUrl}/api/v1/transit/metro/stations`
          : `${cleanUrl}/api/v1/transit/train/stations`;

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setStations(data);
        }
      } catch (err) {
        console.warn('[MetroTransitView] Transit stations fetch error:', err.message);
      } finally {
        if (isMounted) setLoadingStations(false);
      }
    }

    // Reset all selection & input on tab change — user sees completely clean/empty state initially
    setSelectedStation(null);
    setSearchQuery('');
    setPandals([]);
    setIsOpen(false);

    loadStations();
    return () => { isMounted = false; };
  }, [activeTab, apiBaseUrl]);

  // Fetch pandals ONLY when a station is selected
  useEffect(() => {
    let isMounted = true;
    if (!selectedStation?.name) {
      setPandals([]);
      return;
    }

    async function loadPandals() {
      setLoadingPandals(true);
      try {
        const cleanUrl = apiBaseUrl.trim().replace(/\/+$/, '');
        const endpoint = activeTab === 'metro'
          ? `${cleanUrl}/api/v1/transit/metro/pandals?station_name=${encodeURIComponent(selectedStation.name)}`
          : `${cleanUrl}/api/v1/transit/train/pandals?station_name=${encodeURIComponent(selectedStation.name)}`;

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted) {
          setPandals(data?.pandals || []);
        }
      } catch (err) {
        console.warn('[MetroTransitView] Pandals fetch error:', err.message);
        if (isMounted) setPandals([]);
      } finally {
        if (isMounted) setLoadingPandals(false);
      }
    }

    loadPandals();
    return () => { isMounted = false; };
  }, [selectedStation?.name, activeTab, apiBaseUrl]);

  // Autocomplete matching stations as user types
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter((s) => s.name.toLowerCase().includes(q));
  }, [stations, searchQuery]);

  const handleSelectStation = (station) => {
    setSelectedStation(station);
    setSearchQuery(station.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedStation(null);
    setPandals([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div
      className="relative h-full w-full overflow-y-auto overscroll-contain pb-28 pt-20 px-3.5 sm:px-6 bg-cover bg-center bg-fixed touch-pan-y"
      style={{
        backgroundImage: "url('/kolkata_vintage_map.jpg')",
        backgroundColor: '#fbf7f0',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Translucent Warm Parchment Tint */}
      <div className="absolute inset-0 bg-[#fbf6ed]/90 pointer-events-none" />

      {/* Main Responsive Body Container (Where Is My Train layout style) */}
      <div className="relative z-10 max-w-md mx-auto space-y-3.5">
        
        {/* Sticky Top Header Controls for Seamless One-Handed Scrolling */}
        <div className="sticky top-0 z-30 pt-1 pb-2 bg-[#fbf6ed]/95 backdrop-blur-sm -mx-1 px-1 space-y-3">
          
          {/* 1. Metro / Train Segmented Bar */}
          <div className="flex bg-[#fffdf9] border border-[#ebdcc9] rounded-2xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('metro')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                activeTab === 'metro'
                  ? 'bg-[#903f00] text-white shadow-sm'
                  : 'text-[#564338] hover:text-[#903f00]'
              }`}
            >
              <span className="text-base">🚇</span>
              <span>Metro</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('train')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                activeTab === 'train'
                  ? 'bg-[#903f00] text-white shadow-sm'
                  : 'text-[#564338] hover:text-[#903f00]'
              }`}
            >
              <span className="text-base">🚆</span>
              <span>Train</span>
            </button>
          </div>

          {/* 2. Responsive Station Search Box (No Black Outline / Box on Tap) */}
          <div ref={dropdownRef} className="relative">
            <div
              className="relative flex items-center bg-[#fffdf9] border border-[#ebdcc9] rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-[#903f00]/30 focus-within:border-[#903f00] transition-all"
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            >
              <span className="pl-3.5 text-base text-[#903f00] pointer-events-none select-none">
                {activeTab === 'metro' ? '🚇' : '🚆'}
              </span>
              <input
                ref={inputRef}
                type="text"
                name="station-search-query"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => {
                  if (stations.length > 0) setIsOpen(true);
                }}
                placeholder={`Enter ${activeTab === 'metro' ? 'Metro' : 'Train'} station...`}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                className="w-full bg-transparent border-0 border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none py-3 pl-3 pr-10 text-sm font-bold text-[#1b1c1a] placeholder:text-[#9e9086] placeholder:font-normal"
                style={{
                  outline: 'none',
                  border: 'none',
                  boxShadow: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  WebkitAppearance: 'none',
                }}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 w-6 h-6 flex items-center justify-center text-xs text-[#9e9086] hover:text-[#1b1c1a] rounded-full transition-colors bg-transparent border-none outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                  title="Clear"
                >
                  ✕
                </button>
              ) : null}
            </div>

            {/* Optimized Autocomplete Dropdown List with Smooth Momentum Scrolling */}
            {isOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-1.5 bg-[#fffdfa] border border-[#ebdcc9] rounded-2xl shadow-xl max-h-80 overflow-y-auto overscroll-contain z-50 divide-y divide-[#ebdcc9]/50"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'thin',
                }}
              >
                {loadingStations ? (
                  <div className="p-3 text-xs text-[#705a4f] flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#903f00] border-t-transparent rounded-full animate-spin" />
                    <span>Loading stations...</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-3.5 text-xs text-[#705a4f] text-center">
                    No {activeTab === 'metro' ? 'metro' : 'train'} stations found
                  </div>
                ) : (
                  suggestions.map((st) => (
                    <div
                      key={st.name}
                      onClick={() => handleSelectStation(st)}
                      className="p-3 px-4 cursor-pointer hover:bg-[#f5ecdf] active:bg-[#ebdcc9] transition-colors flex items-center justify-between gap-2"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-[#1b1c1a] truncate">{st.name}</div>
                        {st.line && (
                          <div className="text-xs text-[#8c674b] mt-0.5">
                            {st.line.toLowerCase().includes('line') ? st.line : `${st.line} Line`}
                          </div>
                        )}
                        {st.division && (
                          <div className="text-xs text-[#8c674b] mt-0.5">{st.division}</div>
                        )}
                      </div>
                      {st.pandal_count !== undefined && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#f4e8d8] text-[#903f00] shrink-0">
                          {st.pandal_count} Pandals
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. Connected Pandals List Area — Smooth Scrolling & Responsive Cards */}
        {selectedStation ? (
          <div className="space-y-2 pt-0.5">
            {/* Header info bar */}
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#734320] truncate">
                Pandals near {selectedStation.name}
              </h3>
              <span className="text-xs font-bold text-[#903f00] shrink-0">
                {loadingPandals ? 'Loading...' : `${pandals.length} Pandals`}
              </span>
            </div>

            {loadingPandals ? (
              <div className="bg-[#fffdfa] rounded-2xl p-8 text-center border border-[#ebdcc9] shadow-xs">
                <div className="w-6 h-6 border-2 border-[#903f00] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#8c674b]">Loading connected pandals...</p>
              </div>
            ) : pandals.length > 0 ? (
              <div className="space-y-2">
                {pandals.map((pandal, idx) => {
                  const distanceStr = activeTab === 'metro'
                    ? (pandal.nearest_metro?.distance || 'Nearby')
                    : (pandal.nearest_stations?.[0]?.distance || 'Nearby');

                  return (
                    <div
                      key={pandal._id || pandal.id || idx}
                      className="bg-[#fffdfa] border border-[#ebdcc9] rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3 hover:border-[#903f00] transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#f4e8d8] text-[#903f00] font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h4 className="font-bold text-sm text-[#1b1c1a] truncate">
                            {pandal.name}
                          </h4>
                        </div>
                        <div className="pl-7 mt-1 flex items-center gap-1.5 text-xs text-[#705a4f] flex-wrap">
                          {pandal.cluster && (
                            <span className="font-medium truncate">{pandal.cluster}</span>
                          )}
                          {pandal.cluster && <span>•</span>}
                          <span className="text-[#903f00] font-bold">🚶 {distanceStr}</span>
                        </div>
                      </div>

                      {/* Clean Route Button: ">" that redirects to navigation and pops up exact pandal */}
                      <button
                        type="button"
                        onClick={() => onNavigateToPandal?.(pandal, selectedStation)}
                        className="w-9 h-9 rounded-xl bg-[#903f00] hover:bg-[#7a3500] active:scale-95 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs transition-transform"
                        style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                        title={`Navigate to ${pandal.name}`}
                      >
                        &gt;
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#fffdfa] rounded-2xl p-6 text-center border border-[#ebdcc9] text-xs text-[#705a4f]">
                No direct pandals found for {selectedStation.name}. Try another station.
              </div>
            )}
          </div>
        ) : (
          /* Clean empty initial prompt */
          <div className="pt-8 text-center text-xs text-[#8c674b] font-medium">
            Search or select a station above to view nearby pandals
          </div>
        )}

      </div>
    </div>
  );
}
