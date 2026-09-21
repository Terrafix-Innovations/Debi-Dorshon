import React from 'react';

export default function Navbar() {
  return (
    <header className="h-16 w-full px-6 lg:px-8 flex items-center justify-between border-b border-outline-variant/30 bg-surface/95 backdrop-blur-md z-40 flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-base shadow-sm">
          🪔
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline text-xl text-primary font-bold tracking-tight">
            Debi Dorshon
          </span>
          <span className="text-[11px] text-on-surface-variant/70 font-medium hidden sm:inline">
            Route &amp; Pandal Companion
          </span>
        </div>
      </div>
    </header>
  );
}
