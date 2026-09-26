import React, { memo } from 'react';

// Golden Three-Petal Lotus / Leaf Ornament
const FloralOrnament = memo(function FloralOrnament({ size = 18, color = '#C8A86B' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2 C13.8 6.5, 14.8 9.5, 14.2 13 C13.2 11.2, 10.8 11.2, 9.8 13 C9.2 9.5, 10.2 6.5, 12 2 Z"
        fill={color}
      />
      <path
        d="M4 14.5 C7.5 12.2, 10.8 13.2, 11.2 15.5 C9.2 15.8, 7.2 17.8, 4.8 18.2 C3.5 16.5, 3.5 15, 4 14.5 Z"
        fill={color}
      />
      <path
        d="M20 14.5 C16.5 12.2, 13.2 13.2, 12.8 15.5 C14.8 15.8, 16.8 17.8, 19.2 18.2 C20.5 16.5, 20.5 15, 20 14.5 Z"
        fill={color}
      />
      <circle cx="12" cy="16" r="1.5" fill={color} />
      <path d="M12 17 L12 21" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
});

// Plan Your Trip Custom Icon
const PlanTripIcon = memo(function PlanTripIcon({ size = 20, color = '#7A1614' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 14 C3.9 14, 3 14.9, 3 16 C3 18, 5 21, 5 21 S7 18, 7 16 C7 14.9, 6.1 14, 5 14 Z" />
      <circle cx="5" cy="16" r="0.8" fill={color} />
      <path d="M5.5 13.5 C6.5 9.5, 11 11, 13.5 7.5 C14.5 6, 16 6, 17 6.5" strokeDasharray="2 2" />
      <path d="M19 3 C17.9 3, 17 3.9, 17 5 C17 7, 19 10, 19 10 S21 7, 21 5 C21 3.9, 20.1 3, 19 3 Z" />
      <circle cx="19" cy="5" r="0.8" fill={color} />
    </svg>
  );
});

// My Trips Custom Icon
const MyTripsIcon = memo(function MyTripsIcon({ size = 20, color = '#7A1614' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L12 4" />
      <path d="M12 4 L8 8 L16 8 Z" />
      <line x1="6" y1="8" x2="18" y2="8" />
      <path d="M7 8 L6 13 L18 13 L17 8" />
      <line x1="4" y1="13" x2="20" y2="13" />
      <line x1="7" y1="13" x2="7" y2="19" />
      <line x1="12" y1="13" x2="12" y2="19" />
      <line x1="17" y1="13" x2="17" y2="19" />
      <line x1="4" y1="19" x2="20" y2="19" />
      <line x1="2" y1="22" x2="22" y2="22" />
    </svg>
  );
});

// Kolkata Skyline Line Art Illustration
const KolkataSkyline = memo(function KolkataSkyline({ strokeColor = '#CAA774' }) {
  return (
    <div className="relative w-full px-4 mt-2">
      <svg width="100%" height="70" viewBox="0 0 300 70" fill="none">
        {/* Flying birds */}
        <path d="M78 14 Q81 11 84 14 Q87 11 90 14" stroke={strokeColor} strokeWidth="0.8" strokeLinecap="round" />
        <path d="M92 8 Q94.5 5.5 97 8 Q99.5 5.5 102 8" stroke={strokeColor} strokeWidth="0.7" strokeLinecap="round" />
        <path d="M100 12 Q102.5 9.5 105 12 Q107.5 9.5 110 12" stroke={strokeColor} strokeWidth="0.7" strokeLinecap="round" />

        {/* Howrah Bridge */}
        <path d="M22 60 L26 22 L29 22 L33 60" stroke={strokeColor} strokeWidth="0.9" />
        <path d="M68 60 L71 26 L74 26 L77 60" stroke={strokeColor} strokeWidth="0.9" />
        <path d="M12 42 L27 22 L50 33 L72 26 L95 44" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
        <line x1="10" y1="53" x2="98" y2="53" stroke={strokeColor} strokeWidth="1.1" />
        <line x1="10" y1="60" x2="280" y2="60" stroke={strokeColor} strokeWidth="0.8" opacity="0.6" />
        <path d="M14 53 L21 40 L27 53 L38 29 L49 53 L60 30 L71 53 L82 36 L93 53" stroke={strokeColor} strokeWidth="0.7" strokeLinecap="round" />

        {/* Victoria Memorial Colonnade */}
        <rect x="100" y="48" width="70" height="12" stroke={strokeColor} strokeWidth="0.75" />
        <line x1="105" y1="48" x2="105" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <line x1="113" y1="48" x2="113" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <line x1="121" y1="48" x2="121" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <line x1="129" y1="48" x2="129" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <line x1="137" y1="48" x2="137" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <line x1="145" y1="48" x2="145" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <line x1="153" y1="48" x2="153" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <line x1="161" y1="48" x2="161" y2="60" stroke={strokeColor} strokeWidth="0.65" />

        {/* Grand Dome */}
        <path d="M123 48 L123 40 C123 31, 147 31, 147 40 L147 48 Z" stroke={strokeColor} strokeWidth="0.9" />
        <path d="M129 48 C129 38, 141 38, 141 48" stroke={strokeColor} strokeWidth="0.65" />
        <line x1="135" y1="31" x2="135" y2="26" stroke={strokeColor} strokeWidth="0.9" />
        <circle cx="135" cy="25" r="1.1" fill={strokeColor} />

        {/* Adjacent Domes */}
        <path d="M106 48 L106 43 C106 38, 118 38, 118 43 L118 48 Z" stroke={strokeColor} strokeWidth="0.8" />
        <line x1="112" y1="38" x2="112" y2="35" stroke={strokeColor} strokeWidth="0.7" />
        <circle cx="112" cy="34" r="0.7" fill={strokeColor} />
        <rect x="168" y="50" width="38" height="10" stroke={strokeColor} strokeWidth="0.75" />
        <path d="M172 50 L172 44 C172 39, 184 39, 184 44 L184 50 Z" stroke={strokeColor} strokeWidth="0.8" />
        <line x1="178" y1="39" x2="178" y2="36" stroke={strokeColor} strokeWidth="0.7" />
        <circle cx="178" cy="35" r="0.7" fill={strokeColor} />

        {/* River Ripple */}
        <path d="M15 63 Q40 61 65 63 T115 63 T165 63 T215 63" stroke={strokeColor} strokeWidth="0.6" opacity="0.45" />
      </svg>
      <div className="absolute right-4 bottom-2 pointer-events-none">
        <FloralOrnament size={20} color="#C8A86B" />
      </div>
    </div>
  );
});

export default function SideDrawer({
  isOpen,
  onClose,
  onNavigate,
  onOpenModal,
}) {
  if (!isOpen) return null;

  const menuItems = [
    {
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5 text-[#7A1614]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      action: () => {
        onClose();
        onNavigate('profile');
      },
    },
    {
      label: 'Plan Your Trip',
      icon: <PlanTripIcon size={21} color="#7A1614" />,
      action: () => {
        onClose();
        onNavigate('trips');
      },
    },
    {
      label: 'My Trips',
      icon: <MyTripsIcon size={21} color="#7A1614" />,
      action: () => {
        onClose();
        onNavigate('profile');
      },
    },
    {
      label: 'Nearby Pandals',
      icon: (
        <svg className="w-5 h-5 text-[#7A1614]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
          <circle cx="12" cy="11" r="2.5" />
        </svg>
      ),
      action: () => {
        onClose();
        onNavigate('navigation');
      },
    },
    {
      label: 'Recommendations',
      icon: (
        <svg className="w-5 h-5 text-[#7A1614]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      action: () => {
        onClose();
        onOpenModal('recommendations');
      },
    },
    {
      label: 'Redeem Points',
      icon: (
        <svg className="w-5 h-5 text-[#7A1614]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      action: () => {
        onClose();
        onOpenModal('redeem');
      },
    },
    {
      label: 'Contact Us',
      icon: (
        <svg className="w-5 h-5 text-[#7A1614]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      action: () => {
        onClose();
        onOpenModal('contact');
      },
    },
    {
      label: 'About Us',
      icon: (
        <svg className="w-5 h-5 text-[#7A1614]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
      action: () => {
        onClose();
        onOpenModal('about');
      },
    },
    {
      label: 'Privacy Policy',
      icon: (
        <svg className="w-5 h-5 text-[#7A1614]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      action: () => {
        onClose();
        onOpenModal('privacy');
      },
    },
    {
      label: 'Terms & Conditions',
      icon: (
        <svg className="w-5 h-5 text-[#7A1614]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      action: () => {
        onClose();
        window.open('/terms.html', '_blank', 'noopener,noreferrer');
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex animate-fade-in">
      {/* Dark frosted overlay backdrop */}
      <div
        className="fixed inset-0 bg-[#140a08]/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sliding Ivory Drawer Panel */}
      <aside className="relative z-10 w-full max-w-[320px] h-full bg-[#FAF5ED] shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-right border-r border-[#EBDCC9]">
        {/* Background Watermark */}
        <div
          className="absolute inset-0 opacity-[0.12] bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url('/kolkata_vintage_map.jpg')` }}
        />

        {/* Content Area */}
        <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
          {/* Top Brand Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#7A1614] p-0.5 border-[1.5px] border-[#E8C37B] shadow-md flex items-center justify-center">
                <img
                  src="/debi_dorshon_logo.png"
                  alt="Debi Dorshon Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <h2 className="text-2xl font-bold text-[#7A1614] font-bengali tracking-tight">
                দেবী দর্শন
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-[#7A2218] hover:bg-black/5 active:scale-95 transition-transform"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Elegant Floral Ornament Divider */}
          <div className="flex items-center px-5 mb-2">
            <div className="flex-1 h-px bg-[#EADBC8]" />
            <div className="px-2">
              <FloralOrnament size={16} color="#C8A86B" />
            </div>
            <div className="flex-1 h-px bg-[#EADBC8]" />
          </div>

          {/* Menu Items List */}
          <div className="flex-1 overflow-y-auto px-4 py-1 space-y-1">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={item.action}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-[#C8A872]/15 active:bg-[#C8A872]/25 transition-colors group text-left"
              >
                <div className="w-9 h-9 rounded-full bg-[#F3E8DC] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <span className="flex-1 text-[15px] font-bold text-[#38231B]">
                  {item.label}
                </span>
                <svg className="w-4 h-4 text-[#CCA86E] group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Section: Links + Divider + Kolkata Skyline Art */}
        <div className="relative z-10 pb-3">
          <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-[#8A7B6E] pt-1 pb-2">
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#8E1B1B] hover:underline transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-[#C8A872]">•</span>
            <a
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#8E1B1B] hover:underline transition-colors"
            >
              Terms & Conditions
            </a>
          </div>
          <div className="h-px bg-[#EADBC8] mx-5 mb-1" />
          <KolkataSkyline strokeColor="#CAA774" />
        </div>
      </aside>
    </div>
  );
}
