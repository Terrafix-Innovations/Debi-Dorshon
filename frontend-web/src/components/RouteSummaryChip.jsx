import React from 'react';

/**
 * Small floating pill showing distance and estimated hopping time,
 * matching the "5.4 km · ~35 min hopping time" chip in the reference.
 */
export default function RouteSummaryChip({ distanceKm = 0, pandalCount = 0 }) {
  const hoppingMins = Math.round(distanceKm * 15); // ~4 km/h walking pace

  return (
    <div className="pointer-events-none absolute inset-x-0 z-20 flex justify-center" style={{ top: '210px' }}>
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/40 shadow-lg px-4 py-2">
        <span className="flex items-center gap-1.5 text-[13px] font-bold text-primary">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 6.75 15 4l6 2.75v12.5L15 22l-6-2.75L3 22V9.5L9 6.75Z" strokeLinejoin="round" />
            <path d="M9 6.75v12.5M15 4v12.5" strokeLinejoin="round" />
          </svg>
          {distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : '--'}
        </span>
        <span className="text-outline-variant">·</span>
        <span className="text-[13px] font-semibold text-on-surface-variant">
          ~{hoppingMins} min hopping time
        </span>
        {pandalCount > 0 && (
          <>
            <span className="text-outline-variant">·</span>
            <span className="text-[13px] font-semibold text-on-surface-variant">
              {pandalCount} {pandalCount === 1 ? 'pandal' : 'pandals'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
