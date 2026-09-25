import React, { useState, useEffect, useRef } from 'react';
import { getFestivalGreeting, PUJA_TITHIS, REST_DAY_GREETING } from '../utils/festivalDate';
import { useAuth } from '../context/AuthContext';

/**
 * Debi-Dorshon Master Festival Header
 * 
 * Replicates the authentic Durga Puja traditional header design:
 * - Sacred Trishul in vermilion crimson with solar accents
 * - Traditional Dhak (drums) with Kasful plumes, drumsticks & golden alpona motifs
 * - Dynamic Bengali typography: "শুভ ষষ্ঠী" (ranges from Tritiya to Dashami; rest days "শুভ শারদীয়া")
 * - Left hamburger menu button & right profile avatar badge
 * - Interactive Tithi switcher popover for instant testing / demonstration
 */
export default function Header({
  onMenuClick,
  onProfileClick,
  overrideDay = null,
  onDayChange,
}) {
  const { user, googleClientId, loginWithGoogleToken, logout, isAuthenticated } = useAuth();
  const [selectedDayKey, setSelectedDayKey] = useState(() => {
    return localStorage.getItem('debi_dorshon_tithi_override') || overrideDay || null;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pickerRef = useRef(null);
  const authModalRef = useRef(null);

  // Sync when prop changes
  useEffect(() => {
    if (overrideDay !== undefined && overrideDay !== selectedDayKey) {
      setSelectedDayKey(overrideDay);
    }
  }, [overrideDay]);

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showPicker]);

  // Close auth modal on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (authModalRef.current && !authModalRef.current.contains(event.target)) {
        setShowAuthModal(false);
      }
    }
    if (showAuthModal) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showAuthModal]);

  // Render Google Identity Services button inside the Auth modal
  useEffect(() => {
    if (showAuthModal && !user && googleClientId) {
      const initGsi = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              if (response.credential) {
                try {
                  await loginWithGoogleToken(response.credential);
                  setShowAuthModal(false);
                } catch (e) {
                  console.error('Failed to sign in with Google credential:', e);
                }
              }
            },
          });
          const btnElem = document.getElementById('web-google-btn-slot');
          if (btnElem) {
            btnElem.innerHTML = '';
            window.google.accounts.id.renderButton(btnElem, {
              theme: 'filled_black',
              size: 'large',
              width: 260,
              text: 'continue_with',
              shape: 'pill',
            });
          }
        }
      };

      // Try immediately or wait for script load
      initGsi();
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGsi();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showAuthModal, user, googleClientId, loginWithGoogleToken]);

  const greeting = getFestivalGreeting(selectedDayKey);

  const handleSelectDay = (key) => {
    setSelectedDayKey(key);
    if (key) {
      localStorage.setItem('debi_dorshon_tithi_override', key);
    } else {
      localStorage.removeItem('debi_dorshon_tithi_override');
    }
    if (onDayChange) onDayChange(key);
    setShowPicker(false);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 w-full flex flex-col items-center">
      {/* Full-width Flat Cream Top Bar with Traditional Festive Watermarks */}
      <div
        className="pointer-events-auto relative w-full bg-[#fbf7ee] border-b-[1.5px] border-[#c8a66a]/70 shadow-[0_4px_18px_rgba(45,26,22,0.06)] select-none overflow-hidden"
      >
        {/* Decorative Golden Temple Mandap Silhouette in Background */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 opacity-30 flex justify-center items-end overflow-hidden">
          <svg className="w-full max-w-4xl h-9 text-[#d4b584]" viewBox="0 0 600 40" fill="currentColor" preserveAspectRatio="none">
            {/* Left spires */}
            <path d="M0 40 L0 32 Q20 30 40 25 L40 40 Z" />
            <path d="M40 40 L40 25 Q60 20 70 12 Q80 20 100 25 L100 40 Z" />
            <path d="M100 40 L100 28 Q120 22 135 16 Q150 22 170 28 L170 40 Z" />
            <path d="M170 40 L170 30 Q195 24 210 10 Q225 24 250 30 L250 40 Z" />
            {/* Center grand temple mandap peaks */}
            <path d="M250 40 L250 26 Q275 18 300 4 Q325 18 350 26 L350 40 Z" />
            {/* Right spires */}
            <path d="M350 40 L350 30 Q375 24 390 10 Q405 24 430 30 L430 40 Z" />
            <path d="M430 40 L430 28 Q450 22 465 16 Q480 22 500 28 L500 40 Z" />
            <path d="M500 40 L500 25 Q520 20 530 12 Q540 20 560 25 L560 40 Z" />
            <path d="M560 40 L560 32 Q580 30 600 32 L600 40 Z" />
          </svg>
        </div>

        {/* Top-left corner floral alpona flourish */}
        <div className="pointer-events-none absolute top-0 left-0 w-16 h-12 opacity-35">
          <svg viewBox="0 0 64 48" fill="none" className="w-full h-full text-[#c8a66a]">
            <path d="M0 0 C16 4, 32 16, 40 32" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M0 12 C12 14, 24 24, 28 36" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
            <circle cx="28" cy="8" r="1.5" fill="currentColor" />
            <circle cx="16" cy="22" r="1.2" fill="currentColor" />
          </svg>
        </div>

        {/* Top-right corner floral alpona flourish */}
        <div className="pointer-events-none absolute top-0 right-0 w-16 h-12 opacity-35 scale-x-[-1]">
          <svg viewBox="0 0 64 48" fill="none" className="w-full h-full text-[#c8a66a]">
            <path d="M0 0 C16 4, 32 16, 40 32" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M0 12 C12 14, 24 24, 28 36" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
            <circle cx="28" cy="8" r="1.5" fill="currentColor" />
            <circle cx="16" cy="22" r="1.2" fill="currentColor" />
          </svg>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-8 py-2">
          {/* Left: Hamburger Menu Button */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open Navigation Menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#381e18] hover:bg-[#f3ebd9] active:scale-95 transition-all focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>

          {/* Center: Sacred Durga Puja Traditional Banner */}
          <div
            className="relative flex flex-col items-center justify-center cursor-pointer group"
            onClick={() => setShowPicker((prev) => !prev)}
            title="Click to switch festival day (Tritiya to Dashami or Sharodiya)"
          >
            {/* Sacred Trishul with Solar Flourishes */}
            <div className="flex items-center justify-center gap-1.5 -mb-0.5">
              {/* Left flourish accent */}
              <svg className="w-2.5 h-2 text-[#c4a475]" viewBox="0 0 10 8" fill="none">
                <path d="M2 6 C4 4, 7 3, 9 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>

              {/* Central Trishul */}
              <svg
                className="w-4 h-4 text-[#831917] drop-shadow-[0_1px_1px_rgba(131,25,23,0.15)]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                {/* Center spear tip */}
                <path d="M12 2 L13.6 7 L12.7 7 L12.7 15 L11.3 15 L11.3 7 L10.4 7 Z" />
                {/* Left curve prong */}
                <path d="M7 6.5 C7.5 9 9 12 11.3 13 L11.3 11.2 C9.8 10.3 8.8 8.4 8.5 6.5 C8 6.2 7.2 6.2 7 6.5 Z" />
                {/* Right curve prong */}
                <path d="M17 6.5 C16.5 9 15 12 12.7 13 L12.7 11.2 C14.2 10.3 15.2 8.4 15.5 6.5 C16 6.2 16.8 6.2 17 6.5 Z" />
                {/* Base collar and stem */}
                <circle cx="12" cy="16" r="1.3" />
                <rect x="11.2" y="17" width="1.6" height="5" rx="0.8" />
              </svg>

              {/* Right flourish accent */}
              <svg className="w-2.5 h-2 text-[#c4a475]" viewBox="0 0 10 8" fill="none">
                <path d="M8 6 C6 4, 3 3, 1 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Greeting Line with Flanking Dhak & Alpona Motifs */}
            <div className="flex items-center justify-center gap-1.5">
              {/* Left Motif: Dhak + Kasful + Paisley Swirl + Diamond */}
              <div className="flex items-center">
                <svg
                  className="w-14 sm:w-16 h-8 text-[#caa776] overflow-visible"
                  viewBox="0 0 64 32"
                  fill="none"
                >
                  {/* Kasful plumes sprouting from drum top */}
                  <path
                    d="M16 11 C13 7, 10 4, 6 4 C10 6, 12 9, 14 13"
                    stroke="#eae0d0"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M17 10 C15 5, 12 2, 7 1 C11 4, 13 8, 15 12"
                    stroke="#ffffff"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M19 10 C18 6, 16 3, 11 2 C14 5, 16 8, 17 12"
                    stroke="#e4d7c5"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Dhak (Drum) Body */}
                  <g transform="translate(14, 8) rotate(-14)">
                    <path
                      d="M3 4 C7 3, 14 3, 18 4 L16 19 C12 20, 6 20, 4 19 Z"
                      fill="#eddcc3"
                      stroke="#bca070"
                      strokeWidth="1"
                    />
                    <ellipse cx="10.5" cy="4" rx="7.5" ry="2" fill="#d9be95" stroke="#a78652" strokeWidth="0.8" />
                    <ellipse cx="10" cy="19" rx="6" ry="1.5" fill="#cca874" stroke="#a78652" strokeWidth="0.8" />
                    <path
                      d="M4 4 L15 19 M8 4 L12 19 M13 4 L8 19 M17 4 L5 19"
                      stroke="#ab8b58"
                      strokeWidth="0.7"
                      strokeLinecap="round"
                    />
                    <line x1="17" y1="2" x2="3" y2="21" stroke="#831917" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M12 11 Q15 13 14 17" stroke="#831917" strokeWidth="1" fill="none" />
                  </g>

                  {/* Golden Alpona Swirls */}
                  <path
                    d="M26 23 C31 27, 39 26, 43 20"
                    stroke="#caa776"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Sacred Diamond Motif with center dot & flanking accents */}
                  <g transform="translate(48, 16)">
                    <path
                      d="M0 -3.5 L3.5 0 L0 3.5 L-3.5 0 Z"
                      stroke="#caa776"
                      strokeWidth="1.1"
                      fill="none"
                    />
                    <circle cx="0" cy="0" r="1" fill="#831917" />
                    <circle cx="-5.5" cy="0" r="0.6" fill="#caa776" />
                    <circle cx="5.5" cy="0" r="0.6" fill="#caa776" />
                  </g>
                </svg>
              </div>

              {/* Main Typography: "শুভ" in espresso charcoal + Day Suffix in festive maroon */}
              <div className="flex items-baseline gap-1.5 font-bengali font-bold tracking-tight">
                <span className="text-[#2c1b18] text-[22px] md:text-[24px] drop-shadow-[0_1px_1px_rgba(44,27,24,0.06)] font-bengali">
                  {greeting.prefix}
                </span>
                <span className="text-[#831917] text-[22px] md:text-[24px] drop-shadow-[0_1px_1px_rgba(131,25,23,0.12)] font-bengali">
                  {greeting.suffix}
                </span>
              </div>

              {/* Right Motif: Symmetrical Dhak + Kasful + Paisley Swirl + Diamond */}
              <div className="flex items-center">
                <svg
                  className="w-14 sm:w-16 h-8 text-[#caa776] overflow-visible"
                  viewBox="0 0 64 32"
                  fill="none"
                >
                  {/* Kasful plumes */}
                  <path
                    d="M48 11 C51 7, 54 4, 58 4 C54 6, 52 9, 50 13"
                    stroke="#eae0d0"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M47 10 C49 5, 52 2, 57 1 C53 4, 51 8, 49 12"
                    stroke="#ffffff"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M45 10 C46 6, 48 3, 53 2 C50 5, 48 8, 47 12"
                    stroke="#e4d7c5"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Dhak (Drum) Body */}
                  <g transform="translate(50, 8) scale(-1, 1) rotate(-14)">
                    <path
                      d="M3 4 C7 3, 14 3, 18 4 L16 19 C12 20, 6 20, 4 19 Z"
                      fill="#eddcc3"
                      stroke="#bca070"
                      strokeWidth="1"
                    />
                    <ellipse cx="10.5" cy="4" rx="7.5" ry="2" fill="#d9be95" stroke="#a78652" strokeWidth="0.8" />
                    <ellipse cx="10" cy="19" rx="6" ry="1.5" fill="#cca874" stroke="#a78652" strokeWidth="0.8" />
                    <path
                      d="M4 4 L15 19 M8 4 L12 19 M13 4 L8 19 M17 4 L5 19"
                      stroke="#ab8b58"
                      strokeWidth="0.7"
                      strokeLinecap="round"
                    />
                    <line x1="17" y1="2" x2="3" y2="21" stroke="#831917" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M12 11 Q15 13 14 17" stroke="#831917" strokeWidth="1" fill="none" />
                  </g>

                  {/* Golden Alpona Swirls */}
                  <path
                    d="M38 23 C33 27, 25 26, 21 20"
                    stroke="#caa776"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Sacred Diamond Motif */}
                  <g transform="translate(16, 16)">
                    <path
                      d="M0 -3.5 L3.5 0 L0 3.5 L-3.5 0 Z"
                      stroke="#caa776"
                      strokeWidth="1.1"
                      fill="none"
                    />
                    <circle cx="0" cy="0" r="1" fill="#831917" />
                    <circle cx="-5.5" cy="0" r="0.6" fill="#caa776" />
                    <circle cx="5.5" cy="0" r="0.6" fill="#caa776" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Sacred dot motif below the text */}
            <div className="flex items-center justify-center gap-1 -mt-0.5">
              <span className="w-1 h-1 rounded-full bg-[#caa776]" />
              <span className="w-1.5 h-1.5 rotate-45 border border-[#caa776] bg-[#831917]" />
              <span className="w-1 h-1 rounded-full bg-[#caa776]" />
            </div>
          </div>

          {/* Right: User Profile Avatar Circle */}
          <button
            type="button"
            onClick={() => setShowAuthModal((prev) => !prev)}
            aria-label="User Profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2e6d6] text-[#3e221b] hover:bg-[#ebdcc9] active:scale-95 transition-all focus:outline-none shadow-sm overflow-hidden border border-[#ebdcc9]"
          >
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
            ) : user?.name ? (
              <span className="text-xs font-black text-[#831917]">{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* User Account / Google Sign-In Modal */}
      {showAuthModal && (
        <div
          ref={authModalRef}
          className="pointer-events-auto mt-2 w-full max-w-sm rounded-3xl bg-[#fffefc] p-4 shadow-2xl border border-[#ebdcc9] animate-fade-in z-50 text-[#381e18]"
        >
          {user ? (
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#f0e4d6] mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#831917] bg-[#fbf5ec] flex items-center justify-center shadow-sm">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-[#831917]">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-[#1b1c1a] truncate">{user.name}</h4>
                    <p className="text-xs text-[#8c674b] truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-xs text-[#a08470] hover:text-[#381e18] p-1"
                >
                  ✕
                </button>
              </div>

              {/* User Stats: Trips & Points */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-[#faf5ed] border border-[#ebdcc9] flex items-center gap-2">
                  <span className="text-base">🏆</span>
                  <div>
                    <div className="text-xs font-bold text-[#1b1c1a]">{user.completed_trips || 0}</div>
                    <div className="text-[10px] text-[#8c674b]">Trips Saved</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#faf5ed] border border-[#ebdcc9] flex items-center gap-2">
                  <span className="text-base">🎟️</span>
                  <div>
                    <div className="text-xs font-bold text-[#831917]">{user.redeem_points || 0}</div>
                    <div className="text-[10px] text-[#8c674b]">Redeem Points</div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#705a4f] bg-[#fdfaf5] p-2.5 rounded-xl border border-[#ebdcc9]/50 mb-3 flex items-center gap-1.5">
                <span>🔒</span>
                <span>Your trips, routes & rewards are isolated to your account.</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout();
                  setShowAuthModal(false);
                }}
                className="w-full py-2.5 rounded-xl bg-[#fff5f5] text-[#b91c1c] hover:bg-[#fee2e2] text-xs font-bold transition-all border border-[#fecaca] flex items-center justify-center gap-1.5"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-[#f0e4d6] mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🪔</span>
                  <div>
                    <h4 className="text-sm font-bold text-[#831917]">Sign In to দেবী দর্শন</h4>
                    <p className="text-[11px] text-[#8c674b]">Durga Puja Parikrama Companion</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-xs text-[#a08470] hover:text-[#381e18] p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#553b30] leading-relaxed mb-3.5">
                Sign in with your Google account to save custom pandal routes, track visited pandals, and earn Puja reward passes. Your data remains completely isolated and private to your account.
              </p>

              {/* Google Button Container */}
              <div id="web-google-btn-slot" className="flex justify-center my-2 min-h-[44px]" />

              <div className="text-[10px] text-center text-[#9c7e6b] mt-3 flex items-center justify-center gap-1">
                <span>🛡️</span>
                <span>Permanent secure session • No data tracking</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Festival Tithi Picker Popover */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="pointer-events-auto mt-2 w-full max-w-sm rounded-2xl bg-[#fffefc] p-3 shadow-2xl border border-[#ebdcc9] animate-fade-in z-50 text-[#381e18]"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#f0e4d6] mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🛕</span>
              <span className="text-xs font-bold text-[#831917]">Select Durga Puja Day</span>
            </div>
            <button
              onClick={() => setShowPicker(false)}
              className="text-xs text-[#a08470] hover:text-[#381e18] p-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {/* Auto (Today) */}
            <button
              type="button"
              onClick={() => handleSelectDay(null)}
              className={`col-span-2 flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDayKey === null
                  ? 'bg-[#831917] text-white font-bold'
                  : 'bg-[#f7f2ea] text-[#553b30] hover:bg-[#ede3d4]'
              }`}
            >
              <span>📅 Auto (Calendar Date)</span>
              <span className="text-[11px] opacity-80">
                {selectedDayKey === null ? 'Active' : ''}
              </span>
            </button>

            {/* Puja Days (Tritiya to Dashami) */}
            {PUJA_TITHIS.map((tithi) => (
              <button
                key={tithi.key}
                type="button"
                onClick={() => handleSelectDay(tithi.key)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors font-bengali ${
                  selectedDayKey === tithi.key
                    ? 'bg-[#831917] text-white font-bold'
                    : 'bg-[#faf6ee] text-[#4a3228] hover:bg-[#f0e5d6]'
                }`}
              >
                <span>{tithi.fullGreeting}</span>
                <span className="font-sans text-[10px] opacity-75">{tithi.english}</span>
              </button>
            ))}

            {/* Rest of the year (Shubho Sharodiya) */}
            <button
              type="button"
              onClick={() => handleSelectDay(REST_DAY_GREETING.key)}
              className={`col-span-2 flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors font-bengali ${
                selectedDayKey === REST_DAY_GREETING.key
                  ? 'bg-[#831917] text-white font-bold'
                  : 'bg-[#faf6ee] text-[#4a3228] hover:bg-[#f0e5d6]'
              }`}
            >
              <span>🍂 {REST_DAY_GREETING.fullGreeting}</span>
              <span className="font-sans text-[10px] opacity-75">(Rest of the year)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
