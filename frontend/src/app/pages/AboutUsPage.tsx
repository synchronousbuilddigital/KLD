import React, { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '../components/layout/Header';
import BackgroundCanvas from '../components/layout/BackgroundCanvas';
import CinematicAbout from '../components/about/CinematicAbout';
import ElasticFooter from '../components/layout/ElasticFooter';

interface AboutUsPageProps {
  onNavigate?: (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace' | 'aistudio' | 'admin') => void;
}

export default function AboutUsPage({ onNavigate }: AboutUsPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.zoom = '1';
    document.body.style.width = '100%';
    
    // Refresh GSAP ScrollTrigger after layout settles
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(timer);
      document.body.style.zoom = '';
      document.body.style.width = '';
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FAF8F4] text-zinc-900 font-sans antialiased">
      <BackgroundCanvas position="fixed" zIndex={0} />
      <Header activeNav="about" onNavigate={onNavigate} />
      <div className="relative z-10">
        <CinematicAbout onNavigate={onNavigate} />
      </div>
      <ElasticFooter />
    </div>
  );
}
