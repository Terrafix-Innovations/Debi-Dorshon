import React from 'react';

export default function HomeScreen({
  onNavigate,
  onSelectPopularRoute,
}) {
  return (
    <div className="relative h-full w-full overflow-y-auto no-scrollbar pt-24 pb-32 px-4 sm:px-6 max-w-2xl mx-auto">
      {/* 1. Hero Title & Subtext */}
      <div className="mt-2 mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E1B1B]/10 text-[#8E1B1B] text-xs font-black tracking-wide mb-2 uppercase">
          <span>🪷</span>
          <span>Debi Dorshon (দেবী দর্শন)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3D241B] tracking-tight leading-tight font-serif">
          Debi Dorshon<br />
          <span className="text-xl sm:text-2xl text-[#8E1B1B] font-sans font-bold">Puja Parikrama Guide</span>
        </h1>
        <p className="text-[14.5px] text-[#765C51] mt-2 font-medium leading-relaxed">
          Welcome to Debi Dorshon. Discover pandals, find the best routes, and explore Kolkata with ease.
        </p>
      </div>

      {/* 2. THE STAR: Quick-Entry Trip Planner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#FFFDF8] border-[1.2px] border-[#E5D2A8] p-5 mb-6 shadow-[0_6px_20px_rgba(61,36,27,0.07)]">
        {/* Subtle Kolkata Map Contour Background Watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg width="100%" height="100%" viewBox="0 0 320 180" fill="none" preserveAspectRatio="none">
            <path
              d="M-20 40 Q80 20 140 70 T300 50 T360 120"
              stroke="#EADBCC"
              strokeWidth="2.2"
              strokeDasharray="4 6"
              opacity="0.5"
            />
            <path
              d="M20 140 Q100 90 180 130 T340 100"
              stroke="#EADBCC"
              strokeWidth="1.8"
              opacity="0.35"
            />
            <circle cx="230" cy="58" r="3" fill="#D8A52B" opacity="0.6" />
            <circle cx="120" cy="115" r="3" fill="#8E1B1B" opacity="0.5" />
          </svg>
        </div>

        {/* Card Header Tag */}
        <div className="relative z-10 flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-1.5 text-[#8E1B1B]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            <span className="text-[11px] font-extrabold tracking-wider uppercase">
              Plan Your Puja Trip
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#856E63]">
            Kolkata Corridor
          </span>
        </div>

        {/* Location Inputs with Visual Timeline Rail */}
        <div className="relative z-10 flex items-center mb-3">
          {/* Timeline Rail */}
          <div className="flex flex-col items-center justify-center mr-3 w-5">
            <div className="w-3.5 h-3.5 rounded-full border-[3px] border-[#D8A52B] bg-[#FFFDF8]" />
            <div className="w-[2px] h-8 bg-[#E5D2A8] my-1 rounded" />
            <div className="w-4 h-4 rounded-full bg-[#8E1B1B] flex items-center justify-center text-white text-[9px] font-bold">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
          </div>

          {/* Inputs Column */}
          <div className="flex-1 space-y-2">
            <button
              type="button"
              onClick={() => onNavigate('trips')}
              className="w-full h-11 flex items-center justify-between px-3.5 rounded-2xl bg-[#FAF5ED] border border-[#E5D2A8]/70 text-left hover:border-[#8E1B1B]/40 transition-colors"
            >
              <div className="flex items-center gap-2.5 text-[#8A7B6E] text-[13px] font-medium">
                <svg className="w-4 h-4 text-[#8A7B6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
                <span>Choose Start Location</span>
              </div>
              <span className="text-[#D8A52B] text-sm">🎯</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('trips')}
              className="w-full h-11 flex items-center justify-between px-3.5 rounded-2xl bg-[#FAF5ED] border border-[#E5D2A8]/70 text-left hover:border-[#8E1B1B]/40 transition-colors"
            >
              <div className="flex items-center gap-2.5 text-[#8A7B6E] text-[13px] font-medium">
                <svg className="w-4 h-4 text-[#8A7B6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
                <span>Choose Destination</span>
              </div>
              <span className="text-[#8E1B1B] text-sm">🚩</span>
            </button>
          </div>
        </div>

        {/* Visual Concept Flow */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 py-1 mb-3.5 text-[11px] font-semibold text-[#9C8275]">
          <span>Start Location</span>
          <span className="text-[#D8A52B] font-bold">→</span>
          <span>Destination</span>
          <span className="text-[#D8A52B] font-bold">→</span>
          <span>Route</span>
          <span className="text-[#D8A52B] font-bold">→</span>
          <span className="text-[#8E1B1B] font-bold">Pandals</span>
        </div>

        {/* Find My Route CTA Button */}
        <button
          type="button"
          onClick={() => onNavigate('trips')}
          className="relative z-10 w-full h-12 rounded-2xl bg-gradient-to-r from-[#8E1B1B] to-[#771313] hover:from-[#9E2020] hover:to-[#871818] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(142,27,27,0.3)] active:scale-[0.98] transition-all"
        >
          <span>Find My Route</span>
          <span className="text-[#F4D388] text-lg leading-none font-bold">→</span>
        </button>
      </div>

      {/* 3. Quick Access Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#3D241B] font-serif mb-3">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 gap-3.5">
          {/* Card 1: Metro & Train */}
          <button
            type="button"
            onClick={() => onNavigate('metro')}
            className="flex flex-col text-left p-4 rounded-2xl bg-[#FFFDF8] border border-[#E5D2A8] shadow-sm hover:shadow-md hover:border-[#8E1B1B]/40 active:scale-[0.98] transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FAF0E6] flex items-center justify-center text-[#8E1B1B] mb-2.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="3" width="16" height="15" rx="3" />
                <line x1="4" y1="11" x2="20" y2="11" />
                <circle cx="8" cy="15" r="1" fill="currentColor" />
                <circle cx="16" cy="15" r="1" fill="currentColor" />
                <path d="M8 18l-2 4M16 18l2 4M9 22h6" />
              </svg>
            </div>
            <h3 className="font-extrabold text-[#3D241B] text-[14.5px]">
              Metro & Train
            </h3>
            <p className="text-[11.5px] text-[#856E63] mt-0.5 font-medium">
              Find nearby pandals
            </p>
          </button>

          {/* Card 2: Pandal Directory */}
          <button
            type="button"
            onClick={() => onNavigate('navigation')}
            className="flex flex-col text-left p-4 rounded-2xl bg-[#FFFDF8] border border-[#E5D2A8] shadow-sm hover:shadow-md hover:border-[#8E1B1B]/40 active:scale-[0.98] transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FAF0E6] flex items-center justify-center text-[#8E1B1B] mb-2.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 8v12h20V8L12 2z" />
                <path d="M12 9a3 3 0 0 0-3 3v8h6v-8a3 3 0 0 0-3-3z" />
              </svg>
            </div>
            <h3 className="font-extrabold text-[#3D241B] text-[14.5px]">
              Pandal Directory
            </h3>
            <p className="text-[11.5px] text-[#856E63] mt-0.5 font-medium">
              Explore pandals by area
            </p>
          </button>
        </div>
      </div>

      {/* 4. Popular Routes Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-[#3D241B] font-serif">
            Popular Routes
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('trips')}
            className="text-[13px] font-bold text-[#8E1B1B] hover:underline"
          >
            View All →
          </button>
        </div>

        {/* Route Card 1: North Kolkata Heritage Circuit */}
        <button
          type="button"
          onClick={() => onSelectPopularRoute?.('heritage')}
          className="w-full flex items-center p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#E5D2A8] shadow-sm hover:shadow-md hover:border-[#8E1B1B]/40 active:scale-[0.99] transition-all mb-2.5 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FAEEE5] flex items-center justify-center text-[#8E1B1B] mr-3 flex-shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M14 10v11M12 2L2 7h20L12 2z" />
            </svg>
          </div>
          <div className="flex-1 pr-2">
            <h4 className="font-extrabold text-[14px] text-[#3D241B]">
              North Kolkata Heritage Circuit
            </h4>
            <p className="text-[11.5px] text-[#856E63] font-medium mt-0.5">
              6 Pandals • 4.2 km • 2.5 hrs
            </p>
          </div>
          <svg className="w-4 h-4 text-[#BFA799]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Route Card 2: South Kolkata Mega Tour */}
        <button
          type="button"
          onClick={() => onSelectPopularRoute?.('south_mega')}
          className="w-full flex items-center p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#E5D2A8] shadow-sm hover:shadow-md hover:border-[#8E1B1B]/40 active:scale-[0.99] transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FDF1E6] flex items-center justify-center text-[#8E1B1B] mr-3 flex-shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="flex-1 pr-2">
            <h4 className="font-extrabold text-[14px] text-[#3D241B]">
              South Kolkata Mega Tour
            </h4>
            <p className="text-[11.5px] text-[#856E63] font-medium mt-0.5">
              8 Pandals • 6.8 km • 3.5 hrs
            </p>
          </div>
          <svg className="w-4 h-4 text-[#BFA799]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
