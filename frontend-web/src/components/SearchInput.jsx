import React, { useState, useEffect, useRef } from 'react';

/**
 * Compact autocomplete search field used inside the floating route card.
 * Queries the secure backend proxy, with a client-side Photon fallback.
 */
export default function SearchInput({
  type = 'origin', // 'origin' | 'dest'
  placeholder = 'Enter location...',
  point,
  onSelectPoint,
  onClear,
  apiBaseUrl = 'https://debi-dorshon-backend.vercel.app',
}) {
  const [query, setQuery] = useState(point?.name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (point?.name) setQuery(point.name);
    else if (!point) setQuery('');
  }, [point]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      const cleanBase = (apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'https://debi-dorshon-backend.vercel.app').trim().replace(/\/+$/, '');
      let results = [];

      try {
        const res = await fetch(`${cleanBase}/api/v1/route/autocomplete?q=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) results = data;
        }
      } catch (err) {
        console.warn('Backend autocomplete unreachable, trying fallback:', err);
      }

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
                title,
                subtitle: sub || 'Kolkata Region',
                latitude: f.geometry.coordinates[1],
                longitude: f.geometry.coordinates[0],
                category: 'place',
                badge: '📍 Place',
              });
            });
          }
        } catch {
          // both offline
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
      subtitle: item.subtitle,
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
      setSelectedIndex((p) => (p < suggestions.length - 1 ? p + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((p) => (p > 0 ? p - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isOrigin = type === 'origin';

  return (
    <div className={`relative w-full ${isOpen ? 'z-40' : 'z-10'}`} ref={wrapperRef}>
      <div
        className="relative flex items-center h-[46px] rounded-2xl px-3 transition-shadow focus-within:ring-2 focus-within:ring-[#7c6d28]/25"
        style={{ background: '#f2ebde' }}
      >
        {/* Leading Location Pin Icon */}
        <span className="shrink-0 mr-2 text-[#9e9086] pointer-events-none">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="11" r="2.5" />
          </svg>
        </span>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-transparent border-0 py-0.5 pr-10 text-[14.5px] font-medium text-[#2d1b18] placeholder:text-[#9e9086] focus:outline-none focus:ring-0"
        />

        {/* Clear Button if input has text */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-[#9e9086] hover:text-[#2d1b18] transition-colors rounded-full text-[10px]"
            title="Clear"
          >
            ✕
          </button>
        )}

        {/* Trailing icon: locate crosshair for origin, flag for destination */}
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#9e9086]">
          {isOrigin ? (
            <svg className="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="7.5" />
              <line x1="12" y1="2" x2="12" y2="4.5" strokeLinecap="round" />
              <line x1="12" y1="19.5" x2="12" y2="22" strokeLinecap="round" />
              <line x1="2" y1="12" x2="4.5" y2="12" strokeLinecap="round" />
              <line x1="19.5" y1="12" x2="22" y2="12" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="22" x2="5" y2="3" strokeLinecap="round" />
              <path d="M5 4.5h12l-2 4 2 4H5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#fffdf9] border border-[#ebdcc9] rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-50 divide-y divide-[#ebdcc9]/40">
          {loading && (
            <div className="p-3 text-xs text-on-surface-variant flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              Finding locations...
            </div>
          )}

          {!loading && suggestions.length === 0 && (
            <div className="p-3 text-xs text-on-surface-variant/70">No locations or pandals found</div>
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
                  <div className="font-semibold text-xs text-on-surface truncate">{item.title}</div>
                  <div className="text-[11px] text-on-surface-variant/70 truncate mt-0.5">{item.subtitle}</div>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant/80 shrink-0">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
