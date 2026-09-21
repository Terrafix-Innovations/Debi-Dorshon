import React, { useState, useEffect } from 'react';

export default function PandalListModal({
  isOpen,
  onClose,
  itinerary = [],
  activePandal,
  onSelectPandal
}) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyNames = () => {
    const text = itinerary
      .map((item) => `${item.step}. ${item.pandal.name}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg max-h-[85vh] bg-surface-container-lowest border border-outline-variant/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">🛕</span>
              <h3 className="font-headline text-lg font-bold text-on-surface">
                Ordered Pandal List
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {itinerary.length} Stops
              </span>
            </div>
            <p className="text-xs text-on-surface-variant/70 mt-0.5">
              Numbered in order to match route pins (1–{itinerary.length}) on the map
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyNames}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface flex items-center gap-1.5 transition-colors"
              title="Copy ordered list to clipboard"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied' : 'Copy List'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center text-sm transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Ordered Names List */}
        <div className="flex-1 overflow-y-auto px-6 py-3 divide-y divide-outline-variant/15">
          {itinerary.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant/60">
              No pandals in the current route response.
            </div>
          ) : (
            itinerary.map((item) => {
              const { step, pandal } = item;
              const isSelected = activePandal?.step === step;

              return (
                <div
                  key={step}
                  onClick={() => {
                    if (onSelectPandal) onSelectPandal({ ...pandal, step, detour_distance_km: item.detour_distance_km });
                    onClose();
                  }}
                  className={`py-3 px-3 rounded-xl cursor-pointer flex items-center gap-3.5 transition-all group ${
                    isSelected 
                      ? 'bg-primary/10 font-bold text-primary' 
                      : 'hover:bg-surface-container-low/80 text-on-surface'
                  }`}
                >
                  {/* Pin number matching map */}
                  <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-110 ${
                    isSelected 
                      ? 'bg-primary text-white' 
                      : 'bg-surface-container-high text-on-surface border border-outline-variant/50'
                  }`}>
                    {step}
                  </div>

                  {/* Pandal Name Only */}
                  <span className="text-sm font-semibold tracking-tight truncate flex-1">
                    {pandal.name}
                  </span>

                  <span className="text-xs text-on-surface-variant/40 group-hover:text-primary transition-colors">
                    ➔
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-2.5 bg-surface-container-low/40 border-t border-outline-variant/20 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-on-surface transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
