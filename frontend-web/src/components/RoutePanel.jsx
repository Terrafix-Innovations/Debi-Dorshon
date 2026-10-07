import React, { useState, useEffect } from 'react';
import SearchInput from './SearchInput';

/**
 * Floating trip planner window:
 * Matches the reference design:
 * - Smooth rounded cream card with START / DESTINATION labels
 * - Left timeline rail with hollow olive-gold ring, pink connecting bar, and solid maroon location pin badge
 * - Input fields with leading pin icon, placeholder, and trailing crosshair / flag icons
 * - Auto-minimizes into a sleek compact bar when route is active to give maximum map viewing space
 */
const GOLD = '#7c6d28';   // START accent
const MAROON = '#6e1412'; // DESTINATION accent
const PINK = '#e8bec8';   // connector line

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
  hasRoute = false,
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Automatically minimize when a route is computed/shown
  useEffect(() => {
    if (hasRoute && origin && destination) {
      setIsMinimized(true);
    }
  }, [hasRoute]);

  // Auto-expand if user clears either origin or destination
  useEffect(() => {
    if (!origin || !destination) {
      setIsMinimized(false);
    }
  }, [origin, destination]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[82px] z-30 flex flex-col items-center px-3 sm:px-4 transition-all duration-300">
      {isMinimized ? (
        /* Minimized Compact Bar - gives maximum map visibility */
        <div
          onClick={() => setIsMinimized(false)}
          className="pointer-events-auto cursor-pointer relative flex items-center justify-between gap-2.5 w-full max-w-md bg-[#fefcf8]/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-[0_8px_25px_rgba(45,26,22,0.12)] border border-[#ebdcc9] hover:bg-white hover:border-[#caa774] transition-all animate-fade-in group"
          title="Click to expand and edit route"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Start indicator & text */}
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ border: `2.5px solid ${GOLD}`, background: '#fdfaf4' }}
            />
            <span className="text-xs font-bold text-[#2d1b18] truncate max-w-[110px] sm:max-w-[150px]">
              {origin?.name || 'Start Point'}
            </span>

            {/* Arrow separator */}
            <span className="text-stone-400 text-xs shrink-0 font-bold px-0.5">→</span>

            {/* Destination indicator & text */}
            <span
              className="w-3 h-3 rounded-full shrink-0 flex items-center justify-center"
              style={{ background: MAROON }}
            />
            <span className="text-xs font-bold text-[#2d1b18] truncate max-w-[110px] sm:max-w-[150px]">
              {destination?.name || 'Destination'}
            </span>
          </div>

          {/* Edit / Expand button */}
          <div className="shrink-0 flex items-center gap-1 text-[11px] font-extrabold text-[#903f00] bg-[#faeee4] group-hover:bg-[#f5e4d7] px-2.5 py-1 rounded-full transition-colors">
            <span>Edit</span>
            <svg className="w-3 h-3 text-[#903f00]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      ) : (
        /* Full Expanded Card */
        <div
          className="pointer-events-auto relative w-full max-w-md rounded-[28px] p-3 sm:p-3.5 shadow-[0_8px_30px_rgba(45,26,22,0.08)] border border-[#ebdcc9]/70 animate-slide-up"
          style={{ background: '#fefcf8' }}
        >
          {/* Header row with minimize button if route exists */}
          {hasRoute && (
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ebdcc9]/40">
              <span className="text-[11px] font-bold text-stone-500 tracking-wide uppercase">Route Planner</span>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#903f00] hover:text-[#6e1412] px-2.5 py-0.5 rounded-full hover:bg-stone-100 transition-colors"
                title="Minimize route card to view map"
              >
                <span>Minimize</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Inner decorative clip layer for corner flourishes */}
          <div className="pointer-events-none absolute inset-0 rounded-[28px] overflow-hidden">
            {/* Top-Right Golden Floral Vine Motif */}
            <div className="absolute -top-1 -right-1 w-20 h-20 opacity-45 overflow-hidden">
              <svg viewBox="0 0 80 80" fill="none" className="w-full h-full text-[#caa774]">
                <path d="M80 0 C60 5, 45 20, 42 45 C40 30, 52 14, 80 0 Z" fill="#d9be94" opacity="0.35" />
                <path d="M80 15 C65 20, 55 35, 52 55" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M80 30 C72 34, 66 44, 65 58" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
                <path d="M56 26 C50 20, 52 14, 58 16 C64 18, 62 24, 56 26 Z" fill="#caa774" opacity="0.4" />
                <path d="M68 38 C62 34, 63 28, 69 30 C75 32, 74 37, 68 38 Z" fill="#caa774" opacity="0.35" />
                <circle cx="45" cy="50" r="1.5" fill="currentColor" />
              </svg>
            </div>

            {/* Bottom-Right Maroon & Gold Lotus Petals Motif */}
            <div className="absolute -bottom-1 -right-1 w-20 h-16 overflow-hidden">
              <svg viewBox="0 0 80 64" fill="none" className="w-full h-full">
                <path
                  d="M80 64 C65 58, 52 48, 48 32 C58 35, 70 46, 80 64 Z"
                  fill="#7a1614"
                  stroke="#d4b27b"
                  strokeWidth="0.8"
                />
                <path
                  d="M80 64 C70 54, 62 42, 60 26 C68 30, 75 42, 80 64 Z"
                  fill="#99201d"
                  stroke="#d4b27b"
                  strokeWidth="0.8"
                />
                <path
                  d="M80 64 C76 50, 72 38, 70 18 C78 26, 80 40, 80 64 Z"
                  fill="#b32824"
                  stroke="#e2c89b"
                  strokeWidth="0.8"
                />
                <path
                  d="M48 48 C42 46, 40 40, 44 38 C48 36, 52 42, 48 48 Z"
                  fill="#caa774"
                  opacity="0.6"
                />
              </svg>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2.5">
            {/* Left rail: gold ring -> pink line -> maroon pin */}
            <div className="relative flex flex-col items-center self-stretch shrink-0 w-6 pt-[26px] pb-[13px]">
              {/* START marker: hollow gold ring */}
              <span
                className="relative z-10 w-[17px] h-[17px] rounded-full shrink-0"
                style={{ border: `3.5px solid ${GOLD}`, background: '#fdfaf4' }}
              />

              {/* Connector line: soft pink pill */}
              <span
                className="flex-1 my-1 w-[3px] rounded-full shrink-0"
                style={{ background: PINK }}
              />

              {/* DESTINATION marker: solid maroon circle with white pin inside */}
              <span
                className="relative z-10 w-[20px] h-[20px] rounded-full shrink-0 flex items-center justify-center shadow-sm"
                style={{ background: MAROON }}
              >
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </span>
            </div>

            {/* Fields column */}
            <div className="flex-1 min-w-0 flex flex-col gap-2.5">
              <div>
                <label
                  className="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5 leading-none"
                  style={{ color: GOLD }}
                >
                  START
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
                  className="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5 leading-none"
                  style={{ color: MAROON }}
                >
                  DESTINATION
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

            {/* Subtle vertical divider line */}
            <div className="w-[1px] self-stretch my-1 bg-[#ebdcc9]/70 shrink-0 ml-0.5" />

            {/* Swap button on the right */}
            <div className="shrink-0 flex items-center justify-center pl-0.5">
              <button
                type="button"
                onClick={onSwap}
                disabled={!origin && !destination}
                className="w-11 h-11 rounded-full flex items-center justify-center shadow-sm active:scale-95 disabled:opacity-40 transition-all bg-[#faeee4] hover:bg-[#f5e4d7]"
                title="Swap start & destination"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={MAROON}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 19V5M8 5L4.5 8.5M8 5l3.5 3.5" />
                  <path d="M16 5v14M16 19l-3.5-3.5M16 19l3.5-3.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Subtle inline indicator while the route auto-plans */}
          {loading && (
            <div className="mt-2.5 flex items-center justify-center gap-2 text-[12px] font-medium" style={{ color: MAROON }}>
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              <span>Finding route...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
