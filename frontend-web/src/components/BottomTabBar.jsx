import React from 'react';

/**
 * Debi-Dorshon Bottom Navigation Tab Bar
 * 
 * Requirements:
 * 1. All tabs enabled.
 * 2. Inactive tabs: crisp black font color (#111111) like Home.
 * 3. Active tab: clearly distinct with cognac amber (#994800), bold font,
 *    soft pill background highlight, and an active indicator dot.
 */
const TABS = [
  {
    id: 'home',
    label: 'Home',
    enabled: true,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5L12 3l9 7.5V21H15v-6H9v6H3V10.5z" />
      </svg>
    ),
  },
  {
    id: 'navigation',
    label: 'Navigation',
    enabled: true,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
        <circle cx="12" cy="11" r="2.5" />
      </svg>
    ),
  },
  {
    id: 'trips',
    label: 'Trips',
    enabled: true,
    center: true,
    icon: (
      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-2 6 2V6l-6-2-6 2-6-2v12l6 2z" />
        <path d="M9 4v14M15 6v14" />
      </svg>
    ),
  },
  {
    id: 'metro',
    label: 'Metro/Train',
    enabled: true,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="15" rx="3" />
        <line x1="4" y1="11" x2="20" y2="11" />
        <circle cx="8" cy="15" r="1" fill="currentColor" />
        <circle cx="16" cy="15" r="1" fill="currentColor" />
        <path d="M8 18l-2 4M16 18l2 4M9 22h6" />
      </svg>
    ),
  },
  {
    id: 'redeem',
    label: 'Redeem',
    enabled: true,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4z" />
        <path d="M14.5 9.5l-5 5" />
        <circle cx="9.8" cy="9.8" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="14.2" cy="14.2" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export default function BottomTabBar({ activeTab = 'trips', onChangeTab }) {
  const center = TABS.find((t) => t.center);
  const sides = TABS.filter((t) => !t.center);
  const left = sides.slice(0, Math.ceil(sides.length / 2));
  const right = sides.slice(Math.ceil(sides.length / 2));

  const isCenterActive = activeTab === center.id;

  const renderTab = (tab) => {
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        type="button"
        disabled={!tab.enabled}
        onClick={() => tab.enabled && onChangeTab?.(tab.id)}
        className={`group relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all rounded-2xl ${
          isActive
            ? 'text-[#994800] bg-[#994800]/10 font-bold'
            : 'text-[#111111] hover:text-[#994800] hover:bg-black/[0.03] font-medium'
        }`}
      >
        <span className="flex items-center justify-center transition-transform group-active:scale-95">
          {tab.icon}
        </span>
        <span className={`text-[12px] leading-tight ${isActive ? 'font-bold text-[#994800]' : 'font-medium text-[#111111]'}`}>
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="absolute inset-x-0 bottom-0 z-40 select-none">
      {/* Light Cream Bottom Bar Shell */}
      <div className="relative w-full bg-[#fdfaf3] border-t border-[#ebdcc9]/70 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="relative z-10 w-full max-w-lg mx-auto flex items-center justify-around px-2 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))]">
          {left.map(renderTab)}

          {/* Center Prominent Elevated Trips Tab */}
          <div className="flex-1 flex justify-center -mt-6">
            <button
              type="button"
              onClick={() => onChangeTab?.(center.id)}
              className="flex flex-col items-center gap-0.5 active:scale-95 transition-transform"
            >
              {/* Outer Cream Halo Ring around the circular button */}
              <div className="p-1 rounded-full bg-[#fdfaf3]">
                {/* Round Button: Cognac Amber when active, warm dark slate when inactive */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isCenterActive
                      ? 'bg-[#994800] shadow-[0_4px_16px_rgba(153,72,0,0.35)] scale-105'
                      : 'bg-[#3d3732] hover:bg-[#2c2825] shadow-sm'
                  }`}
                >
                  {center.icon}
                </div>
              </div>

              {/* Trips Label */}
              <span className={`text-[12px] leading-tight ${isCenterActive ? 'font-bold text-[#994800]' : 'font-medium text-[#111111]'}`}>
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
