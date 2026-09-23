import React from 'react';

const TABS = [
  {
    id: 'home',
    label: 'Home',
    enabled: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3.2 3 10.4V21h6v-6h6v6h6V10.4L12 3.2z" />
      </svg>
    ),
  },
  {
    id: 'navigation',
    label: 'Navigation',
    enabled: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="11" r="2.4" />
      </svg>
    ),
  },
  {
    id: 'trips',
    label: 'Trips',
    enabled: true,
    center: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 6.75 15 4l6 2.75v12.5L15 22l-6-2.75L3 22V9.5L9 6.75Z" strokeLinejoin="round" />
        <path d="M9 6.75v12.5M15 4v12.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'metro',
    label: 'Metro/Train',
    enabled: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="3" width="14" height="14" rx="3" />
        <path d="M5 11h14M8 21l2-4M16 21l-2-4M9 7h6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="14.5" r="0.6" fill="currentColor" />
        <circle cx="15.5" cy="14.5" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'redeem',
    label: 'Redeem',
    enabled: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 8V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4z" strokeLinejoin="round" />
        <path d="M14.5 9.5l-5 5" strokeLinecap="round" />
        <circle cx="9.8" cy="9.8" r="0.5" fill="currentColor" />
        <circle cx="14.2" cy="14.2" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
];

export default function BottomTabBar({ activeTab = 'trips', onChangeTab }) {
  // Reorder so the enabled center tab sits in the middle prominently.
  const center = TABS.find((t) => t.center);
  const sides = TABS.filter((t) => !t.center);
  const left = sides.slice(0, Math.ceil(sides.length / 2));
  const right = sides.slice(Math.ceil(sides.length / 2));

  const renderTab = (tab) => {
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        type="button"
        disabled={!tab.enabled}
        onClick={() => tab.enabled && onChangeTab?.(tab.id)}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
          tab.enabled
            ? isActive
              ? 'text-primary'
              : 'text-on-surface-variant hover:text-on-surface'
            : 'text-on-surface-variant/30 cursor-not-allowed'
        }`}
      >
        <span className="w-6 h-6">{tab.icon}</span>
        <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
      </button>
    );
  };

  return (
    <nav className="absolute inset-x-0 bottom-0 z-40">
      <div className="relative w-full">
        <div
          className="flex items-end justify-around border-t border-black/5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))]"
          style={{ background: '#fdfaf4' }}
        >
          {left.map(renderTab)}

          {/* Center prominent Trips tab */}
          <div className="flex-1 flex justify-center -mt-6">
            <button
              type="button"
              onClick={() => onChangeTab?.(center.id)}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 transition-transform active:scale-95 ${
                  activeTab === center.id ? 'bg-primary text-white' : 'bg-primary/80 text-white'
                }`}
                style={{ borderColor: '#fdfaf4' }}
              >
                <span className="w-7 h-7">{center.icon}</span>
              </span>
              <span className={`text-[10px] ${activeTab === center.id ? 'font-bold text-primary' : 'font-medium text-on-surface-variant'}`}>
                {center.label}
              </span>
            </button>
          </div>

          {right.map(renderTab)}
        </div>
      </div>
    </nav>
  );
}
