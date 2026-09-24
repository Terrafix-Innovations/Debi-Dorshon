import React from 'react';
import SearchInput from './SearchInput';

/**
 * Floating trip planner window (matches the reference design):
 * a cream rounded card with a START / DESTINATION timeline rail,
 * beige boxed autocomplete fields with colored labels, and a
 * circular swap button on the right. Floats above the map.
 */
const GOLD = '#8a7a2e';   // START accent
const MAROON = '#5a1512'; // DESTINATION accent
const PINK = '#e7bcc6';   // connector line

export default function RoutePanel({
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  onClearOrigin,
  onClearDestination,
  onSwap,
  loading,
  apiBaseUrl,
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center px-3 pt-3">
      {/* Cream floating card */}
      <div
        className="pointer-events-auto w-full max-w-md rounded-3xl px-3 py-3 shadow-xl border"
        style={{ background: '#fdfaf4', borderColor: 'rgba(0,0,0,0.05)' }}
      >
        <div className="flex items-stretch gap-2.5">
          {/* Left rail: gold ring -> pink line -> maroon pin */}
          <div className="relative flex flex-col items-center self-stretch">
            {/* START marker: hollow gold ring (aligned to first field) */}
            <span
              className="relative z-10 mt-[26px] w-[15px] h-[15px] rounded-full"
              style={{ border: `3.5px solid ${GOLD}`, background: '#fdfaf4' }}
            />
            {/* Connector line */}
            <span className="flex-1 my-1 w-[2.5px] rounded-full" style={{ background: PINK }} />
            {/* DESTINATION marker: filled maroon pin (aligned to second field) */}
            <span
              className="relative z-10 mb-[10px] w-[19px] h-[19px] rounded-full flex items-center justify-center"
              style={{ background: MAROON }}
            >
              <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6">
                <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="11" r="1.6" fill="#fff" stroke="none" />
              </svg>
            </span>
          </div>

          {/* Fields column with compact labels above */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div>
              <label
                className="block text-[10px] font-bold uppercase tracking-wide mb-0.5 leading-none"
                style={{ color: GOLD }}
              >
                Start
              </label>
              <SearchInput
                type="origin"
                placeholder="Choose start location"
                point={origin}
                onSelectPoint={onSelectOrigin}
                onClear={onClearOrigin}
                apiBaseUrl={apiBaseUrl}
              />
            </div>
            <div>
              <label
                className="block text-[10px] font-bold uppercase tracking-wide mb-0.5 leading-none"
                style={{ color: MAROON }}
              >
                Destination
              </label>
              <SearchInput
                type="dest"
                placeholder="Choose destination"
                point={destination}
                onSelectPoint={onSelectDestination}
                onClear={onClearDestination}
                apiBaseUrl={apiBaseUrl}
              />
            </div>
          </div>

          {/* Swap button */}
          <button
            type="button"
            onClick={onSwap}
            disabled={!origin && !destination}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm active:scale-95 disabled:opacity-40 transition-all"
            style={{ background: '#f2ece1' }}
            title="Swap start & destination"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={MAROON} strokeWidth="2.2">
              <path d="M8 4v16M8 4L5 7.5M8 4l3 3.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 20V4M16 20l3-3.5M16 20l-3-3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Subtle inline indicator while the route auto-plans */}
        {loading && (
          <div className="mt-2 flex items-center justify-center gap-2 text-[12px] font-medium" style={{ color: MAROON }}>
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            <span>Finding route...</span>
          </div>
        )}
      </div>
    </div>
  );
}
