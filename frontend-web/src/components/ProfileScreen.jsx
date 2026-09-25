import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({
  onNavigateToPandal,
  onNavigateToTrip,
}) {
  const {
    user,
    isAuthenticated,
    logout,
    googleClientId,
    loginWithGoogleToken,
    loginWithEmail,
    registerWithEmail,
    favorites,
    toggleFavoritePandal,
    savedTrips,
    deleteSavedTrip,
  } = useAuth();

  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('menu'); // 'menu' | 'favorites' | 'saved_trips'

  // Initialize Google Button inside profile screen if guest
  useEffect(() => {
    if (isAuthenticated || !googleClientId) return;

    let timer = null;
    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            auto_select: false,
            callback: async (response) => {
              if (response.credential) {
                setAuthLoading(true);
                setErrorMessage(null);
                try {
                  await loginWithGoogleToken(response.credential);
                } catch (err) {
                  const msg = err.message || '';
                  if (msg.includes('fetch') || msg.includes('Network') || msg.includes('Failed')) {
                    setErrorMessage('Connecting to backend... Server may be waking up from sleep. Please try again.');
                  } else {
                    setErrorMessage(msg || 'Google sign-in failed');
                  }
                } finally {
                  setAuthLoading(false);
                }
              }
            },
          });

          const btnElem = document.getElementById('profile-google-btn-slot');
          if (btnElem) {
            btnElem.innerHTML = '';
            window.google.accounts.id.renderButton(btnElem, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              width: 250,
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
          }
          if (timer) clearInterval(timer);
        } catch (err) {
          console.warn('GSI init error:', err);
        }
      }
    };

    initGsi();
    timer = setInterval(initGsi, 300);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAuthenticated, googleClientId, loginWithGoogleToken]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setAuthLoading(true);
    try {
      if (isRegisterMode) {
        await registerWithEmail(cleanEmail, cleanPassword, name.trim());
      } else {
        await loginWithEmail(cleanEmail, cleanPassword);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="relative h-full w-full overflow-y-auto no-scrollbar pt-24 pb-32 px-4 sm:px-6 max-w-xl mx-auto">
      {isAuthenticated ? (
        /* ==================== SIGNED IN STATE ==================== */
        <div className="space-y-4">
          {/* User Profile Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8E1B1B] to-[#771313] p-6 text-white shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-[#D8A52B] p-0.5 overflow-hidden bg-[#FAF5ED] flex items-center justify-center flex-shrink-0 shadow-md">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name || 'User'} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-2xl font-black text-[#8E1B1B]">
                    {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-extrabold truncate">
                  {user?.name || 'Puja Pilgrim'}
                </h2>
                <p className="text-xs text-white/80 truncate mt-0.5">
                  {user?.email || ''}
                </p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold text-[#F4D388]">
                  <span>🪔</span>
                  <span>Puja Explorer 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Sections */}
          {activeSubTab === 'menu' && (
            <div className="space-y-3">
              {/* Saved Routes & Trips */}
              <button
                type="button"
                onClick={() => setActiveSubTab('saved_trips')}
                className="w-full flex items-center p-4 rounded-2xl bg-[#FFFDF8] border border-[#E5D2A8] shadow-sm hover:shadow-md hover:border-[#8E1B1B]/40 active:scale-[0.99] transition-all text-left group"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#8E1B1B]/10 flex items-center justify-center text-[#8E1B1B] mr-3.5 flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="19" r="3" />
                    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
                    <circle cx="18" cy="5" r="3" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-[15px] text-[#3D241B]">
                    Saved Routes & Trips ({savedTrips.length})
                  </h3>
                  <p className="text-xs text-[#856E63] font-medium mt-0.5">
                    View and replay your custom Durga Puja routes
                  </p>
                </div>
                <span className="text-[#8E1B1B] font-bold text-lg group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </button>

              {/* Favorite Pandals */}
              <button
                type="button"
                onClick={() => setActiveSubTab('favorites')}
                className="w-full flex items-center p-4 rounded-2xl bg-[#FFFDF8] border border-[#E5D2A8] shadow-sm hover:shadow-md hover:border-[#8E1B1B]/40 active:scale-[0.99] transition-all text-left group"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#8E1B1B]/10 flex items-center justify-center text-rose-600 mr-3.5 flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-[15px] text-[#3D241B]">
                    Favorite Pandals ({favorites.length})
                  </h3>
                  <p className="text-xs text-[#856E63] font-medium mt-0.5">
                    Quickly navigate to your bookmarked pandals
                  </p>
                </div>
                <span className="text-[#8E1B1B] font-bold text-lg group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={logout}
                className="w-full h-12 rounded-2xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all mt-4"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Sub-View: Saved Trips */}
          {activeSubTab === 'saved_trips' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5D2A8]">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('menu')}
                  className="text-xs font-bold text-[#8E1B1B] flex items-center gap-1 hover:underline"
                >
                  <span>←</span>
                  <span>Back to Profile</span>
                </button>
                <h3 className="text-sm font-extrabold text-[#3D241B]">Saved Trips</h3>
              </div>

              {savedTrips.length === 0 ? (
                <div className="p-8 text-center bg-[#FFFDF8] rounded-2xl border border-[#E5D2A8] text-xs text-[#856E63]">
                  No saved routes yet. Plan a trip and click save to keep your itineraries here!
                </div>
              ) : (
                savedTrips.map((trip) => (
                  <div key={trip.id} className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#E5D2A8] flex items-center justify-between gap-3 shadow-sm">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#3D241B]">{trip.name}</h4>
                      <p className="text-xs text-[#856E63] mt-0.5">
                        {trip.origin?.name || 'Origin'} → {trip.destination?.name || 'Destination'}
                      </p>
                      <span className="text-[11px] font-bold text-[#8E1B1B]">
                        {trip.distanceKm} km • {trip.pandalCount} pandals
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigateToTrip?.(trip)}
                        className="px-3 py-1.5 rounded-xl bg-[#8E1B1B] text-white font-extrabold text-xs shadow-sm hover:bg-[#771313]"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedTrip(trip.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sub-View: Favorites */}
          {activeSubTab === 'favorites' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5D2A8]">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('menu')}
                  className="text-xs font-bold text-[#8E1B1B] flex items-center gap-1 hover:underline"
                >
                  <span>←</span>
                  <span>Back to Profile</span>
                </button>
                <h3 className="text-sm font-extrabold text-[#3D241B]">Favorite Pandals</h3>
              </div>

              {favorites.length === 0 ? (
                <div className="p-8 text-center bg-[#FFFDF8] rounded-2xl border border-[#E5D2A8] text-xs text-[#856E63]">
                  No favorites added yet. Tap the heart icon on any pandal in the Navigation directory!
                </div>
              ) : (
                favorites.map((pandal, idx) => (
                  <div key={pandal.id || pandal._id || idx} className="p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#E5D2A8] flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-sm text-[#1B1C1A] truncate">{pandal.name}</h4>
                      <p className="text-xs text-[#856E63] truncate">{pandal.cluster || pandal.region || 'Kolkata'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigateToPandal?.(pandal)}
                        className="px-3 py-1.5 rounded-xl bg-[#8E1B1B] text-white font-extrabold text-xs shadow-sm hover:bg-[#771313]"
                      >
                        Navigate
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavoritePandal(pandal)}
                        className="p-1 text-sm text-rose-600"
                      >
                        ❤️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        /* ==================== SIGN IN STATE (GUEST) ==================== */
        <div className="w-full bg-[#FFFDF8] rounded-3xl border border-[#E5D2A8] p-6 shadow-md text-center">
          <div className="w-16 h-16 rounded-full bg-[#8E1B1B]/10 text-[#8E1B1B] flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <h2 className="text-2xl font-extrabold text-[#8E1B1B] mb-1 font-serif">
            Sign In
          </h2>
          <p className="text-xs text-[#765C51] leading-relaxed mb-4 max-w-sm mx-auto">
            Sign in with Google or Email to sync your saved pandals and custom puja routes across devices.
          </p>

          {errorMessage && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-1.5 text-left">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign-in Slot */}
          <div className="flex justify-center my-3 min-h-[44px]">
            <div id="profile-google-btn-slot" />
          </div>

          {/* Email Alternative Toggle */}
          {!showEmailForm ? (
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="mt-3 text-xs font-bold text-[#8E1B1B] underline hover:opacity-80"
            >
              or continue with email & password
            </button>
          ) : (
            <form onSubmit={handleEmailSubmit} className="mt-4 pt-4 border-t border-[#E5D2A8] space-y-3 text-left">
              {isRegisterMode && (
                <div>
                  <label className="block text-[11px] font-bold text-[#564338] mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF5ED] border border-[#E5D2A8] text-xs font-medium text-[#3D241B] focus:border-[#8E1B1B]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#564338] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF5ED] border border-[#E5D2A8] text-xs font-medium text-[#3D241B] focus:border-[#8E1B1B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#564338] mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF5ED] border border-[#E5D2A8] text-xs font-medium text-[#3D241B] focus:border-[#8E1B1B]"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full h-11 rounded-xl bg-[#8E1B1B] hover:bg-[#771313] text-white font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center"
              >
                {authLoading ? 'Authenticating...' : isRegisterMode ? 'Create Account' : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setErrorMessage(null);
                  }}
                  className="text-xs font-bold text-[#8E1B1B] hover:underline"
                >
                  {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          )}

          {/* Terms & Privacy Links */}
          <p className="text-[10.5px] text-center text-[#856E63] mt-4 leading-relaxed">
            By continuing, you agree to our{' '}
            <a
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#8E1B1B] underline hover:text-[#771313]"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#8E1B1B] underline hover:text-[#771313]"
            >
              Privacy Policy
            </a>.
          </p>
        </div>
      )}
    </div>
  );
}
