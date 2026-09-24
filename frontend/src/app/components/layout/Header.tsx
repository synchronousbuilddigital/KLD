// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Box, Layers, Sparkles, Tag, Users, Folder, LogIn, LogOut, Shield, User } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('open-sign-in-modal', handleOpenSignInModal);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleNavClick = (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'admin' | 'workspace' | 'aistudio', targetPath: string) => {
    setIsMobileMenuOpen(false);
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
    { id: 'models', label: '3D Models', path: '/3d-models', icon: Box },
    { id: 'dielines', label: 'Dieline Templates', path: '/dielines', icon: Layers },
    { id: 'aistudio', label: 'AI Creation', path: '/ai-studio', icon: Sparkles, isAi: true },
    { id: 'pricing', label: 'Pricing', path: '/pricing', icon: Tag },
    { id: 'about', label: 'About Us', path: '/about-us', icon: Users },
  ];

  return (
    <>
      <motion.header className="main-header" variants={slideUpVariant} initial="initial" whileInView="whileInView" viewport={{ once: true }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AnimatedLogo onClick={() => handleNavClick('landing', '/')} />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links hidden lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id as any, item.path);
                }}
                className={`nav-link ${isActive ? 'active' : ''} ${item.isAi ? 'ai-nav-btn' : ''}`}
              >
                <Icon className="nav-link-icon" width={15} height={15} />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* RIGHT ACTION BUTTONS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Workspace Button */}
          <button
            onClick={(e) => { e.preventDefault(); handleNavClick('workspace', '/workspace'); }}
            className={`px-3 sm:px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border ${
              activeNav === 'workspace'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-zinc-100/90 hover:bg-zinc-200/90 text-zinc-800 border-zinc-200/80'
            }`}
          >
            <Folder className={`w-3.5 h-3.5 ${activeNav === 'workspace' ? 'text-white' : 'text-indigo-600'}`} />
            <span className="hidden xs:inline">Workspace</span>
          </button>

          {/* Desktop Auth / Profile Dropdown */}
          <div className="hidden sm:flex items-center">
            {isLoggedIn ? (
              <div className="group relative cursor-pointer">
                <div
                  onClick={() => handleNavClick(currentUser?.role === 'ADMIN' ? 'admin' : 'profile', currentUser?.role === 'ADMIN' ? '/admin' : '/profile')}
                  className="w-9 h-9 rounded-full bg-zinc-950 text-white flex items-center justify-center font-extrabold text-sm uppercase shadow-xs border border-zinc-800 hover:ring-2 hover:ring-zinc-300 transition-all"
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
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      Admin Control Center
                    </button>
                  ) : (
                    <button
                      onClick={() => handleNavClick('profile', '/profile')}
                      className="w-full text-left px-4 py-2.5 text-xs text-zinc-700 hover:bg-zinc-50 font-semibold transition-colors border-b border-zinc-100 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-zinc-600" />
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
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn btn-header text-xs py-2 px-3.5" onClick={() => setIsSignInModalOpen(true)}>
                Start Designing <span className="arrow">→</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100/90 hover:bg-zinc-200 text-zinc-900 border border-zinc-200/80 transition-all cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* MOBILE NAVIGATION DRAWER & BACKDROP */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[9999] lg:hidden">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Slide-out Mobile Menu Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute top-0 right-0 bottom-0 w-[84%] max-w-[340px] bg-[#FAF8F4] border-l border-zinc-200 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              {/* Drawer Top Header */}
              <div className="p-5 border-b border-zinc-200/80 flex items-center justify-between bg-white/60 backdrop-blur-sm">
                <AnimatedLogo onClick={() => handleNavClick('landing', '/')} />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Links List */}
              <div className="flex-1 p-5 space-y-1.5 overflow-y-auto">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold px-3 py-1">
                  Navigation
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id as any, item.path)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-zinc-900 text-white shadow-md'
                          : 'text-zinc-700 hover:bg-zinc-200/60 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isAi ? 'text-amber-600' : 'text-zinc-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.isAi && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 font-bold">
                          AI
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  onClick={() => handleNavClick('workspace', '/workspace')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeNav === 'workspace'
                      ? 'bg-zinc-900 text-white shadow-md'
                      : 'text-zinc-700 hover:bg-zinc-200/60 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Folder className={`w-4 h-4 ${activeNav === 'workspace' ? 'text-white' : 'text-indigo-600'}`} />
                    <span>My Workspace</span>
                  </div>
                </button>
              </div>

              {/* Drawer Bottom Auth Section */}
              <div className="p-5 border-t border-zinc-200/80 bg-white/80 backdrop-blur-sm space-y-3">
                {isLoggedIn ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-100/80">
                      <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-black text-sm uppercase">
                        {currentUser?.fullName?.[0] || currentUser?.email?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-zinc-900 truncate">
                          {currentUser?.fullName || (currentUser?.role === 'ADMIN' ? 'Admin' : 'User')}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">
                          {currentUser?.email || 'Signed in'}
                        </div>
                      </div>
                    </div>

                    {currentUser?.role === 'ADMIN' ? (
                      <button
                        onClick={() => handleNavClick('admin', '/admin')}
                        className="w-full py-2.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Admin Control Center
                      </button>
                    ) : (
                      <button
                        onClick={() => handleNavClick('profile', '/profile')}
                        className="w-full py-2.5 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        My Profile &amp; Plan
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
                      className="w-full py-2 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsSignInModalOpen(true);
                      }}
                      className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In / Register
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isSignInModalOpen && <SignInModal onClose={() => setIsSignInModalOpen(false)} />}
    </>
  );
}

