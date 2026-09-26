import React from 'react';

export default function InfoModals({
  activeModal, // 'about' | 'contact' | 'privacy' | null
  onClose,
}) {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg bg-[#FFFEFC] rounded-3xl border border-[#EBDCC9] shadow-2xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto no-scrollbar animate-slide-up">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#8A7B6E] hover:text-[#3D241B] hover:bg-black/5 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {activeModal === 'about' && (
          <div className="text-center">
            <span className="text-4xl">🪷</span>
            <h2 className="text-2xl font-extrabold text-[#8E1B1B] font-bengali mt-2">
              দেবী দর্শন (Debi Dorshon)
            </h2>
            <p className="text-xs font-bold text-[#D8A52B] mt-0.5 tracking-wider">
              Version 1.0.0 • Durga Puja 2026 Edition
            </p>

            <p className="text-xs text-[#564338] leading-relaxed mt-4 text-justify">
              Debi Dorshon is your ultimate digital companion for Kolkata Durga Puja Parikrama.
              We bring real-time Kolkata Metro & Suburban Train station directories, GPS pandal routing,
              custom corridor itinerary generation, and crowd guidance straight to your screen.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-[#FAF5ED] border border-[#E5D2A8] text-left">
              <h3 className="text-xs font-extrabold text-[#8E1B1B] uppercase tracking-wider mb-2">
                Key Features
              </h3>
              <ul className="space-y-1.5 text-xs text-[#3D241B] font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-[#8E1B1B]">✔</span>
                  <span>Station-to-Pandal Metro & Train guide</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#8E1B1B]">✔</span>
                  <span>Instant corridor routing with max detour control</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#8E1B1B]">✔</span>
                  <span>Interactive OpenStreetMap Kolkata map with 500+ pinned pandals</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#8E1B1B]">✔</span>
                  <span>Bengali tithi calendar integration (Shashthi to Dashami)</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 3. CONTACT US MODAL */}
        {activeModal === 'contact' && (
          <div className="text-center">
            <span className="text-4xl">🎧</span>
            <h2 className="text-2xl font-extrabold text-[#8E1B1B] font-serif mt-2">
              We'd Love to Hear From You
            </h2>
            <p className="text-xs text-[#564338] leading-relaxed mt-1 max-w-sm mx-auto">
              Have questions, feedback, or need help navigating Kolkata Durga Puja 2026? Reach out to our support team.
            </p>

            <div className="mt-6 space-y-3">
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=debidorshonapp@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-2xl bg-[#8E1B1B] hover:bg-[#771313] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>✉️</span>
                <span>debidorshonapp@gmail.com</span>
              </a>

            </div>
          </div>
        )}

        {/* 4. PRIVACY POLICY MODAL */}
        {activeModal === 'privacy' && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#8E1B1B]">
              <span className="text-2xl">🛡️</span>
              <h2 className="text-xl font-extrabold font-serif">
                Privacy Policy
              </h2>
            </div>
            <p className="text-[11px] font-bold text-[#8A7B6E] mb-3">
              Last Updated: September 2026
            </p>

            <p className="text-xs text-[#564338] leading-relaxed mb-4">
              At <strong>দেবী দর্শন (Debi Dorshon)</strong>, your privacy is our top priority. We do not sell or track your private personal information.
            </p>

            <div className="space-y-3 p-4 rounded-2xl bg-[#FAF5ED] border border-[#E5D2A8] text-xs text-[#3D241B]">
              <div>
                <h4 className="font-extrabold text-[#8E1B1B]">📍 GPS Location</h4>
                <p className="text-[#564338] mt-0.5">Used strictly on-device to compute nearest pandals and shortest puja parikrama routes.</p>
              </div>
              <div>
                <h4 className="font-extrabold text-[#8E1B1B]">💾 Local Cache</h4>
                <p className="text-[#564338] mt-0.5">Stored inside your browser's localStorage for saved trips, bookmarks, and festival dates.</p>
              </div>
              <div>
                <h4 className="font-extrabold text-[#8E1B1B]">🔒 Security</h4>
                <p className="text-[#564338] mt-0.5">All API communications use encrypted HTTPS protocols with isolated user sandboxes.</p>
              </div>
            </div>

            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full h-10 rounded-xl bg-[#8E1B1B] hover:bg-[#771313] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <span>View Full Legal Privacy Policy</span>
              <span>↗</span>
            </a>
          </div>
        )}


      </div>
    </div>
  );
}
