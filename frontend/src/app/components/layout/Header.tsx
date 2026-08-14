import React, { useState, useEffect } from 'react';
import { LayoutGrid, Folder, User, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import SignInModal from '../modals/SignInModal';

interface HeaderProps {
  activeNav?: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace';
  onNavigate?: (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace') => void;
}

export default function Header({ activeNav = 'landing', onNavigate }: HeaderProps) {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      try {
        const u = localStorage.getItem('user');
        setCurrentUser(u ? JSON.parse(u) : null);
      } catch { setCurrentUser(null); }
    };
    const handleOpenSignInModal = () => {
      setIsSignInModalOpen(true);
    };
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('open-sign-in-modal', handleOpenSignInModal);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('open-sign-in-modal', handleOpenSignInModal);
    };
  }, []);

  const handleNavClick = (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'admin' | 'workspace', targetPath: string) => {
    if (view === 'profile' && currentUser?.role === 'ADMIN') {
      view = 'admin';
      targetPath = '/admin';
    }
    window.history.pushState(null, '', targetPath);
    if (onNavigate) {
      onNavigate(view as any);
    } else {
      window.dispatchEvent(new CustomEvent('navigate', { detail: view }));
    }
  };

  const navItems = [
    { id: 'models', label: '3D Models', path: '/3d-models' },
    { id: 'dielines', label: 'Dielines', path: '/dielines' },
    { id: 'pricing', label: 'Pricing', path: '/pricing' },
    { id: 'about', label: 'About us', path: '/about-us' },
  ];

  return (
    <>
      <header className="main-header transition-all duration-300">
        
        {/* LOGO */}
        <div 
          className="logo group flex items-center gap-3 cursor-pointer select-none" 
          onClick={() => handleNavClick('landing', '/')}
        >
          <div className="w-9 h-9 rounded-xl bg-[#C89A63] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <span className="font-black tracking-widest text-sm text-zinc-950 uppercase">KEYLINE DESIGN</span>
        </div>

        {/* CENTER NAVIGATION LINKS */}
        <nav className="nav-links flex items-center gap-1.5 bg-zinc-200/80 p-1.5 px-2 rounded-full border border-zinc-300 shadow-inner backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => { e.preventDefault(); handleNavClick(item.id as any, item.path); }}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-zinc-950 text-white shadow-md font-black scale-[1.03] ring-2 ring-zinc-950/20' 
                    : 'text-zinc-800 hover:text-zinc-950 hover:bg-zinc-300/90 font-bold'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* RIGHT ACTION BUTTONS */}
        <div className="flex items-center gap-2.5">
          
          {/* 1. START DESIGNING BUTTON (LOGGED OUT) OR USER PROFILE AVATAR (LOGGED IN) */}
          {!isLoggedIn ? (
            <button 
              className="group bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-white text-xs font-bold px-4.5 py-2 rounded-full shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5"
              onClick={() => setIsSignInModalOpen(true)}
            >
              <span>Start Designing</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <div className="group relative cursor-pointer mr-0.5">
              <div 
                onClick={() => handleNavClick(currentUser?.role === 'ADMIN' ? 'admin' : 'profile', currentUser?.role === 'ADMIN' ? '/admin' : '/profile')}
                className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center font-extrabold text-xs uppercase shadow-xs border border-zinc-800 hover:ring-2 hover:ring-zinc-300 transition-all"
                title={currentUser?.role === 'ADMIN' ? 'Admin Control Center' : 'View Profile'}
              >
                {currentUser?.fullName?.[0] || currentUser?.email?.[0] || 'A'}
              </div>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-zinc-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                  <div className="text-xs font-bold text-zinc-900 truncate">{currentUser?.fullName || (currentUser?.role === 'ADMIN' ? 'Administrator' : 'User Account')}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{currentUser?.email || 'Logged in'}</div>
                </div>
                {currentUser?.role === 'ADMIN' ? (
                  <button
                    onClick={() => handleNavClick('admin', '/admin')}
                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-800 hover:bg-zinc-50 font-bold transition-colors border-b border-zinc-100 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" /> Admin Control Center
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavClick('profile', '/profile')}
                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-700 hover:bg-zinc-50 font-semibold transition-colors border-b border-zinc-100 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-zinc-500" /> My Profile & Plan
                  </button>
                )}
                <button
                  onClick={() => {
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.dispatchEvent(new Event('auth-change'));
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-semibold transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-red-500" /> Logout
                </button>
              </div>
            </div>
          )}

          {/* 2. WORKSPACE BUTTON (ALWAYS ON THE FAR RIGHT SIDE) */}
          <button 
            onClick={(e) => { e.preventDefault(); handleNavClick('workspace', '/workspace'); }}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border ${
              activeNav === 'workspace'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100'
                : 'bg-zinc-100/90 hover:bg-zinc-200/90 text-zinc-800 border-zinc-200/80'
            }`}
            title="Saved History & Workspace"
          >
            <Folder className="w-3.5 h-3.5 text-indigo-500" />
            <span>Workspace</span>
          </button>
        </div>
      </header>

      {isSignInModalOpen && <SignInModal onClose={() => setIsSignInModalOpen(false)} />}
    </>
  );
}
