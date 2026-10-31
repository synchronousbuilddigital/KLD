import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Box, 
  Layers, 
  Wand2, 
  Search, 
  Folder, 
  ChevronRight, 
  RotateCw 
} from 'lucide-react';
import Mobile3DViewer from './Mobile3DViewer';
import { mockupCategories, MockupVariant } from '../../data/mockupData';
import { MobileTab } from './MobileTabBar';

interface MobileHomeTabProps {
  onNavigateTab: (tab: MobileTab) => void;
  onSelectModel: (model: MockupVariant, catName: string) => void;
  onOpenInStudio: (modelKey: string) => void;
}

export const MobileHomeTab: React.FC<MobileHomeTabProps> = ({
  onNavigateTab,
  onSelectModel,
  onOpenInStudio,
}) => {
  const [featuredModel, setFeaturedModel] = useState<string>('sipper_water_bottle');
  const [featuredSubstrate, setFeaturedSubstrate] = useState<'white' | 'kraft' | 'metal'>('white');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all real models across categories
  const allModels = mockupCategories.flatMap(cat => 
    cat.variants.map(v => ({ ...v, categoryName: cat.name.replace(' Mockups', '') }))
  );

  const filteredModels = searchQuery.trim() 
    ? allModels.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || (m.boxModelKey || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : allModels;

  // Real desktop categories
  const categoriesList = [
    { id: 'box-mockups', name: 'Box Mockups', count: '7 Models', img: '/images/boxes/rte_white.jpg', key: 'rte' },
    { id: 'bottle-mockups', name: 'Bottle Mockups', count: '22 Models', img: '/images/sipper_water_bottle.png', key: 'sipper_water_bottle' },
    { id: 'can-mockups', name: 'Can Mockups', count: '20 Models', img: '/images/can.png', key: 'can' },
    { id: 'tube-mockups', name: 'Tube Mockups', count: '18 Models', img: '/images/toothpaste_tube_mockup.png', key: 'tube' },
    { id: 'pouch-bag-mockups', name: 'Pouch / Bag', count: '20 Models', img: '/images/boxes/rsc_kraft.jpg', key: 'rsc' },
  ];

  return (
    <div className="flex flex-col space-y-4 pb-28 px-4 pt-3 select-none">
      {/* Search Input Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search 3D packaging models, dielines, bottles..."
          className="w-full pl-10 pr-4 py-2.5 bg-white text-xs font-medium text-zinc-900 placeholder-zinc-400 rounded-xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] focus:border-zinc-400 transition-all outline-none"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-3 flex items-center text-xs text-zinc-400 hover:text-zinc-600 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* If Searching: Instant Results Grid */}
      {searchQuery.trim() ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800">Search Results ({filteredModels.length})</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {filteredModels.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectModel(item, item.categoryName)}
                className="bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all flex flex-col cursor-pointer hover:border-zinc-300"
              >
                <div className="h-24 bg-[#f8f7f5] rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2">
                  <img
                    src={item.imageUrl || '/images/boxes/rte_white.jpg'}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 font-semibold">{item.categoryName}</span>
                <h4 className="text-xs font-bold text-zinc-900 truncate mt-0.5">{item.name}</h4>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Quick Action Cards - Professional 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 3D Studio Card */}
            <button
              onClick={() => onNavigateTab('studio')}
              className="bg-white p-3.5 rounded-2xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all hover:border-zinc-300 text-left flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-indigo-600" />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block leading-tight">3D Studio</span>
                <span className="text-[10px] text-zinc-500 font-medium block mt-0.5">Interactive 3D Editor</span>
              </div>
            </button>

            {/* 3D Models Catalog Card */}
            <button
              onClick={() => onNavigateTab('models')}
              className="bg-white p-3.5 rounded-2xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all hover:border-zinc-300 text-left flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200/60 flex items-center justify-center">
                  <Box className="w-4 h-4 text-zinc-900" />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block leading-tight">3D Models</span>
                <span className="text-[10px] text-zinc-500 font-medium block mt-0.5">Full Packaging Catalog</span>
              </div>
            </button>

            {/* CAD Dielines Card */}
            <button
              onClick={() => onNavigateTab('dielines')}
              className="bg-white p-3.5 rounded-2xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all hover:border-zinc-300 text-left flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-amber-700" />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block leading-tight">CAD Dielines</span>
                <span className="text-[10px] text-zinc-500 font-medium block mt-0.5">Parametric 2D Vectors</span>
              </div>
            </button>

            {/* My Workspace Card */}
            <button
              onClick={() => onNavigateTab('workspace')}
              className="bg-white p-3.5 rounded-2xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all hover:border-zinc-300 text-left flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
                  <Folder className="w-4 h-4 text-emerald-600" />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block leading-tight">My Workspace</span>
                <span className="text-[10px] text-zinc-500 font-medium block mt-0.5">Saved Designs & Drafts</span>
              </div>
            </button>
          </div>

          {/* Real Interactive 3D Stage Card - Sleek Dark Studio Theme */}
          <div className="bg-[#121316] text-white rounded-3xl p-4 shadow-xl shadow-zinc-950/15 border border-zinc-800 flex flex-col relative overflow-hidden">
            {/* Top Stage Header */}
            <div className="flex items-center justify-between mb-2.5 z-10">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>3D LIVE STAGE</span>
              </div>

              {/* Substrate Pill Switcher */}
              <div className="flex items-center gap-0.5 bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-full">
                <button
                  onClick={() => setFeaturedSubstrate('white')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] transition-all ${
                    featuredSubstrate === 'white' 
                      ? 'bg-white text-zinc-950 font-bold shadow-xs' 
                      : 'text-zinc-400 hover:text-white font-medium'
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => setFeaturedSubstrate('kraft')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] transition-all ${
                    featuredSubstrate === 'kraft' 
                      ? 'bg-[#c89a63] text-zinc-950 font-bold shadow-xs' 
                      : 'text-zinc-400 hover:text-white font-medium'
                  }`}
                >
                  Kraft
                </button>
                <button
                  onClick={() => setFeaturedSubstrate('metal')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] transition-all ${
                    featuredSubstrate === 'metal' 
                      ? 'bg-zinc-200 text-zinc-950 font-bold shadow-xs' 
                      : 'text-zinc-400 hover:text-white font-medium'
                  }`}
                >
                  Metal
                </button>
              </div>
            </div>

            {/* Quick Model Tabs */}
            <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto scrollbar-none py-0.5">
              {[
                { key: 'sipper_water_bottle', label: '1000ml Bottle' },
                { key: 'can', label: '12oz Can' },
                { key: 'rte', label: 'Reverse Tuck Box' },
                { key: 'rsc', label: 'Shipping Box' },
              ].map((m) => {
                const isActive = featuredModel === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setFeaturedModel(m.key)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all border ${
                      isActive 
                        ? 'bg-white text-zinc-950 font-semibold border-white shadow-xs' 
                        : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Live 3D Model Display */}
            <div className="relative w-full h-[240px] rounded-2xl bg-gradient-to-b from-[#1b1c20] via-[#131417] to-[#0b0b0d] overflow-hidden flex items-center justify-center border border-zinc-800/80">
              <Mobile3DViewer
                key={`${featuredModel}-${featuredSubstrate}`}
                modelType={featuredModel}
                substrate={featuredSubstrate}
                height={240}
                autoRotate={true}
              />
              {/* Interaction Hint Pill */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-zinc-300 flex items-center gap-1.5 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Touch & Spin 360°</span>
              </div>
            </div>

            {/* Bottom Card Controls */}
            <div className="flex items-center justify-between pt-3.5 z-10">
              <div>
                <h3 className="text-xs font-bold text-white leading-tight">
                  {featuredModel === 'sipper_water_bottle' ? 'Sipper Water Bottle with Handle' : featuredModel === 'can' ? '12 oz Aluminum Soda Can' : featuredModel === 'rsc' ? 'Square Shipping Box' : 'Reverse Tuck End Box'}
                </h3>
                <span className="text-[10px] text-zinc-400 font-medium">Real-time WebGL studio render</span>
              </div>
              <button
                onClick={() => onOpenInStudio(featuredModel)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <span>Edit 3D</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-900" />
              </button>
            </div>
          </div>

          {/* Packaging Categories Header */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-xs font-bold text-zinc-900 tracking-tight">
              Packaging Categories
            </h3>
            <button
              onClick={() => onNavigateTab('models')}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Packaging Categories Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {categoriesList.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onOpenInStudio(cat.key)}
                className="bg-white p-3 rounded-2xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all flex flex-col justify-between cursor-pointer group hover:border-zinc-300"
              >
                <div className="h-26 bg-[#f8f7f5] rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2 group-hover:scale-[1.02] transition-transform">
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 leading-tight">{cat.name}</h4>
                  <span className="text-[10px] text-zinc-500 font-medium">{cat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MobileHomeTab;
