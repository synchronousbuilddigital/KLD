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
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
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
      <header className="main-header transition-all duration-200">
        
        {/* LOGO */}
        <div 
          className="logo group flex items-center gap-3 cursor-pointer select-none" 
          onClick={() => handleNavClick('landing', '/')}
        >
          <div className="w-10 h-10 rounded-xl bg-[#C89A63] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <span className="font-black tracking-widest text-base text-zinc-950">KEYLINE DESIGN</span>
        </div>

        {/* CENTER NAVIGATION LINKS */}
        <nav className="nav-links flex items-center gap-2 bg-zinc-100/90 p-2 rounded-full border border-zinc-200/80 shadow-inner">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => { e.preventDefault(); handleNavClick(item.id as any, item.path); }}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-150 ${
                  isActive 
                    ? 'bg-white text-zinc-950 shadow-md font-extrabold border border-zinc-200/90 scale-[1.02]' 
                    : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-200/60'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* RIGHT ACTION BUTTONS — START DESIGNING FIRST, WORKSPACE SHIFTED RIGHT */}
        <div className="flex items-center gap-3">
          
          {/* 1. START DESIGNING BUTTON (LEFT) */}
          <button 
            className="btn btn-header group bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-extrabold px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            onClick={() => setIsSignInModalOpen(true)}
          >
            <span>Start Designing</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 2. WORKSPACE BUTTON (SHIFTED TO THE RIGHT OF START DESIGNING) */}
          <button 
            onClick={(e) => { e.preventDefault(); handleNavClick('workspace', '/workspace'); }}
            className={`px-5 py-2.5 rounded-full text-sm font-extrabold flex items-center gap-2 transition-all border shadow-sm ${
              activeNav === 'workspace'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100'
                : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border-zinc-200/90'
            }`}
            title="Saved History & Workspace"
          >
            <Folder className="w-4 h-4 text-indigo-500" />
            <span>Workspace</span>
          </button>

          {/* USER PROFILE AVATAR DROPDOWN IF LOGGED IN */}
          {isLoggedIn && (
            <div className="group relative cursor-pointer ml-1">
              <div 
                onClick={() => handleNavClick(currentUser?.role === 'ADMIN' ? 'admin' : 'profile', currentUser?.role === 'ADMIN' ? '/admin' : '/profile')}
                className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-extrabold text-base uppercase shadow-sm border border-zinc-800"
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
        </div>
      </header>

      {isSignInModalOpen && <SignInModal onClose={() => setIsSignInModalOpen(false)} />}
    </>
  );
}
