import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useMobileDetection() {
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  const [viewModeOverride, setViewModeOverride] = useState<'mobile' | 'desktop' | null>(() => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam === 'desktop') return 'desktop';
    if (viewParam === 'mobile') return 'mobile';
    const stored = sessionStorage.getItem('kld_view_mode');
    return stored === 'desktop' || stored === 'mobile' ? stored : null;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setViewMode = (mode: 'mobile' | 'desktop' | 'auto') => {
    if (mode === 'auto') {
      sessionStorage.removeItem('kld_view_mode');
      setViewModeOverride(null);
    } else {
      sessionStorage.setItem('kld_view_mode', mode);
      setViewModeOverride(mode);
    }
  };

  const isMobileAppActive = viewModeOverride === 'desktop' 
    ? false 
    : (viewModeOverride === 'mobile' || isMobileScreen);

  return {
    isMobileScreen,
    viewModeOverride,
    isMobileAppActive,
    switchToDesktop: () => setViewMode('desktop'),
    switchToMobile: () => setViewMode('mobile'),
    resetToAuto: () => setViewMode('auto'),
  };
}
