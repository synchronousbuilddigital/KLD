import React, { useState, useEffect, useMemo } from 'react';
import { 
  Folder, 
  Search, 
  Plus, 
  Star, 
  Trash2, 
  Copy, 
  ArrowRight, 
  Layers, 
  Box, 
  Wand2, 
  Clock, 
  ExternalLink,
  Sparkles,
  LogIn,
  MoreVertical,
  Check
} from 'lucide-react';
import { useBoxStore } from '../../../lib/useBoxStore';
import { API_BASE_URL } from '../../../config/api';
import { MobileTab } from './MobileTabBar';

export interface MobileWorkspaceItem {
  id: string;
  _id?: string;
  name: string;
  category: string;
  boxModel?: string;
  type?: string;
  tabCategory?: string;
  dimensions?: { L: number; W: number; H: number; length?: number; width?: number; height?: number };
  packageColor?: string | null;
  insideColor?: string | null;
  capColor?: string;
  materialType?: string;
  decals?: any[];
  updatedAt?: string;
  isFavorite?: boolean;
  isDraft?: boolean;
  thumbnailUrl?: string;
}

interface MobileWorkspaceTabProps {
  onNavigateTab: (tab: MobileTab) => void;
  onOpenInStudio: (modelKey: string) => void;
  onOpenSignIn: () => void;
}

