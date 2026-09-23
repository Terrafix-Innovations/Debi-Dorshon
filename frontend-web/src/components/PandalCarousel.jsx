import React, { useRef, useEffect } from 'react';

/**
 * Bottom sheet with a horizontally sliding (left-to-right) list of
 * pandal cards. Selecting a card focuses it on the map, and the active
 * card auto-scrolls into view when changed from the map.
 */
export default function PandalCarousel({
  itinerary = [],
  activePandal,
  onSelectPandal,
  loading,
  hasRoute,
}) {
  const trackRef = useRef(null);
  const cardRefs = useRef({});

  // Auto-scroll active card into view (e.g. when tapped on the map)
  useEffect(() => {
    if (!activePandal) return;
    const node = cardRefs.current[activePandal.step];
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activePandal]);

  if (!hasRoute && !loading) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-[76px] z-20 flex justify-center px-4 pb-2">
        <div className="pointer-events-auto rounded-2xl bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/30 shadow-lg px-5 py-3 text-center">
          <p className="text-[13px] font-semibold text-on-surface">Plan a trip to see pandals</p>
          <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
            Pick a start and destination above
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[70px] z-20">
      {/* Header row */}
      <div className="pointer-events-auto flex items-center justify-between px-5 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🛕</span>
          <span className="text-[13px] font-bold text-on-surface drop-shadow-sm">
            Pandals on route
          </span>
          {itinerary.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary text-white shadow">
              {itinerary.length}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium text-on-surface-variant/70 flex items-center gap-1">
          swipe
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      {/* Sliding track */}
      <div
        ref={trackRef}
        className="pointer-events-auto carousel-track no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1"
      >
        {loading && itinerary.length === 0 && (
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="carousel-card shrink-0 w-64 h-[92px] rounded-2xl bg-surface-container-lowest/80 border border-outline-variant/30 animate-pulse"
            />
          ))
        )}

        {!loading && itinerary.length === 0 && (
          <div className="carousel-card shrink-0 w-full rounded-2xl bg-surface-container-lowest/95 border border-outline-variant/30 shadow-lg px-5 py-4 text-center">
            <p className="text-[13px] font-semibold text-on-surface">No pandals along this corridor</p>
            <p className="text-[11px] text-on-surface-variant/70 mt-0.5">Try widening the search or a different route.</p>
          </div>
        )}

        {itinerary.map((item) => {
          const { step, pandal, detour_distance_km } = item;
          const isActive = activePandal?.step === step;

          return (
            <button
              key={step}
              type="button"
              ref={(el) => { cardRefs.current[step] = el; }}
              onClick={() => onSelectPandal({ ...pandal, step, detour_distance_km })}
              className={`carousel-card shrink-0 w-64 text-left rounded-2xl border shadow-lg px-4 py-3 transition-all ${
                isActive
                  ? 'bg-primary text-white border-primary scale-[1.02]'
                  : 'bg-surface-container-lowest/97 backdrop-blur-md border-outline-variant/30 hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`w-7 h-7 shrink-0 rounded-full text-xs font-bold flex items-center justify-center ${
                    isActive ? 'bg-white text-primary' : 'bg-primary text-white'
                  }`}
                >
                  {step}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-on-surface'}`}>
                    {pandal.name}
                  </h3>
                  <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-on-surface-variant/75'}`}>
                    {pandal.region || 'Kolkata'}{pandal.cluster ? ` • ${pandal.cluster}` : ''}
                  </p>
                  <div className={`flex items-center gap-2 mt-1.5 text-[11px] font-medium ${isActive ? 'text-white/90' : 'text-on-surface-variant'}`}>
                    <span className={`font-mono ${isActive ? 'text-white' : 'text-primary'}`}>
                      +{detour_distance_km.toFixed(2)} km
                    </span>
                    {pandal.nearest_metro?.name && (
                      <>
                        <span>•</span>
                        <span className="truncate">🚇 {pandal.nearest_metro.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
