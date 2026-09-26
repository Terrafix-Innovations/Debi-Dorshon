import React from 'react';

export default function InfoModals({
  activeModal, // 'recommendations' | 'about' | 'contact' | 'privacy' | 'redeem' | null
  onClose,
  onSelectRecommendation,
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

        {/* 1. RECOMMENDATIONS MODAL */}
        {activeModal === 'recommendations' && (
          <div>
            <div className="mb-4">
              <span className="text-2xl">🌟</span>
              <h2 className="text-xl font-extrabold text-[#8E1B1B] font-serif mt-1">
                Curated Puja Recommendations
              </h2>
              <p className="text-xs text-[#765C51] mt-0.5">
                Handpicked itineraries & circuits for Kolkata Durga Puja 2026
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'north_heritage',
                  title: 'Must Visit North Kolkata Circuit',
                  desc: 'Sovabazar Rajbari, Bagbazar Sarbojanin, Ahiritola, Kumartuli Park',
                  tag: 'Heritage & Crowd Favorite',
                  icon: '🔥',
                  originName: 'Sovabazar Metro Station',
                  destinationName: 'Bagbazar Sarbojanin',
                },
                {
                  id: 'south_mega',
                  title: 'South Kolkata Mega Pandals',
                  desc: 'Sree Bhumi, Ekdalia Evergreen, Singhi Park, Suruchi Sangha',
                  tag: 'Lighting & Theme Masterpieces',
                  icon: '⭐',
                  originName: 'Rabindra Sarobar Metro',
                  destinationName: 'Ekdalia Evergreen',
                },
                {
                  id: 'night_hopping',
                  title: 'Best Night Time Hopping (12 AM - 4 AM)',
                  desc: 'Chetla Agrani, Mudiali, Badamtala Ashar Sangha, Deshapriya Park',
                  tag: 'Low Traffic & Cool Breeze',
                  icon: '🌙',
                  originName: 'Kalighat Metro Station',
                  destinationName: 'Chetla Agrani',
                },
                {
                  id: 'food_hubs',
                  title: 'Puja Special Street Food Hubs',
                  desc: 'Deckers Lane, Park Street, Hatibagan & College Street',
                  tag: 'Kolkata Delicacies',
                  icon: '🍢',
                  originName: 'Park Street Metro Station',
                  destinationName: 'College Square',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#E5D2A8] hover:border-[#8E1B1B]/40 shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xl">{item.icon}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D8A52B]/20 text-[#8E1B1B] text-[10.5px] font-extrabold">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-[14.5px] text-[#3D241B]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#765C51] mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectRecommendation?.(item);
                    }}
                    className="mt-3 w-full h-9 rounded-xl bg-[#8E1B1B] hover:bg-[#771313] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <span>Explore Route</span>
                    <span>→</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. ABOUT US MODAL */}
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
                href="mailto:support@debidorshon.com"
                className="w-full h-12 rounded-2xl bg-[#8E1B1B] hover:bg-[#771313] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>✉️</span>
                <span>support@debidorshon.com</span>
              </a>

              <a
                href="tel:+919876543210"
                className="w-full h-12 rounded-2xl bg-[#3D241B] hover:bg-[#281812] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>📞</span>
                <span>+91 98765 43210 (Puja Helpline)</span>
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

        {/* 5. REDEEM POINTS MODAL */}
        {activeModal === 'redeem' && (
          <div className="text-center">
            {/* Points Summary Badge */}
            <div className="rounded-3xl bg-gradient-to-r from-[#8E1B1B] to-[#771313] p-6 text-white shadow-xl mb-4">
              <span className="text-3xl">🎟️</span>
              <div className="text-4xl font-black mt-2">164</div>
              <div className="text-xs font-bold text-[#F4D388] mt-1 tracking-wider uppercase">
                Available Redeem Points
              </div>
            </div>

            {/* Wireframe Banner: COMING SOON... */}
            <div className="p-6 rounded-3xl bg-[#FAF5ED] border-2 border-dashed border-[#D8A52B] text-center">
              <span className="text-3xl">⏳</span>
              <h3 className="text-lg font-black text-[#8E1B1B] tracking-widest mt-2">
                COMING SOON...
              </h3>
              <p className="text-xs text-[#564338] leading-relaxed mt-2 max-w-sm mx-auto">
                Earn points on every Pandal hopping trip & redeem exciting Durga Puja food passes, VIP fast-track tickets & travel vouchers!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