export const MobileWorkspaceTab: React.FC<MobileWorkspaceTabProps> = ({
  onNavigateTab,
  onOpenInStudio,
  onOpenSignIn,
}) => {
  const [items, setItems] = useState<MobileWorkspaceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'boxes' | 'cylinders' | 'favorites'>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';

  // Load items from localStorage and MongoDB API
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    let allItems: MobileWorkspaceItem[] = [];

    // 1. Read from localStorage (immediate & offline-ready)
    try {
      const stored = localStorage.getItem('kld_workspace_items');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          allItems = parsed.map(item => ({
            ...item,
            id: item.id || item._id || ('local-' + Math.random().toString(36).substr(2, 9)),
          }));
        }
      }
    } catch (e) {
      console.warn('Error reading local workspace items:', e);
    }

    // 2. Read from MongoDB API if logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/mockups/saved`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.data?.designs)) {
          const apiItems = data.data.designs.map((d: any) => ({
            id: d._id,
            _id: d._id,
            name: d.name || 'Untitled Packaging',
            category: d.category || 'Custom Model',
            boxModel: d.boxModel || d.model || 'rte',
            type: d.type || 'MOCKUP',
            dimensions: d.dimensions || { L: 120, W: 60, H: 160 },
            packageColor: d.packageColor || null,
            insideColor: d.insideColor || null,
            capColor: d.capColor || '#ffffff',
            materialType: d.materialType || 'paperboard',
            decals: d.decals || [],
            updatedAt: d.updatedAt || new Date().toISOString(),
            isFavorite: !!d.isFavorite,
          }));

          // Merge by ID avoiding duplicates
          const itemMap = new Map<string, MobileWorkspaceItem>();
          allItems.forEach(i => itemMap.set(i.id, i));
          apiItems.forEach((i: MobileWorkspaceItem) => itemMap.set(i.id, i));
          allItems = Array.from(itemMap.values());
        }
      } catch (err) {
        console.warn('Error fetching cloud workspace items:', err);
      }
    }

    // Sort by latest updated
    allItems.sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });

    setItems(allItems);
    setIsLoading(false);
  };

  const persistItems = (newItems: MobileWorkspaceItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem('kld_workspace_items', JSON.stringify(newItems));
    } catch (e) {
      console.warn('Failed to cache workspace items:', e);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.map(item => {
      if (item.id === id) {
        return { ...item, isFavorite: !item.isFavorite };
      }
      return item;
    });
    persistItems(updated);
  };

  // Duplicate item
  const handleDuplicate = (item: MobileWorkspaceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    const newId = 'saved-' + Date.now();
    const duplicate: MobileWorkspaceItem = {
      ...item,
      id: newId,
      _id: newId,
      name: `${item.name} (Copy)`,
      updatedAt: new Date().toISOString()
    };
    persistItems([duplicate, ...items]);
  };

  // Delete item
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (!window.confirm('Delete this project from your workspace?')) return;

    const remaining = items.filter(item => item.id !== id);
    persistItems(remaining);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && id.length === 24) {
      try {
        await fetch(`${API_BASE_URL}/mockups/saved/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.warn('Failed to delete cloud project:', err);
      }
    }
  };

  // Open item in Studio
  const handleOpenItem = (item: MobileWorkspaceItem) => {
    try {
      const model = item.boxModel || 'rte';
      const dimL = item.dimensions?.length || (item.dimensions?.L ? item.dimensions.L / 25.4 : 4.72);
      const dimW = item.dimensions?.width || (item.dimensions?.W ? item.dimensions.W / 25.4 : 2.36);
      const dimH = item.dimensions?.height || (item.dimensions?.H ? item.dimensions.H / 25.4 : 6.29);

      const storeState = useBoxStore.getState();
      const currentDecals = storeState.decalsByModel || {};

      useBoxStore.setState({
        activeProjectId: item.id,
        activeProjectName: item.name,
        boxModel: model,
        L: dimL,
        W: dimW,
        H: dimH,
        packageColor: item.packageColor || null,
        insideColor: item.insideColor || null,
        capColor: item.capColor || '#ffffff',
        materialType: item.materialType || 'paperboard',
        decalsByModel: {
          ...currentDecals,
          [model]: item.decals || []
        }
      });
    } catch (err) {
      console.warn('Error loading item to store:', err);
    }

    onOpenInStudio(item.boxModel || 'rte');
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.category?.toLowerCase().includes(q);
        const matchesModel = item.boxModel?.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesModel) return false;
      }

      // Tab filter
      if (activeFilter === 'favorites') return !!item.isFavorite;
      if (activeFilter === 'boxes') {
        return ['rte', 'te', 'rsc', 'auto_lock', 'cosmetic', 'cosmetic_b', 'button_hole', 'fefco_0300'].includes(item.boxModel || '');
      }
      if (activeFilter === 'cylinders') {
        return ['can', 'soda_can', 'slim_can', 'sipper_water_bottle', 'water_bottle', 'tube'].includes(item.boxModel || '');
      }
      return true;
    });
  }, [items, searchQuery, activeFilter]);

  // Model image mapping helper
  const getModelThumbnail = (boxModel?: string) => {
    if (!boxModel) return '/images/boxes/rte_white.jpg';
    switch (boxModel) {
      case 'sipper_water_bottle': return '/images/sipper_water_bottle.png';
      case 'water_bottle': return '/images/boxes/ste_white.jpg';
      case 'can': return '/images/can.png';
      case 'slim_can': return '/images/can.png';
      case 'tube': return '/images/toothpaste_tube_mockup.png';
      case 'rsc': return '/images/boxes/rsc_kraft.jpg';
      case 'te': return '/images/boxes/ste_white.jpg';
      case 'fefco_0300': return '/images/boxes/fefco_0300_white.png';
      default: return '/images/boxes/rte_white.jpg';
    }
  };

  // Format relative time helper
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${Math.max(1, mins)}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-28 px-4 pt-3 select-none">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">My Workspace</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80">
              {items.length}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
            Your saved packaging designs & CAD prototypes
          </p>
        </div>

        {/* New Design Button */}
        <button
          onClick={() => {
            useBoxStore.getState().clearActiveProject?.();
            onNavigateTab('studio');
          }}
          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>New</span>
        </button>
      </div>

      {/* Guest Notice Banner */}
      {!isLoggedIn && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Designs stored on this device</p>
              <p className="text-[10px] text-zinc-600">Sign in to sync your workspace with desktop</p>
            </div>
          </div>
          <button
            onClick={onOpenSignIn}
            className="px-3 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-semibold active:scale-95 transition-all shrink-0"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search saved designs by name or model..."
          className="w-full pl-9 pr-4 py-2 bg-white text-xs font-medium text-zinc-900 placeholder-zinc-400 rounded-xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] focus:border-zinc-400 transition-all outline-none"
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
        {[
          { id: 'all', label: 'All Projects', count: items.length },
          { id: 'boxes', label: 'Boxes', count: items.filter(i => ['rte', 'te', 'rsc', 'auto_lock', 'cosmetic', 'cosmetic_b', 'button_hole', 'fefco_0300'].includes(i.boxModel || '')).length },
          { id: 'cylinders', label: 'Bottles & Cans', count: items.filter(i => ['can', 'soda_can', 'slim_can', 'sipper_water_bottle', 'water_bottle', 'tube'].includes(i.boxModel || '')).length },
          { id: 'favorites', label: 'Favorites', count: items.filter(i => i.isFavorite).length },
        ].map(tab => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs font-semibold'
                  : 'bg-white text-zinc-600 border-zinc-200/80 hover:border-zinc-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`ml-1.5 text-[10px] ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs font-medium text-zinc-400 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
          <span>Loading workspace...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-400">
            <Folder className="w-7 h-7 text-zinc-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900">
              {searchQuery ? 'No matching designs found' : 'Your workspace is empty'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              {searchQuery 
                ? 'Try searching with a different term or clear the filter.'
                : 'Create your first custom box, can, or bottle in the 3D Studio and tap Save.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 w-full max-w-xs">
            <button
              onClick={() => onNavigateTab('studio')}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Open 3D Studio</span>
            </button>
            <button
              onClick={() => onNavigateTab('models')}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Box className="w-3.5 h-3.5 text-zinc-600" />
              <span>Browse Catalog</span>
            </button>
          </div>
        </div>
      ) : (
        /* Grid of Saved Projects */
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map(item => {
            const dim = item.dimensions || { L: 120, W: 60, H: 160 };
            const dimL = Math.round(dim.L || 120);
            const dimW = Math.round(dim.W || 60);
            const dimH = Math.round(dim.H || 160);
            const isMenuOpen = menuOpenId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className="bg-white rounded-2xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-3.5 flex items-center gap-3.5 hover:border-zinc-300 active:scale-[0.99] transition-all cursor-pointer relative group"
              >
                {/* 3D Model Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-[#f8f7f5] border border-zinc-200/60 overflow-hidden flex items-center justify-center shrink-0 p-1.5 relative">
                  <img
                    src={getModelThumbnail(item.boxModel)}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                  />
                  {item.packageColor && (
                    <span 
                      className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: item.packageColor }}
                      title="Package Substrate"
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      {item.category || 'Packaging'}
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {formatTimeAgo(item.updatedAt)}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-zinc-900 truncate leading-snug">
                    {item.name}
                  </h3>

                  {/* Dimensions Pill */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] font-mono font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/60">
                      {dimL} × {dimW} × {dimH} mm
                    </span>
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="flex flex-col items-center justify-between h-20 shrink-0 py-0.5">
                  {/* Favorite Toggle */}
                  <button
                    onClick={(e) => handleToggleFavorite(item.id, e)}
                    className="p-1 text-zinc-400 hover:text-amber-500 transition-colors"
                    title="Favorite"
                  >
                    <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                  </button>

                  {/* Quick Edit Arrow */}
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white text-zinc-700 flex items-center justify-center transition-all">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>

                  {/* Quick Delete */}
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1 text-zinc-300 hover:text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileWorkspaceTab;

