import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Sparkles, Box, Layers, Filter } from 'lucide-react';
import Header from '../components/layout/Header';
import PackagingCollections from './PackagingCollections';
import BackgroundCanvas from '../components/layout/BackgroundCanvas';
import ElasticFooter from '../components/layout/ElasticFooter';
import '../../styles/new-home.css';

interface ModelsPageProps {
  onNavigate: (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace') => void;
  onCategorySelect: (categoryId: string) => void;
}

export default function ModelsPage({ onNavigate, onCategorySelect }: ModelsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="new-home-landing min-h-screen font-sans flex flex-col relative z-0 bg-white">
      <BackgroundCanvas position="fixed" zIndex={0} />

      {/* Navigation Header */}
      <Header activeNav="models" onNavigate={onNavigate} />

      {/* Hero Header Banner */}
      <div className="relative pt-12 pb-8 px-6 text-center max-w-5xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-semibold mb-6 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Interactive 3D Packaging Library
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 mb-4 uppercase"
        >
          3D Models & Mockups
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto mb-8 font-normal leading-relaxed"
        >
          Explore photorealistic, customizable 3D packaging structures from rigid mailer boxes to bottles, cans, pouches, and tubes.
        </motion.p>
      </div>

      {/* Main Grid Content */}
      <main className="flex-1 relative z-10 pb-16">
        <PackagingCollections onCategorySelect={onCategorySelect} />
      </main>

      {/* Footer */}
      <ElasticFooter />
    </div>
  );
}
