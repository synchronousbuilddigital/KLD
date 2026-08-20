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
  FolderOpen,
  Search
} from 'lucide-react';
import Header from '../components/layout/Header';
import TemplateLibraryPage, { TemplateDetailCard } from './TemplateLibraryPage';
import TopDielineTemplates from './TopDielineTemplates';
import BoxStudioModal from './BoxStudioModal';

interface DielinesPageProps {
  onNavigate: (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace') => void;
}

const CATEGORY_ITEMS = [
  { id: 'all', label: 'All Box Models', count: 4, icon: Box, color: 'text-indigo-600' },
  { id: 'te', label: 'Straight Tuck End (STE)', count: 1, icon: PackageCheck, color: 'text-blue-600' },
  { id: 'rte', label: 'Reverse Tuck End (RTE)', count: 1, icon: Layers, color: 'text-emerald-600' },
  { id: 'auto_lock', label: 'Auto Lock Bottom', count: 1, icon: Sparkles, color: 'text-amber-600' },
  { id: 'cosmetic', label: 'Cosmetic Boxes', count: 1, icon: Scissors, color: 'text-rose-600' },
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
  const [selectedBoxModel, setSelectedBoxModel] = useState<"rte" | "te" | "auto_lock" | "cosmetic" | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

    const cleanDefaultState = {
      L: 4.7244,
      W: 2.3622,
      H: 6.2992,
      T: 0.0197,
      glueFlapWidth: 0.625,
      bleed: 2 / 25.4,
      sizeMode: "manufacture",
      materialType: "paperboard",
      materialName: "350g white paperboard(0.5mm)",
      isCustomMaterial: false,
      materialColor: "#fdfbf7",
      materialCategory: "white_paperboard",
      packageColor: null,
      insideColor: null
    };

    let targetModel: 'rte' | 'te' | 'auto_lock' | 'cosmetic' = 'rte';
    if (category === 'tuck_end' || category === 'folding' || category === 'rte') {
      targetModel = 'rte';
    } else if (category === 'paper_bag' || category === 'envelope' || category === 'cosmetic') {
      targetModel = 'cosmetic';
    } else if (category === 'box_lid' || category === 'rigid_box' || category === 'auto_lock') {
      targetModel = 'auto_lock';
    } else if (category === 'te') {
      targetModel = 'te';
    }

    useBoxStore.setState({ boxModel: targetModel, ...cleanDefaultState });
    setSelectedBoxModel(targetModel);
  };

  const filteredCards = [
    { id: 'te', title: 'Straight Tuck End Box', type: 'straight', model: 'te', categories: ['all', 'te'] },
    { id: 'rte', title: 'Reverse Tuck End Box', type: 'reverse', model: 'rte', categories: ['all', 'rte', 'tuck_end', 'folding'] },
    { id: 'auto_lock', title: 'Auto Lock Bottom Box', type: 'auto_lock', model: 'auto_lock', categories: ['all', 'auto_lock', 'box_lid', 'rigid_box'] },
    { id: 'cosmetic', title: 'Cosmetic Box', type: 'cosmetic', model: 'cosmetic', categories: ['all', 'cosmetic', 'paper_bag', 'envelope'] },
  ].filter(card => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesTitle = card.title.toLowerCase().includes(q);
      const matchesType = card.type.toLowerCase().includes(q);
      if (!matchesTitle && !matchesType) return false;
    }

    if (activeCategory === 'all') return true;
    return card.categories.includes(activeCategory);
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
        <main className="flex-1 min-w-0 flex flex-col gap-8">
          
          {/* TOP SECTION HEADER WITH SEARCH BAR IN RIGHT CORNER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
                <Box className="w-6 h-6 text-indigo-600" />
                Featured Production Dieline Models
              </h2>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                Vector 2D/3D parametric dieline models with DXF, PDF, SVG export
              </p>
            </div>

            {/* Search Input Bar in Right Corner */}
            <div className="relative w-full sm:w-80 shrink-0">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search box models & dielines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-zinc-50 hover:bg-zinc-100/60 border border-zinc-200/90 rounded-xl text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-zinc-200 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ACTIVE BOX MODELS GRID */}
          <div className="space-y-4">
            {activeCategory !== 'all' && (
              <div className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-2">
                <span className="text-xs font-semibold text-indigo-900">
                  Filtering by: <span className="font-bold">{CATEGORY_ITEMS.find(c => c.id === activeCategory)?.label || activeCategory}</span>
                </span>
                <button
                  onClick={() => setActiveCategory('all')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {filteredCards.length > 0 ? (
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
            ) : (
              <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-1">
                  <Box className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">No Production 3D Box Models Found</h3>
                <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                  {searchQuery 
                    ? `No 3D box models matched your search "${searchQuery}".` 
                    : `Currently no production 3D box models are available for category "${CATEGORY_ITEMS.find(c => c.id === activeCategory)?.label || activeCategory}".`}
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  className="mt-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  Show All Production Box Models
                </button>
              </div>
            )}
          </div>

          {/* CATEGORY EXPLORER */}
          <div className="border-t border-zinc-200 pt-6">
            <TopDielineTemplates onNavigate={handleCategorySelect} searchQuery={searchQuery} />
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
    </div>
  );
}
