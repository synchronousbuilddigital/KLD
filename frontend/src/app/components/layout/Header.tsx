import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import AnimatedLogo from './AnimatedLogo';
import SignInModal from '../modals/SignInModal';

interface HeaderProps {
  activeNav?: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace' | 'aistudio' | 'admin';
  onNavigate?: (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace' | 'aistudio' | 'admin') => void;
}

const slideUpVariant = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

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
    const handleOpenSignInModal = () => setIsSignInModalOpen(true);
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('open-sign-in-modal', handleOpenSignInModal);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('open-sign-in-modal', handleOpenSignInModal);
    };
  }, []);

  const handleNavClick = (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'admin' | 'workspace' | 'aistudio', targetPath: string) => {
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

  return (
    <>
      <motion.header className="main-header" variants={slideUpVariant} initial="initial" whileInView="whileInView" viewport={{ once: true }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AnimatedLogo onClick={() => handleNavClick('landing', '/')} />
        </div>

        <nav className="nav-links">
          <a href="/3d-models" onClick={(e) => {
            e.preventDefault();
            handleNavClick('models', '/3d-models');
          }} className={`nav-link ${activeNav === 'models' ? 'active' : ''}`}>
            <svg className="nav-link-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
            3D Models
          </a>
          <a href="/dielines" onClick={(e) => {
            e.preventDefault();
            handleNavClick('dielines', '/dielines');
          }} className={`nav-link ${activeNav === 'dielines' ? 'active' : ''}`}>
            <svg className="nav-link-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></svg>
            Dieline Templates
          </a>
          <a href="/ai-studio" onClick={(e) => {
            e.preventDefault();
            handleNavClick('aistudio', '/ai-studio');
          }} className={`nav-link ${activeNav === 'aistudio' ? 'active' : ''} ai-nav-btn`}>
            <svg className="nav-link-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.27 1.27L3 12l5.8 1.9a2 2 0 0 1 1.27 1.27L12 21l1.9-5.8a2 2 0 0 1 1.27-1.27L21 12l-5.8-1.9a2 2 0 0 1-1.27-1.27L12 3Z" /></svg>
            AI creation
          </a>
          <a href="/pricing" onClick={(e) => {
            e.preventDefault();
            handleNavClick('pricing', '/pricing');
          }} className={`nav-link ${activeNav === 'pricing' ? 'active' : ''}`}>
            <svg className="nav-link-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            Pricing
          </a>
          <a href="/about-us" onClick={(e) => {
            e.preventDefault();
            handleNavClick('about', '/about-us');
          }} className={`nav-link ${activeNav === 'about' ? 'active' : ''}`}>
            <svg className="nav-link-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            About us
          </a>
        </nav>

        {/* RIGHT ACTION BUTTONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isLoggedIn ? (
            <div className="group relative cursor-pointer">
              <div
                onClick={() => handleNavClick(currentUser?.role === 'ADMIN' ? 'admin' : 'profile', currentUser?.role === 'ADMIN' ? '/admin' : '/profile')}
                className="w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center font-extrabold text-sm uppercase shadow-xs border border-zinc-800 hover:ring-2 hover:ring-zinc-300 transition-all"
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                    Admin Control Center
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavClick('profile', '/profile')}
                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-700 hover:bg-zinc-50 font-semibold transition-colors border-b border-zinc-100 flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    My Profile & Plan
                  </button>
                )}
                <button
                  onClick={() => {
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.dispatchEvent(new Event('auth-change'));
                    handleNavClick('landing', '/');
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-semibold transition-colors flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-header" onClick={() => setIsSignInModalOpen(true)}>
              Start Designing <span className="arrow">→</span>
            </button>
          )}

          <button
            onClick={(e) => { e.preventDefault(); handleNavClick('workspace', '/workspace'); }}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border ${
              activeNav === 'workspace'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-zinc-100/90 hover:bg-zinc-200/90 text-zinc-800 border-zinc-200/80'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={activeNav === 'workspace' ? '#ffffff' : '#6366f1'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></svg>
            <span>Workspace</span>
          </button>
        </div>
      </motion.header>

      {isSignInModalOpen && <SignInModal onClose={() => setIsSignInModalOpen(false)} />}
    </>
  );
}
