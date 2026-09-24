import React from 'react';
import Header from './Header';
import BottomTabBar from './BottomTabBar';

/**
 * Universal App Layout Shell
 * 
 * Provides the persistent Header and BottomTabBar across all screens/pages
 * in the application (like layout.tsx in Next.js).
 */
export default function Layout({
  children,
  activeTab = 'trips',
  onChangeTab,
  showTabBar = true,
  onMenuClick,
  onProfileClick,
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#faf7f2]">
      {/* Sacred Durga Puja Header — Universal across all pages */}
      <Header onMenuClick={onMenuClick} onProfileClick={onProfileClick} />

      {/* Main Page View Canvas */}
      <main className="relative h-full w-full overflow-hidden">
        {children}
      </main>

      {/* Persistent Bottom Tab Bar */}
      {showTabBar && (
        <BottomTabBar activeTab={activeTab} onChangeTab={onChangeTab} />
      )}
    </div>
  );
}
