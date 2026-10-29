import React, { useState } from 'react';
import { Sparkles, ArrowRight, Box, Layers, Wand2, Search, Sliders, Eye } from 'lucide-react';
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
    <div className="flex flex-col space-y-5 pb-24 px-4 pt-3">
      {/* Search Input Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search 3D packaging models, dielines, bottles..."
          className="w-full pl-9 pr-4 py-2.5 bg-white text-xs font-medium text-zinc-900 placeholder-zinc-400 rounded-2xl border border-zinc-200/80 shadow-2xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-3 flex items-center text-xs text-zinc-500 hover:text-zinc-700"
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
                className="bg-white p-2.5 rounded-2xl border border-zinc-200/80 shadow-2xs active:scale-98 transition-all flex flex-col cursor-pointer hover:border-indigo-300"
              >
                <div className="h-24 bg-zinc-50 rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2">
                  <img
                    src={item.imageUrl || '/images/boxes/rte_white.jpg'}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-indigo-600 font-semibold">{item.categoryName}</span>
                <h4 className="text-xs font-bold text-zinc-900 truncate">{item.name}</h4>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Quick Action Tiles */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => onNavigateTab('studio')}
              className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-3 rounded-2xl text-white text-left flex flex-col justify-between shadow-2xs active:scale-95 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <Box className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold block leading-tight">3D Studio</span>
                <span className="text-[9px] text-indigo-100 block">Live Viewer</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('models')}
              className="bg-zinc-950 p-3 rounded-2xl text-white text-left flex flex-col justify-between shadow-2xs active:scale-95 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-[11px] font-bold block leading-tight">All Models</span>
                <span className="text-[9px] text-zinc-400 block">Catalog</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('dielines')}
              className="bg-gradient-to-br from-[#c89a63] to-[#a37542] p-3 rounded-2xl text-white text-left flex flex-col justify-between shadow-2xs active:scale-95 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold block leading-tight">CAD Dielines</span>
                <span className="text-[9px] text-amber-100 block">Vector CAD</span>
              </div>
            </button>
          </div>

          {/* Real Interactive 3D Stage Card */}
          <div className="bg-zinc-950 text-white rounded-3xl p-4 shadow-xl border border-zinc-800 flex flex-col relative overflow-hidden">
            {/* Top Stage Header */}
            <div className="flex items-center justify-between mb-2 z-10">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                  Interactive 3D Stage
                </span>
              </div>

              {/* Substrate Pill Switcher */}
              <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-full">
                <button
                  onClick={() => setFeaturedSubstrate('white')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                    featuredSubstrate === 'white' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => setFeaturedSubstrate('kraft')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                    featuredSubstrate === 'kraft' ? 'bg-[#c89a63] text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Kraft
                </button>
                <button
                  onClick={() => setFeaturedSubstrate('metal')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                    featuredSubstrate === 'metal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Metal
                </button>
              </div>
            </div>

            {/* Quick Model Tabs (Sipper, Can, Box) */}
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-none py-1">
              {[
                { key: 'sipper_water_bottle', label: '1000ml Sipper Bottle' },
                { key: 'can', label: '12oz Can' },
                { key: 'rte', label: 'Reverse Tuck Box' },
                { key: 'rsc', label: 'Shipping Box' },
              ].map((m) => {
                const isActive = featuredModel === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setFeaturedModel(m.key)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                      isActive 
                        ? 'bg-zinc-800 text-amber-400 border-amber-500/40 shadow-xs' 
                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Live 3D Model Display */}
            <div className="relative w-full h-[240px] rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black overflow-hidden flex items-center justify-center border border-zinc-800/60">
              <Mobile3DViewer
                key={`${featuredModel}-${featuredSubstrate}`}
                modelType={featuredModel}
                substrate={featuredSubstrate}
                height={240}
                autoRotate={true}
              />
            </div>

            {/* Bottom Card Controls */}
            <div className="flex items-center justify-between pt-3 z-10">
              <div>
                <h3 className="text-xs font-bold text-white leading-tight">
                  {featuredModel === 'sipper_water_bottle' ? 'Sipper Water Bottle with Handle' : featuredModel === 'can' ? '12 oz Soda Can' : featuredModel === 'rsc' ? 'Square Shipping Box' : 'Reverse Tuck End Box'}
                </h3>
                <span className="text-[10px] text-zinc-400">Touch & rotate with single finger</span>
              </div>
              <button
                onClick={() => onOpenInStudio(featuredModel)}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <span>Edit 3D</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Packaging Categories Header */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-mono">
              Packaging Categories
            </h3>
            <button
              onClick={() => onNavigateTab('models')}
              className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Desktop-Aligned Packaging Categories Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {categoriesList.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onOpenInStudio(cat.key)}
                className="bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-2xs active:scale-98 transition-all flex flex-col justify-between cursor-pointer group hover:border-indigo-300"
              >
                <div className="h-24 bg-gradient-to-b from-zinc-50 to-zinc-100/60 rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2 group-hover:scale-102 transition-transform">
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="max-h-full max-w-full object-contain drop-shadow-xs"
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
