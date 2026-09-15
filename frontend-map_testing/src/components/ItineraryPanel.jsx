import React, { useState } from 'react';
import SearchInput from './SearchInput';

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
    <aside className="relative z-30 w-full max-w-[440px] h-full bg-surface-container-lowest border-r border-outline-variant/30 shadow-xl flex flex-col overflow-hidden flex-shrink-0">
      {/* Drawer Header */}
      <div className="p-5 pb-3.5 border-b border-outline-variant/20 bg-surface-container-low/40">
        <div className="flex items-center justify-between mb-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-body text-xs font-semibold">
            <span>☀️</span>
            <span>Maha Ashtami Special</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant text-xs font-medium">
            <span className="text-primary font-bold">✦</span>
            <span>Debi AI Optimized</span>
          </div>
        </div>

        <h2 className="font-headline text-2xl text-on-surface font-semibold tracking-tight">
          Debi Dorshon Parikrama
        </h2>

        <div className="flex items-center gap-2 mt-1 text-on-surface-variant font-body text-xs">
          <span className="font-semibold text-primary">Sacred Route</span>
          <span>•</span>
          <span>{distanceKm > 0 ? `${distanceKm.toFixed(2)} km` : 'Pending'}</span>
          <span>•</span>
          <span>{distanceKm > 0 ? `~${estimatedWalkMins} min walk` : 'No route'}</span>
          <span>•</span>
          <span>{itinerary.length} Pandals</span>
        </div>
      </div>

      {/* Waypoint Inputs Section */}
      <div className="p-5 py-4 bg-surface-container-lowest border-b border-outline-variant/20 flex flex-col gap-3">
        <div className="relative flex flex-col gap-2.5">
          {/* Vertical dashed guideline */}
          <div className="absolute left-4 top-7 bottom-7 w-0.5 border-l-2 border-dashed border-outline-variant/60 pointer-events-none"></div>

          {/* Start Input */}
          <SearchInput
            type="origin"
            label="Start Sanctuary"
            placeholder="Search start (e.g. Ahiritola Ghat)..."
            point={origin}
            onSelectPoint={onSelectOrigin}
            onClear={onClearOrigin}
          />

          {/* End Input */}
          <SearchInput
            type="dest"
            label="End Sanctuary"
            placeholder="Search destination (e.g. Maniktala More)..."
            point={destination}
            onSelectPoint={onSelectDestination}
            onClear={onClearDestination}
          />
        </div>

        {/* Parameters & Swap Row */}
        <div className="grid grid-cols-2 gap-2.5 mt-1 pt-1 border-t border-outline-variant/20">
          <div>
            <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
              Max Detour (km)
            </label>
            <input
              type="number"
              value={maxDetour}
              onChange={(e) => setMaxDetour(parseFloat(e.target.value) || 0)}
              min="0.1"
              max="15.0"
              step="0.1"
              className="w-full bg-surface-container-low/80 border border-outline-variant/50 rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-mono font-medium focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-on-surface-variant">
                Swap Origin/Dest
              </label>
            </div>
            <button
              type="button"
              onClick={onSwap}
              className="w-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/50 rounded-lg py-1.5 px-2 text-xs font-semibold text-on-surface flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>⇄</span> Swap Points
            </button>
          </div>
        </div>

        <div className="text-[11px] text-primary/80 bg-primary/5 border border-primary/10 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
          <span>💡</span>
          <span>Click directly on the map to place or reposition pins!</span>
        </div>
      </div>

      {/* Ordered Pandal Sequence List */}
      <div className="flex-1 overflow-y-auto px-5 py-3.5 divide-y divide-outline-variant/20">
        <div className="flex items-center justify-between pb-2.5">
          <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">
            Planned Sanctum Stops ({itinerary.length})
          </span>
          {routeData && (
            <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              Optimal Detour Path
            </span>
          )}
        </div>

        {itinerary.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant/70">
            <p className="font-headline text-lg text-on-surface font-medium mb-1">
              {routeData ? 'No pandals found on this corridor' : 'No parikrama calculated yet'}
            </p>
            <p className="text-xs">
              {routeData 
                ? `Try expanding the Max Detour parameter (> ${maxDetour} km).` 
                : 'Click "Begin Guided Pilgrimage" below or choose a preset.'}
            </p>
          </div>
        ) : (
          itinerary.map((item) => {
            const { step, pandal, detour_distance_km } = item;
            const isActive = activePandal?.step === step;

            return (
              <div
                key={step}
                onClick={() => setActivePandal({ ...pandal, step })}
                className={`py-3 group cursor-pointer rounded-xl px-2.5 -mx-1 transition-all ${
                  isActive 
                    ? 'bg-primary/10 border-l-4 border-primary pl-3' 
                    : 'hover:bg-surface-container-low/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Step Badge */}
                  <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'bg-surface-container-high text-on-surface border border-outline-variant/60'
                  }`}>
                    {step}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className={`font-headline text-[15px] font-semibold truncate transition-colors ${
                        isActive ? 'text-primary' : 'text-on-surface group-hover:text-primary'
                      }`}>
                        {pandal.name}
                      </h3>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                        Open
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant/90 mt-0.5 truncate">
                      {pandal.region || 'Kolkata'} &bull; {pandal.cluster || 'Sanctum Cluster'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-[11px] text-on-surface-variant">
                      <span className="font-semibold text-primary font-mono">
                        +{detour_distance_km.toFixed(2)} km detour
                      </span>
                      {pandal.nearest_metro?.name && (
                        <>
                          <span>•</span>
                          <span className="text-secondary font-medium">🚇 {pandal.nearest_metro.name}</span>
                        </>
                      )}
                      {pandal.nearest_ferry?.name && (
                        <>
                          <span>•</span>
                          <span className="text-secondary font-medium">⛴️ {pandal.nearest_ferry.name}</span>
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

      {/* Action Drawer Footer */}
      <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex flex-col gap-2">
        <button
          type="button"
          onClick={onPlanRoute}
          disabled={loading || !origin || !destination}
          className="w-full h-11 bg-primary hover:bg-primary-container disabled:opacity-50 text-white font-semibold rounded-lg shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg text-sm"
        >
          <span>🚀</span>
          <span>{loading ? 'Calculating Sacred Route...' : 'Begin Guided Pilgrimage'}</span>
        </button>

        {/* Raw API JSON Toggle */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setJsonOpen(!jsonOpen)}
            className="text-xs text-on-surface-variant hover:text-primary font-medium flex items-center gap-1"
          >
            <span>{jsonOpen ? '▼' : '▶'}</span> Raw API Response JSON
          </button>

          {routeData && (
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-xs px-2 py-0.5 rounded bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 text-on-surface font-medium"
            >
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
          )}
        </div>

        {jsonOpen && (
          <div className="max-h-40 overflow-y-auto bg-neutral-900 text-neutral-100 p-2.5 rounded-lg text-[10px] font-mono leading-relaxed mt-1">
            <pre>{routeData ? JSON.stringify(routeData, null, 2) : '// Plan a route to inspect JSON...'}</pre>
          </div>
        )}
      </div>
    </aside>
  );
}
