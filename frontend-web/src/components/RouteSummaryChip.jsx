import React from 'react';

/**
 * Compact, unobtrusive floating route summary pill:
 * Minimal height (~26px), highly polished glassmorphism, does not occupy map space.
 */
export default function RouteSummaryChip({ distanceKm = 0, pandalCount = 0 }) {
  const hoppingMins = Math.round(distanceKm * 15); // ~4 km/h walking pace

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#FFFDF8]/95 backdrop-blur-md border border-[#E5D2A8] shadow-[0_2px_10px_rgba(0,0,0,0.06)] px-3 py-1 select-none text-[11.5px] font-bold">
      <span className="flex items-center gap-1 text-[#8E1B1B]">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M9 6.75 15 4l6 2.75v12.5L15 22l-6-2.75L3 22V9.5L9 6.75Z" strokeLinejoin="round" />
          <path d="M9 6.75v12.5M15 4v12.5" strokeLinejoin="round" />
        </svg>
        <span>{distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : '--'}</span>
      </span>
      <span className="text-[#CAA774]">•</span>
      <span className="text-[#564338]">~{hoppingMins}m hopping</span>
      {pandalCount > 0 && (
        <>
          <span className="text-[#CAA774]">•</span>
          <span className="text-[#8E1B1B]">
            {pandalCount} {pandalCount === 1 ? 'pandal' : 'pandals'}
          </span>
        </>
      )}
    </div>
  );
}
