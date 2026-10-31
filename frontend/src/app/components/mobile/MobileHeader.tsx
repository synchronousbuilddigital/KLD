import React from 'react';
import { Search, User, LogIn, Sparkles } from 'lucide-react';
import AnimatedLogo from '../layout/AnimatedLogo';

interface MobileHeaderProps {
  activeTab: string;
  onSearchClick: () => void;
  onSwitchToDesktop?: () => void;
  onOpenProfile: () => void;
  onOpenSignIn: () => void;
  onLogoClick?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  onSearchClick,
  onOpenProfile,
  onOpenSignIn,
  onLogoClick,
}) => {
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';
  const currentUser = (() => {
    if (typeof window === 'undefined') return null;
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F4]/90 backdrop-blur-md border-b border-zinc-200/80 px-4 py-2.5 flex items-center justify-between shadow-2xs">
      {/* Authentic Desktop Animated 3D Logo */}
      <div className="flex items-center gap-2 cursor-pointer scale-90 -ml-1">
        <AnimatedLogo onClick={onLogoClick || (() => window.location.href = '/')} />
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5">
        {/* Search button */}
        <button
          onClick={onSearchClick}
          className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-all active:scale-95 border border-zinc-200/60"
          aria-label="Search Packaging Models"
          title="Search Packaging Models"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* User Account / Sign In */}
        {isLoggedIn ? (
          <button
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-bold border border-zinc-800 shadow-2xs"
            title="My Profile"
          >
            {currentUser?.fullName?.[0] || currentUser?.email?.[0] || 'U'}
          </button>
        ) : (
          <button
            onClick={onOpenSignIn}
            className="px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
          >
            <LogIn className="w-3.5 h-3.5 text-amber-400" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;
