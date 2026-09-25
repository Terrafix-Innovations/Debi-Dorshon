import React from 'react';
import Header from './Header';
import BottomTabBar from './BottomTabBar';

/**
 * Universal App Layout Shell
 * 
 * Provides the persistent Header and BottomTabBar across all screens/pages
 * in the application with warm festive parchment atmosphere.
 */
export default function Layout({
  children,
  activeTab = 'home',
  onChangeTab,
  showTabBar = true,
  onMenuClick,
  onProfileClick,
}) {
  return (
    <div
      className="relative flex flex-col h-full w-full overflow-hidden bg-[#faf7f2] bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `url('/kolkata_vintage_map.jpg')`,
      }}
    >
      {/* Translucent Warm Parchment Tint */}
      <div className="absolute inset-0 bg-[#fbf6ed]/85 pointer-events-none z-0" />

      {/* Sacred Durga Puja Header — Universal across all pages */}
      <Header onMenuClick={onMenuClick} onProfileClick={onProfileClick} />

      {/* Main Page View Canvas */}
      <main className="relative z-10 flex-1 w-full overflow-hidden">
        {children}
      </main>

      {/* Persistent Bottom Tab Bar */}
      {showTabBar && (
        <BottomTabBar activeTab={activeTab} onChangeTab={onChangeTab} />
      )}
    </div>
  );
}
