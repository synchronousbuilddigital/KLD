// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Box, 
  Layers, 
  Sparkles, 
  ChevronRight, 
  Grid, 
  PackageCheck, 
  FileText, 
  Scissors,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import Header from '../components/layout/Header';
import TemplateLibraryPage, { TemplateDetailCard } from './TemplateLibraryPage';
import TopDielineTemplates from './TopDielineTemplates';
import ElasticFooter from '../components/layout/ElasticFooter';
import BoxStudioModal from './BoxStudioModal';

interface DielinesPageProps {
  onNavigate: (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace') => void;
}

const CATEGORY_ITEMS = [
  { id: 'all', label: 'All Box Models', count: 4, icon: Box, color: 'text-indigo-600' },
  { id: 'te', label: 'Straight Tuck End (STE)', count: 1, icon: PackageCheck, color: 'text-blue-600' },
  { id: 'rte', label: 'Reverse Tuck End (RTE)', count: 1, icon: Layers, color: 'text-emerald-600' },
  { id: 'auto_lock', label: 'Auto Lock Bottom', count: 1, icon: Sparkles, color: 'text-amber-600' },
  { id: 'cake', label: 'Cake & Handle Boxes', count: 1, icon: Scissors, color: 'text-rose-600' },
  { id: 'folding', label: 'Folding Box Templates', count: 'CAD', icon: FolderOpen, color: 'text-zinc-600' },
  { id: 'tuck_end', label: 'Tuck End Templates', count: 'CAD', icon: FolderOpen, color: 'text-zinc-600' },
  { id: 'paper_bag', label: 'Paper Bag Templates', count: 'CAD', icon: FolderOpen, color: 'text-zinc-600' },
  { id: 'box_lid', label: 'Box with Lid Templates', count: 'CAD', icon: FolderOpen, color: 'text-zinc-600' },
  { id: 'display_box', label: 'Display Box Templates', count: 'CAD', icon: FolderOpen, color: 'text-zinc-600' },
  { id: 'tray_box', label: 'Tray Box Templates', count: 'CAD', icon: FolderOpen, color: 'text-zinc-600' },
  { id: 'rigid_box', label: 'Rigid Box Templates', count: 'CAD', icon: FolderOpen, color: 'text-zinc-600' },
  { id: 'envelope', label: 'Envelope Templates', count: 'CAD', icon: FolderOpen, color: 'text-zinc-600' },
];

export default function DielinesPage({ onNavigate }: DielinesPageProps) {
  const [selectedBoxModel, setSelectedBoxModel] = useState<"rte" | "te" | "auto_lock" | "cake" | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.zoom = '1';
    document.body.style.width = '100%';
    document.body.style.overflowX = 'hidden';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.zoom = '';
      document.body.style.width = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
    if (category === 'tuck_end' || category === 'folding' || category === 'rte') {
      setSelectedBoxModel('rte');
    } else if (category === 'paper_bag' || category === 'envelope' || category === 'cake') {
      setSelectedBoxModel('cake');
    } else if (category === 'box_lid' || category === 'rigid_box' || category === 'auto_lock') {
      setSelectedBoxModel('auto_lock');
    } else if (category === 'te') {
      setSelectedBoxModel('te');
    }
  };

  const filteredCards = [
    { id: 'te', title: 'Straight Tuck End Box', type: 'straight', model: 'te' },
    { id: 'rte', title: 'Reverse Tuck End Box', type: 'reverse', model: 'rte' },
    { id: 'auto_lock', title: 'Auto Lock Bottom Box', type: 'auto_lock', model: 'auto_lock' },
    { id: 'cake', title: 'Cake Box with Handle & Window', type: 'cake', model: 'cake' },
  ].filter(card => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'te' && card.model === 'te') return true;
    if (activeCategory === 'rte' && (card.model === 'rte' || activeCategory === 'tuck_end' || activeCategory === 'folding')) return true;
    if (activeCategory === 'auto_lock' && (card.model === 'auto_lock' || activeCategory === 'box_lid' || activeCategory === 'rigid_box')) return true;
    if (activeCategory === 'cake' && (card.model === 'cake' || activeCategory === 'paper_bag' || activeCategory === 'envelope')) return true;
    return true;
  });

  return (
    <div className="min-h-screen font-sans flex flex-col bg-white text-zinc-900 pt-[72px]">
      {/* Navigation Header */}
      <Header activeNav="dielines" onNavigate={onNavigate} />

      {/* Main Page Layout with Left Sidebar */}
      <div className="w-full max-w-[1700px] mx-auto px-4 md:px-8 py-8 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* LEFT SIDEBAR PANEL FOR CATEGORIES */}
        <aside className="w-full md:w-72 shrink-0">
          <div className="sticky top-24 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-zinc-900 text-base">Categories</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                13 Categories
              </span>
            </div>

            <nav className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {CATEGORY_ITEMS.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeCategory === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveCategory(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive 
                        ? 'bg-zinc-900 text-white shadow-md' 
                        : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isActive ? 'bg-zinc-700 text-white' : 'bg-zinc-200/80 text-zinc-600'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-zinc-200 text-center">
              <p className="text-[11px] text-zinc-400 font-medium">
                DXF • PDF • SVG Print Vector Standards
              </p>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 flex flex-col gap-10">
          
          {/* HERO TITLE HEADER */}
          <div className="bg-gradient-to-r from-zinc-50 via-indigo-50/20 to-zinc-50 border border-zinc-200/70 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-200 mb-3">
                ✨ 4 Production-Ready Box Models
              </div>
              <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight text-zinc-900 leading-tight">
                Interactive Dieline & Box Studio
              </h1>
              <p className="text-zinc-600 text-sm md:text-base max-w-2xl mt-2 leading-relaxed">
                Select any box model below to customize dimensions, view 2D vector dielines, fold/unfold in 3D, and export print-ready DXF, PDF, or SVG files.
              </p>
            </div>
          </div>

          {/* ACTIVE BOX MODELS GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <Box className="w-5 h-5 text-indigo-600" />
                Featured Production Dieline Models
              </h2>
              {activeCategory !== 'all' && (
                <button
                  onClick={() => setActiveCategory('all')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Show All Models
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCards.map((card) => (
                <TemplateDetailCard
                  key={card.id}
                  title={card.title}
                  type={card.type}
                  onClick={() => setSelectedBoxModel(card.model as any)}
                />
              ))}
            </div>
          </div>

          {/* CATEGORY EXPLORER */}
          <div className="border-t border-zinc-200 pt-8">
            <TopDielineTemplates onNavigate={handleCategorySelect} />
          </div>

        </main>
      </div>

      {/* STUDIO MODAL */}
      {selectedBoxModel && (
        <BoxStudioModal
          isOpen={!!selectedBoxModel}
          onClose={() => setSelectedBoxModel(null)}
          initialModel={selectedBoxModel}
        />
      )}

      {/* Footer */}
      <ElasticFooter />
    </div>
  );
}
