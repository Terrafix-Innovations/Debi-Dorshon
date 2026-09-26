import React, { useState, useEffect } from 'react';
import {
  BACKEND_ENDPOINTS,
  getActiveBackendUrl,
  setActiveBackendUrl,
  checkBackendHealth,
} from '../config/backendConfig';

export default function BackendSwitcherModal({ isOpen, onClose }) {
  const [currentUrl, setCurrentUrl] = useState(getActiveBackendUrl);
  const [customUrl, setCustomUrl] = useState('');
  const [healthStates, setHealthStates] = useState({});
  const [checking, setChecking] = useState(false);
  const [switchSuccess, setSwitchSuccess] = useState(null);

  // Check health of all endpoints on modal open
  useEffect(() => {
    if (!isOpen) return;
    setCurrentUrl(getActiveBackendUrl());
    testAllServers();
  }, [isOpen]);

  const testAllServers = async () => {
    setChecking(true);
    const results = {};
    for (const ep of BACKEND_ENDPOINTS) {
      results[ep.url] = await checkBackendHealth(ep.url);
    }
    setHealthStates(results);
    setChecking(false);
  };

  const handleSelect = (url) => {
    const clean = url.trim().replace(/\/+$/, '');
    setActiveBackendUrl(clean);
    setCurrentUrl(clean);
    setSwitchSuccess(`Switched active backend to: ${clean}`);
    setTimeout(() => {
      setSwitchSuccess(null);
      if (onClose) onClose();
    }, 1200);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    let url = customUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    handleSelect(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-[#FFFEFC] rounded-3xl border border-[#EBDCC9] shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto no-scrollbar animate-slide-up text-[#381E18]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0E4D6] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#8E1B1B]/10 flex items-center justify-center text-lg">
              ⚙️
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#8E1B1B]">
                Backend Server Switcher
              </h3>
              <p className="text-[11px] text-[#8C674B]">
                Switch between Render, Vercel Serverless, or Localhost
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#A08470] hover:text-[#381E18] hover:bg-black/5"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Success Toast */}
        {switchSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-bounce">
            <span>✅</span>
            <span className="truncate">{switchSuccess}</span>
          </div>
        )}

        {/* Server Selection Cards */}
        <div className="space-y-3 mb-5">
          {BACKEND_ENDPOINTS.map((endpoint) => {
            const isSelected = currentUrl === endpoint.url;
            const health = healthStates[endpoint.url];

            return (
              <div
                key={endpoint.id}
                onClick={() => handleSelect(endpoint.url)}
                className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FAF0DC] border-[#8E1B1B] shadow-md ring-1 ring-[#8E1B1B]'
                    : 'bg-[#FFFDF8] border-[#E5D2A8] hover:border-[#8E1B1B]/50 hover:bg-[#FAF5ED]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#2B1608]">
                        {endpoint.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          endpoint.id === 'render'
                            ? 'bg-[#8E1B1B]/10 text-[#8E1B1B]'
                            : endpoint.id === 'vercel'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {endpoint.badge}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-mono text-[#765C51] truncate mt-1">
                      {endpoint.url}
                    </p>

                    <p className="text-[11px] text-[#8C674B] mt-1 leading-snug">
                      {endpoint.desc}
                    </p>
                  </div>

                  {/* Health status pill */}
                  <div className="text-right flex-shrink-0">
                    {checking && !health ? (
                      <span className="inline-block text-[11px] text-[#A08470] animate-pulse">
                        Testing...
                      </span>
                    ) : health ? (
                      <div>
                        <div className="flex items-center gap-1 justify-end">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              health.ok ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span
                            className={`text-xs font-bold ${
                              health.ok ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {health.ok ? `${health.latency}ms` : 'Offline'}
                          </span>
                        </div>
                        {health.ok && health.database && (
                          <span className="text-[9.5px] text-[#8C674B] block">
                            DB: {health.database}
                          </span>
                        )}
                        {!health.ok && health.error && (
                          <span className="text-[9.5px] text-rose-500 block truncate max-w-[100px]">
                            {health.error}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-[#A08470]">Untested</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Server URL Input */}
        <form
          onSubmit={handleCustomSubmit}
          className="p-3.5 rounded-2xl bg-[#FAF5ED] border border-[#E5D2A8] mb-4"
        >
          <label className="block text-[11px] font-bold text-[#564338] mb-1.5">
            Custom Server URL (e.g. Phone WiFi Testing IP)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="http://192.168.1.15:8000"
              className="flex-1 h-9 px-3 rounded-xl bg-white border border-[#E5D2A8] text-xs font-mono text-[#3D241B] focus:border-[#8E1B1B] outline-none"
            />
            <button
              type="submit"
              className="h-9 px-3.5 rounded-xl bg-[#8E1B1B] hover:bg-[#771313] text-white text-xs font-bold transition-all active:scale-95"
            >
              Use
            </button>
          </div>
        </form>

        {/* Refresh Diagnostics Button */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F0E4D6]">
          <button
            type="button"
            onClick={testAllServers}
            disabled={checking}
            className="text-xs font-bold text-[#8E1B1B] hover:underline flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>🔄</span>
            <span>{checking ? 'Testing backends...' : 'Re-test Latency & Health'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#FAF5ED] hover:bg-[#EBDCC9] text-xs font-bold text-[#381E18] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
