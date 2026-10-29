import React from 'react';
import { User, Shield, LogOut, LogIn, Monitor, Sparkles, Folder, CheckCircle2 } from 'lucide-react';

interface MobileProfileTabProps {
  onSwitchToDesktop: () => void;
  onOpenSignIn: () => void;
}

export const MobileProfileTab: React.FC<MobileProfileTabProps> = ({
  onSwitchToDesktop,
  onOpenSignIn,
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

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    window.location.reload();
  };

  return (
    <div className="flex flex-col space-y-4 pb-24 px-4 pt-4 select-none">
      {/* Profile Card Header */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white flex items-center justify-center text-xl font-black shadow-sm border border-zinc-800">
          {isLoggedIn ? (currentUser?.fullName?.[0] || currentUser?.email?.[0] || 'U') : 'K'}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-zinc-900 text-base leading-tight">
            {isLoggedIn ? (currentUser?.fullName || 'Packaging Creator') : 'Keyline Guest'}
          </h3>
          <p className="text-xs text-zinc-500 font-medium truncate mt-0.5">
            {isLoggedIn ? (currentUser?.email || 'Logged in User') : 'Sign in to save CAD designs & custom 3D mockups'}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {currentUser?.role === 'ADMIN' ? 'Admin Access' : 'Free Workspace'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Account Actions */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs p-2 space-y-1">
        {!isLoggedIn ? (
          <button
            onClick={onOpenSignIn}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 text-white text-xs font-semibold shadow-xs active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>Sign In / Create Account</span>
            </div>
            <span>›</span>
          </button>
        ) : (
          <>
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => {
                  window.location.href = '/admin';
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-zinc-50 text-xs font-semibold text-zinc-800 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Admin Control Center</span>
                </div>
                <span>›</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-rose-50 text-xs font-semibold text-rose-600 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </div>
              <span>›</span>
            </button>
          </>
        )}
      </div>

      {/* View Mode Switcher */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs p-4 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-zinc-900">Desktop View</h4>
            <p className="text-[11px] text-zinc-500">Switch to the full unscaled desktop browser layout</p>
          </div>
          <button
            onClick={onSwitchToDesktop}
            className="px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 border border-zinc-200 active:scale-95 transition-all"
          >
            <Monitor className="w-3.5 h-3.5 text-indigo-600" />
            <span>Switch</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileProfileTab;
