import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Eye, Box, X } from 'lucide-react';
import { mockupCategories, MockupVariant } from '../../data/mockupData';

interface MobileModelsTabProps {
  onSelectModel: (model: MockupVariant, catName: string) => void;
  onOpenInStudio: (modelKey: string) => void;
  initialCategoryId?: string | null;
}

export const MobileModelsTab: React.FC<MobileModelsTabProps> = ({ 
  onSelectModel, 
  onOpenInStudio, 
  initialCategoryId 
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>(initialCategoryId || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all variants with their category metadata
  const allVariants = useMemo(() => {
    return mockupCategories.flatMap(c => 
      c.variants.map(v => ({ 
        ...v, 
        categoryId: c.id,
        categoryName: c.name.replace(' Mockups', '') 
      }))
    );
  }, []);

  // Category counts
  const categories = useMemo(() => [
    { id: 'all', name: 'All Models', count: allVariants.length },
    ...mockupCategories.map(c => ({ 
      id: c.id, 
      name: c.name.replace(' Mockups', ''), 
      count: c.variants.length 
    }))
  ], [allVariants]);

  // Search & Filter
  const filteredVariants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    
    // Split search words for flexible multi-word matching
    const searchTerms = q ? q.split(/\s+/).filter(Boolean) : [];

    const matchesItem = (item: typeof allVariants[0]) => {
      if (searchTerms.length === 0) return true;
      const searchableText = `${item.name} ${item.categoryName} ${item.boxModelKey || ''} ${item.animation || ''} ${item.description || ''} ${item.material || ''}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    };

    // If search query is active and category is specific, check if the specific category has matches
    if (selectedCatId !== 'all') {
      const inCategory = allVariants.filter(item => item.categoryId === selectedCatId && matchesItem(item));
      // If user typed search and found results in current category, return them
      if (inCategory.length > 0 || !q) {
        return inCategory;
      }
      // If no results in selected category but search query is active, fallback to global search across all categories!
      return allVariants.filter(matchesItem);
    }

    // Default 'all' category
    return allVariants.filter(matchesItem);
  }, [allVariants, selectedCatId, searchQuery]);

  return (
    <div className="flex flex-col space-y-4 pb-24 px-4 pt-3">
      {/* Search Input */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by name (e.g. sipper, can, shipping)..."
          className="w-full pl-9 pr-9 py-2.5 bg-white text-xs font-medium text-zinc-900 placeholder-zinc-400 rounded-2xl border border-zinc-200/80 shadow-2xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-700 cursor-pointer p-1"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 select-none">
        {categories.map((cat) => {
          const isActive = selectedCatId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-xs scale-100'
                  : 'bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-100 active:scale-95'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search results banner if search query is active */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
          <span>Found <strong>{filteredVariants.length}</strong> matching models</span>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedCatId('all'); }}
            className="text-indigo-600 font-semibold hover:underline cursor-pointer"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* 2-Column Packaging Cards Grid */}
      {filteredVariants.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredVariants.map((item) => (
            <div
              key={`${item.categoryId}-${item.id}-${item.name}`}
              onClick={() => onSelectModel(item, item.categoryName)}
              className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden flex flex-col active:scale-98 transition-all cursor-pointer group hover:border-indigo-300"
            >
              {/* Image Preview Box */}
              <div className="h-36 bg-gradient-to-b from-zinc-50 to-zinc-100/60 p-3 flex items-center justify-center relative overflow-hidden">
                <img
                  src={item.imageUrl || '/images/boxes/rte_white.jpg'}
                  alt={item.name}
                  className="max-h-full max-w-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/95 text-zinc-800 shadow-2xs border border-zinc-200/60">
                  {(item.boxModelKey || '3D').toUpperCase()}
                </span>
                <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/95 shadow-2xs flex items-center justify-center text-zinc-600 group-hover:text-indigo-600 border border-zinc-200/50">
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Title & Info */}
              <div className="p-3 flex flex-col justify-between flex-1 bg-white">
                <div>
                  <span className="text-[10px] font-semibold text-indigo-600 block mb-0.5 uppercase tracking-wider">
                    {item.categoryName}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-900 leading-snug line-clamp-2">
                    {item.name}
                  </h4>
                </div>
                <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                  <span>View CAD & 3D</span>
                  <span className="text-indigo-600 font-bold">›</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-12 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs">
          <Search className="w-10 h-10 text-zinc-300 mb-2.5" />
          <h4 className="text-sm font-bold text-zinc-800">No packaging models found</h4>
          <p className="text-xs text-zinc-500 mt-1 mb-4">No results matching "{searchQuery}"</p>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedCatId('all'); }}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Clear Search & View All
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileModelsTab;
