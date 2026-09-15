import React, { useState, useEffect, useRef } from 'react';

export default function SearchInput({ 
  type = 'origin', // 'origin' | 'dest'
  label, 
  placeholder, 
  point, 
  onSelectPoint, 
  onClear 
}) {
  const [query, setQuery] = useState(point?.name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Sync internal text when external point changes
  useEffect(() => {
    if (point?.name) {
      setQuery(point.name);
    } else if (!point) {
      setQuery('');
    }
  }, [point]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Nominatim Geocoding
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || (point && trimmed === point.name)) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&viewbox=88.15,22.75,88.55,22.35&bounded=0&limit=6&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setSuggestions(data || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Nominatim search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, point]);

  const handleSelect = (item) => {
    const title = item.name || item.display_name.split(',')[0];
    setQuery(title);
    setIsOpen(false);
    onSelectPoint({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      name: title
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onClear();
  };

  const isOrigin = type === 'origin';

  return (
    <div className="relative flex flex-col gap-1" ref={wrapperRef}>
      <div className="flex items-center gap-3">
        {/* Stitch Badge (S or E) */}
        <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center shrink-0 shadow-sm text-xs z-10 ${
          isOrigin 
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
            : 'bg-rose-100 text-rose-800 border border-rose-300'
        }`}>
          {isOrigin ? 'S' : 'E'}
        </div>

        {/* Input Wrapper */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full bg-surface-container-low/90 border border-outline-variant/60 rounded-lg px-3.5 py-2.5 text-xs text-on-surface font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-8 shadow-sm"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors text-xs p-1"
              title="Clear"
            >
              ✕
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-outline-variant/20">
              {loading && (
                <div className="p-3 text-xs text-on-surface-variant flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  Searching sacred locations...
                </div>
              )}
              {!loading && suggestions.length === 0 && (
                <div className="p-3 text-xs text-on-surface-variant">
                  No places found in Kolkata
                </div>
              )}
              {!loading && suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(item)}
                  className="p-3 hover:bg-surface-container-low cursor-pointer transition-colors"
                >
                  <div className="font-semibold text-xs text-on-surface">
                    {item.name || item.display_name.split(',')[0]}
                  </div>
                  <div className="text-[11px] text-on-surface-variant/80 truncate mt-0.5">
                    {item.display_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lat/Lng readout */}
      <div className="ml-11 text-[10px] text-on-surface-variant/70 font-mono flex items-center gap-2">
        <span>Lat: <strong className="text-primary font-semibold">{point ? point.latitude.toFixed(5) : '--'}</strong></span>
        <span>•</span>
        <span>Lng: <strong className="text-primary font-semibold">{point ? point.longitude.toFixed(5) : '--'}</strong></span>
      </div>
    </div>
  );
}
