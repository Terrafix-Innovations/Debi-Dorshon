import React, { useState, useEffect, useRef } from 'react';

export default function SearchInput({ 
  type = 'origin', // 'origin' | 'dest'
  placeholder = 'Enter location...', 
  point, 
  onSelectPoint, 
  onClear,
  apiBaseUrl = 'http://localhost:8000'
}) {
  const [query, setQuery] = useState(point?.name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Sync text when external point changes
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

  // Debounced search via secure Backend Proxy
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || (point && trimmed === point.name)) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setSelectedIndex(-1);

    const timer = setTimeout(async () => {
      const cleanBase = (apiBaseUrl || 'http://localhost:8000').trim().replace(/\/+$/, '');
      let results = [];

      // 1. Query Secure Backend Autocomplete Endpoint
      try {
        const res = await fetch(`${cleanBase}/api/v1/route/autocomplete?q=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            results = data;
          }
        }
      } catch (err) {
        console.warn('Backend autocomplete endpoint unreachable, trying fallback search:', err);
      }

      // 2. Client-side fallback if backend is offline or returned empty
      if (results.length === 0) {
        try {
          const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=22.5726&lon=88.3639&limit=5`;
          const phRes = await fetch(photonUrl);
          if (phRes.ok) {
            const phData = await phRes.json();
            (phData.features || []).forEach((f, idx) => {
              const p = f.properties || {};
              const title = p.name || p.street || trimmed;
              const sub = [p.district, p.city, p.state].filter(Boolean).join(', ');
              results.push({
                id: `photon_${idx}`,
                title: title,
                subtitle: sub || 'Kolkata Region',
                latitude: f.geometry.coordinates[1],
                longitude: f.geometry.coordinates[0],
                category: 'place',
                badge: '📍 Place'
              });
            });
          }
        } catch (err) {
          // Both offline
        }
      }

      setSuggestions(results);
      setIsOpen(results.length > 0);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, point, apiBaseUrl]);

  const handleSelect = (item) => {
    setQuery(item.title);
    setIsOpen(false);
    onSelectPoint({
      latitude: item.latitude,
      longitude: item.longitude,
      name: item.title,
      subtitle: item.subtitle
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    onClear();
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isOrigin = type === 'origin';

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center">
        {/* Station/Point Tag (like MAS / SBC in reference image) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isOrigin 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80' 
              : 'bg-rose-50 text-rose-800 border border-rose-300/80'
          }`}>
            {isOrigin ? 'START' : 'END'}
          </span>
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-11 bg-surface-container-low/90 hover:bg-surface-container/80 border border-outline-variant/40 rounded-xl pl-16 pr-9 text-xs text-on-surface font-medium placeholder:text-on-surface-variant/50 focus:outline-none focus:bg-surface-container-lowest focus:border-primary/80 focus:ring-1 focus:ring-primary/40 transition-all shadow-xs"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors p-1 rounded-full text-xs"
            title="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-outline-variant/15">
          {loading && (
            <div className="p-3 text-xs text-on-surface-variant flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              Finding locations...
            </div>
          )}

          {!loading && suggestions.length === 0 && (
            <div className="p-3 text-xs text-on-surface-variant/70">
              No locations or pandals found in Kolkata
            </div>
          )}

          {!loading && suggestions.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <div
                key={item.id || idx}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`p-2.5 px-3.5 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                  isSelected ? 'bg-primary/10' : 'hover:bg-surface-container-low'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-on-surface truncate">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-on-surface-variant/70 truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>

                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant/80 shrink-0">
                  {item.badge}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
