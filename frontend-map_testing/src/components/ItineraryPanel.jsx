import React, { useState } from 'react';
import SearchInput from './SearchInput';
import PandalListModal from './PandalListModal';

export default function ItineraryPanel({
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  onClearOrigin,
  onClearDestination,
  onSwap,
  maxDetour,
  setMaxDetour,
  apiBaseUrl,
  setApiBaseUrl,
  onPlanRoute,
  loading,
  routeData,
  activePandal,
  setActivePandal
}) {
  const [jsonOpen, setJsonOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);

  const itinerary = routeData?.itinerary || [];
  const distanceKm = routeData?.estimated_distance_km || 0;
  const estimatedWalkMins = Math.round(distanceKm * 15); // ~4 km/h walking speed

  const handleCopyJson = () => {
    if (!routeData) return;
    navigator.clipboard.writeText(JSON.stringify(routeData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <aside className="relative z-30 w-full max-w-[420px] h-full bg-surface-container-lowest border-r border-outline-variant/30 shadow-lg flex flex-col overflow-hidden flex-shrink-0">
      {/* Plan Route Card Header */}
      <div className="p-5 pb-4 bg-surface-container-lowest border-b border-outline-variant/20 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-2xl text-on-surface font-bold tracking-tight">
            Plan Route
          </h2>
          {itinerary.length > 0 && (
            <button
              type="button"
              onClick={() => setListModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Pop out ordered pandal names window"
            >
              <span>📋</span>
              <span>View List</span>
            </button>
          )}
        </div>

        {/* Inputs container matching user's reference image */}
        <div className="relative flex flex-col gap-2">
          {/* Vertical connecting line between green dot and red dot on left */}
          <div className="absolute left-[13px] top-[18px] bottom-[18px] w-0.5 bg-outline-variant/60 pointer-events-none"></div>

          {/* Start Input Row */}
          <div className="relative flex items-center gap-2.5">
            {/* Green dot */}
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-surface-container-lowest shrink-0 z-10 shadow-xs ml-1"></div>
            
            <div className="flex-1">
              <SearchInput
                type="origin"
                placeholder="Start location"
                point={origin}
                onSelectPoint={onSelectOrigin}
                onClear={onClearOrigin}
                apiBaseUrl={apiBaseUrl}
              />
            </div>
          </div>

          {/* Horizontal dotted divider line with circular floating swap button (exact match to user image) */}
          <div className="relative my-0.5 flex items-center justify-end pr-5">
            <div className="absolute inset-x-0 border-t border-dashed border-outline-variant/50"></div>
            <button
              type="button"
              onClick={onSwap}
              disabled={!origin && !destination}
              className="relative z-10 w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 text-white flex items-center justify-center shadow-sm transition-all hover:scale-105"
              title="Swap Start & End locations"
            >
              {/* Opposing vertical arrows */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M4.5 11.5a.5.5 0 0 1 .5.5v1.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L4 13.793V12a.5.5 0 0 1 .5-.5zm7-7a.5.5 0 0 1-.5-.5V2.207L9.854 3.354a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L12 2.207V4a.5.5 0 0 1-.5.5z"/>
              </svg>
            </button>
          </div>

          {/* End Input Row */}
          <div className="relative flex items-center gap-2.5">
            {/* Orange/red dot */}
            <div className="w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-surface-container-lowest shrink-0 z-10 shadow-xs ml-1"></div>
            
            <div className="flex-1">
              <SearchInput
                type="dest"
                placeholder="End location"
                point={destination}
                onSelectPoint={onSelectDestination}
                onClear={onClearDestination}
                apiBaseUrl={apiBaseUrl}
              />
            </div>
          </div>
        </div>

        {/* Max Detour Parameter */}
        <div className="flex items-center justify-between pt-1">
          <label className="text-xs text-on-surface-variant font-medium">
            Max Detour
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={maxDetour}
              onChange={(e) => setMaxDetour(parseFloat(e.target.value) || 0)}
              min="0.5"
              max="10.0"
              step="0.5"
              className="w-16 h-8 bg-surface-container-low border border-outline-variant/40 rounded-lg text-center text-xs font-mono font-semibold text-on-surface focus:outline-none focus:border-primary"
            />
            <span className="text-xs text-on-surface-variant font-medium">km</span>
          </div>
        </div>

        {/* Search Route Button */}
        <button
          type="button"
          onClick={onPlanRoute}
          disabled={loading || !origin || !destination}
          className="w-full h-11 bg-primary hover:bg-primary-container disabled:opacity-40 text-white font-semibold rounded-xl shadow-xs hover:shadow flex items-center justify-center gap-2 transition-all text-sm tracking-wide"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Finding route...</span>
            </>
          ) : (
            <span>Search</span>
          )}
        </button>
      </div>

      {/* Route Summary */}
      {routeData && (
        <div className="px-5 py-2.5 bg-surface-container-low/60 border-b border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">Route</span>
            <span>•</span>
            <span>{distanceKm > 0 ? `${distanceKm.toFixed(2)} km` : '--'}</span>
            <span>•</span>
            <span>~{estimatedWalkMins} min walk</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-on-surface">
              {itinerary.length} {itinerary.length === 1 ? 'Pandal' : 'Pandals'}
            </span>
            <button
              type="button"
              onClick={() => setListModalOpen(true)}
              className="text-primary hover:text-primary-container font-bold text-xs p-0.5"
              title="Popout ordered list of names"
            >
              ↗
            </button>
          </div>
        </div>
      )}

      {/* Pandal Itinerary List */}
      <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-outline-variant/15">
        {itinerary.length === 0 ? (
          <div className="py-14 text-center text-on-surface-variant/60 px-4">
            <p className="text-sm font-medium text-on-surface mb-1">
              {routeData ? 'No pandals along this corridor' : 'No route planned'}
            </p>
            <p className="text-xs">
              {routeData 
                ? 'Try increasing the max detour corridor distance.'
                : 'Select Start and End locations to find pandals.'}
            </p>
          </div>
        ) : (
          itinerary.map((item) => {
            const { step, pandal, detour_distance_km } = item;
            const isActive = activePandal?.step === step;

            return (
              <div
                key={step}
                onClick={() => setActivePandal({ ...pandal, step, detour_distance_km })}
                className={`py-3 group cursor-pointer rounded-xl px-3 transition-colors ${
                  isActive 
                    ? 'bg-primary/10 border-l-4 border-primary' 
                    : 'hover:bg-surface-container-low/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Step Number matching map marker */}
                  <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'bg-surface-container-high text-on-surface'
                  }`}>
                    {step}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold truncate transition-colors ${
                      isActive ? 'text-primary' : 'text-on-surface group-hover:text-primary'
                    }`}>
                      {pandal.name}
                    </h3>

                    <p className="text-[11px] text-on-surface-variant/80 mt-0.5 truncate">
                      {pandal.region || 'Kolkata'}{pandal.cluster ? ` • ${pandal.cluster}` : ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-on-surface-variant/90">
                      <span className="font-mono text-primary font-medium">
                        +{detour_distance_km.toFixed(2)} km detour
                      </span>
                      {pandal.nearest_metro?.name && (
                        <>
                          <span>•</span>
                          <span className="text-secondary font-medium">🚇 {pandal.nearest_metro.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Raw JSON Debug Footer */}
      <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/20 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setJsonOpen(!jsonOpen)}
            className="text-[11px] text-on-surface-variant/70 hover:text-on-surface font-medium flex items-center gap-1 transition-colors"
          >
            <span>{jsonOpen ? '▼' : '▶'}</span> Raw JSON Response
          </button>

          {routeData && (
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-[11px] px-2 py-0.5 rounded bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface font-medium transition-colors"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>

        {jsonOpen && (
          <div className="max-h-36 overflow-y-auto bg-neutral-900 text-neutral-100 p-2.5 rounded-lg text-[10px] font-mono leading-relaxed">
            <pre>{routeData ? JSON.stringify(routeData, null, 2) : '// Plan a route to view response data...'}</pre>
          </div>
        )}
      </div>

      {/* Popout Window: Ordered Pandal Names Only */}
      <PandalListModal
        isOpen={listModalOpen}
        onClose={() => setListModalOpen(false)}
        itinerary={itinerary}
        activePandal={activePandal}
        onSelectPandal={(pandal) => setActivePandal(pandal)}
      />
    </aside>
  );
}
