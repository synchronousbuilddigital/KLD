import React, { useEffect } from 'react';
import Header from '../components/layout/Header';
import PackagingCollections from './PackagingCollections';
import BackgroundCanvas from '../components/layout/BackgroundCanvas';
import '../../styles/new-home.css';

interface ModelsPageProps {
  onNavigate: (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace') => void;
  onCategorySelect: (categoryId: string) => void;
}

export default function ModelsPage({ onNavigate, onCategorySelect }: ModelsPageProps) {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="new-home-landing min-h-screen font-sans flex flex-col justify-between relative z-0 bg-white !pt-0">
      <BackgroundCanvas position="fixed" zIndex={0} />

      {/* Navigation Header */}
      <Header activeNav="models" onNavigate={onNavigate} />

      {/* Main Grid Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-start items-center pt-32 pb-12 w-full">
        <div className="w-full max-w-[1440px] px-4 md:px-8">
          <PackagingCollections onCategorySelect={onCategorySelect} isModelsPage={true} />
        </div>
      </main>
    </div>
  );
}
