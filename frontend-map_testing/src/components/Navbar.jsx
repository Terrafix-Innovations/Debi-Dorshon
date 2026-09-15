import React from 'react';

export default function Navbar({ onSelectPreset, backendStatus }) {
  return (
    <header className="h-20 w-full px-6 lg:px-10 flex items-center justify-between gap-4 border-b border-outline-variant/40 bg-surface/95 backdrop-blur-md z-50 flex-shrink-0 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      {/* Brand */}
      <div className="flex items-center gap-3.5 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl shadow-sm">
          🪔
        </div>
        <div className="flex flex-col">
          <span className="font-headline text-2xl text-primary font-bold tracking-tight leading-none">
            Debi Dorshon
          </span>
          <span className="font-body text-[11px] text-on-surface-variant/80 tracking-wider mt-1 uppercase font-semibold">
            Sacred Route &amp; Pandal Companion
          </span>
        </div>
      </div>

      {/* Navigation Presets */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-outline text-neutral-500 mr-1">
          Quick Presets:
        </span>
        <button
          type="button"
          onClick={() => onSelectPreset('ahiritola')}
          className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/60 text-xs font-semibold text-on-surface transition-all hover:scale-105"
        >
          Ahiritola ➔ Maniktala
        </button>
        <button
          type="button"
          onClick={() => onSelectPreset('dumdum')}
          className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/60 text-xs font-semibold text-on-surface transition-all hover:scale-105"
        >
          Dum Dum ➔ Maniktala
        </button>
        <button
          type="button"
          onClick={() => onSelectPreset('bagbazar')}
          className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/60 text-xs font-semibold text-on-surface transition-all hover:scale-105"
        >
          Bagbazar ➔ College St
        </button>
      </div>

      {/* Right Controls: Backend Status & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Backend Status Pill */}
        <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 border text-xs font-medium shadow-sm transition-colors ${
          backendStatus === 'online' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : backendStatus === 'offline' 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            backendStatus === 'online' 
              ? 'bg-emerald-600 animate-pulse' 
              : backendStatus === 'offline' 
              ? 'bg-rose-600' 
              : 'bg-amber-500 animate-ping'
          }`}></span>
          <span className="font-semibold">
            {backendStatus === 'online' ? 'API Online' : backendStatus === 'offline' ? 'API Offline' : 'Checking...'}
          </span>
        </div>

        <div className="h-6 w-px bg-outline-variant/50 mx-1 hidden sm:block"></div>

        {/* Profile Avatar / Emblem */}
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shadow-sm font-headline text-sm font-semibold">
          DD
        </div>
      </div>
    </header>
  );
}
