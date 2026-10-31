import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useMobileDetection() {
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  const [viewModeOverride, setViewModeOverride] = useState<'mobile' | null>(() => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam === 'mobile') return 'mobile';
    return null;
  });

  useEffect(() => {
    // Clear any legacy desktop override from session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('kld_view_mode');
    }
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileAppActive = isMobileScreen || viewModeOverride === 'mobile';

  return {
    isMobileScreen,
    viewModeOverride,
    isMobileAppActive,
    switchToMobile: () => setViewModeOverride('mobile'),
  };
}
