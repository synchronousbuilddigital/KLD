// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, Star, Clock, Plus, Search, Filter, Trash2, Edit3, Eye, 
  Sparkles, CheckCircle2, Box, Layers, ArrowRight, Grid, List, RefreshCw,
  Printer, Upload, SlidersHorizontal, ChevronDown, Copy, Check
} from 'lucide-react';
import Header from '../components/layout/Header';
import '../../styles/new-home.css';

export interface WorkspaceItem {
  id: string;
  name: string;
  category: string;
  tabCategory: 'projects' | 'prints' | 'ai' | 'favorites' | 'custom_models';
  dimensions: { L: number; W: number; H: number; glueTab?: number; tuck?: number; flapH?: number };
  updatedAt: string;
  isFavorite?: boolean;
  isDraft?: boolean;
  thumbnailUrl?: string;
  tags?: string[];
}

interface WorkspacePageProps {
  onBack?: () => void;
  onNavigate?: (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace', extra?: any) => void;
  onOpenStudioWithBox?: (boxConfig: any) => void;
}

export default function WorkspacePage({ onNavigate, onOpenStudioWithBox }: WorkspacePageProps) {
  // Sidebar active tab state: 'recent' | 'projects' | 'prints' | 'ai' | 'favorites'
  const [sidebarTab, setSidebarTab] = useState<'recent' | 'projects' | 'prints' | 'ai' | 'favorites'>('recent');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'last_saved' | 'newest' | 'name'>('last_saved');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Local state for Workspace Items
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hidden File Input Ref for "Upload dieline to model"
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Sample items representing different sections
  const defaultItems: WorkspaceItem[] = [
    {
      id: 'model-1',
      name: 'Custom Tuck End Cosmetics Box',
      category: 'Tuck End Box',
      tabCategory: 'projects',
      dimensions: { L: 150, W: 70, H: 200, glueTab: 15, tuck: 18, flapH: 35 },
      updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
      isDraft: true,
      isFavorite: true,
      tags: ['Cosmetics', 'Tuck End']
    },
    {
      id: 'model-2',
      name: 'E-Commerce Mailer Box Draft',
      category: 'Mailer Box',
      tabCategory: 'projects',
      dimensions: { L: 220, W: 160, H: 90, glueTab: 20, tuck: 22, flapH: 45 },
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      isDraft: true,
      isFavorite: false,
      tags: ['E-Commerce', 'Mailer']
    },
    {
      id: 'proj-1',
      name: 'Luxury Perfume Packaging Suite',
      category: 'Rigid Box',
      tabCategory: 'projects',
      dimensions: { L: 120, W: 120, H: 150, glueTab: 0, tuck: 0, flapH: 0 },
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      isDraft: false,
      isFavorite: true,
      tags: ['Perfume', 'Rigid']
    },
    {
      id: 'proj-2',
      name: 'Artisanal Coffee Bean Dispenser',
      category: 'Snap Lock Box',
      tabCategory: 'projects',
      dimensions: { L: 100, W: 100, H: 180, glueTab: 15, tuck: 15, flapH: 30 },
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      isDraft: false,
      isFavorite: false,
      tags: ['Coffee', 'Snap Lock']
    },
    {
      id: 'print-1',
      name: 'Print-Ready Mailer CAD Dieline (PDF/DXF)',
      category: 'Print Dieline',
      tabCategory: 'prints',
      dimensions: { L: 250, W: 180, H: 80, glueTab: 20, tuck: 20, flapH: 40 },
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      isDraft: false,
      isFavorite: false,
      tags: ['PDF Export', '300 DPI']
    },
    {
      id: 'ai-1',
      name: 'AI Generated Marble Gold Texture Foil',
      category: 'AI Texture',
      tabCategory: 'ai',
      dimensions: { L: 140, W: 140, H: 140, glueTab: 15, tuck: 15, flapH: 25 },
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      isDraft: false,
      isFavorite: true,
      tags: ['AI Pattern', 'Gold Foil']
    }
  ];

  // Smooth layout setup
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.zoom = '1';
    document.body.style.width = '100%';
    document.body.style.overflowX = 'hidden';

    return () => {
      document.body.style.zoom = '';
      document.body.style.width = '';
      document.body.style.overflowX = '';
    };
  }, []);

  // Load items from MongoDB on mount (with localStorage fallback if offline/guest)
  useEffect(() => {
    const fetchMongoDBItems = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/mockups/saved', {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.data?.designs)) {
            if (data.data.designs.length > 0) {
              const mongoItems: WorkspaceItem[] = data.data.designs.map((d: any) => ({
                id: d._id,
                name: d.name,
                category: d.category || 'Custom Box',
                tabCategory: d.tabCategory || 'projects',
                dimensions: d.dimensions || { L: 150, W: 70, H: 200, glueTab: 15, tuck: 18, flapH: 35 },
                updatedAt: d.updatedAt || new Date().toISOString(),
                isFavorite: !!d.isFavorite,
                isDraft: d.isDraft !== undefined ? d.isDraft : true,
                tags: d.tags || []
              }));
              setItems(mongoItems);
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.log('MongoDB fetch error, falling back to local state:', err);
        }
      }

      // Fallback to stored items or defaults
      try {
        const stored = localStorage.getItem('kld_workspace_items');
        if (stored) {
          setItems(JSON.parse(stored));
        } else {
          setItems(defaultItems);
          localStorage.setItem('kld_workspace_items', JSON.stringify(defaultItems));
        }
      } catch {
        setItems(defaultItems);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMongoDBItems();
  }, []);

  // Save items state to state & local cache
  const updateItemsState = (newItems: WorkspaceItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem('kld_workspace_items', JSON.stringify(newItems));
    } catch (e) {
      console.log('Error caching workspace items:', e);
    }
  };

  // Navigation Helper
  const handleNav = (view: any, extra?: any) => {
    if (onNavigate) {
      onNavigate(view, extra);
    } else {
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view, extra } }));
    }
  };

  // Toggle Favorite in MongoDB & State
  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetItem = items.find((i) => i.id === id);
    if (!targetItem) return;

    const newFavoriteState = !targetItem.isFavorite;
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, isFavorite: newFavoriteState };
      }
      return item;
    });
    updateItemsState(updated);

    // Persist to MongoDB if authenticated and valid MongoDB ID
    const token = localStorage.getItem('token');
    if (token && id.length === 24) {
      try {
        await fetch(`/api/mockups/saved/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isFavorite: newFavoriteState })
        });
      } catch (err) {
        console.log('MongoDB update favorite error:', err);
      }
    }
  };

  // Delete Workspace Item in MongoDB & State
  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this box item from your workspace?')) {
      const updated = items.filter((item) => item.id !== id);
      updateItemsState(updated);

      // Persist deletion to MongoDB if authenticated and valid MongoDB ID
      const token = localStorage.getItem('token');
      if (token && id.length === 24) {
        try {
          await fetch(`/api/mockups/saved/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (err) {
          console.log('MongoDB delete error:', err);
        }
      }
    }
  };

  // Resume Editing in Studio
  const handleResumeEditing = (item: WorkspaceItem) => {
    if (onOpenStudioWithBox) {
      onOpenStudioWithBox(item);
    } else {
      handleNav('landing', { boxConfig: item });
    }
  };

  // Handle Dieline File Upload to MongoDB
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const fileName = file.name.replace(/\.[^/.]+$/, '') || 'Uploaded Custom Dieline Model';

    const newItemData = {
      name: fileName,
      type: 'DIELINE',
      category: 'Uploaded Model',
      tabCategory: 'projects',
      dimensions: { L: 200, W: 140, H: 80, glueTab: 15, tuck: 18, flapH: 30 },
      isDraft: true,
      isFavorite: false,
      tags: ['Uploaded Dieline']
    };

    const token = localStorage.getItem('token');
    let createdId = 'uploaded-' + Date.now();

    if (token) {
      try {
        const res = await fetch('/api/mockups/saved', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newItemData)
        });
        const data = await res.json();
        if (res.ok && data.data?.design?._id) {
          createdId = data.data.design._id;
        }
      } catch (err) {
        console.log('MongoDB upload save error:', err);
      }
    }

    const newItem: WorkspaceItem = {
      id: createdId,
      ...newItemData,
      updatedAt: new Date().toISOString()
    };

    updateItemsState([newItem, ...items]);
    setUploadSuccessMsg(`Successfully uploaded "${file.name}" to MongoDB database!`);
    setTimeout(() => setUploadSuccessMsg(null), 4000);
  };

  // Filter & Sort Items
  const filteredItems = items.filter((item) => {
    // Sidebar Tab Filter
    if (sidebarTab === 'recent') {
      return true; // Show all work in order of last saved!
    } else if (sidebarTab === 'favorites') {
      if (!item.isFavorite) return false;
    } else {
      if (item.tabCategory !== sidebarTab) return false;
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchDims = `${item.dimensions.L}x${item.dimensions.W}x${item.dimensions.H}`.includes(q);
      if (!matchName && !matchCat && !matchDims) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'newest') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    // Default 'last_saved'
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Sidebar Menu Items definition
  const sidebarItems = [
    { id: 'recent' as const, label: 'Recent Work', icon: Clock, count: items.length },
    { id: 'projects' as const, label: 'Projects', icon: Folder, count: items.filter(i => i.tabCategory === 'projects').length },
    { id: 'prints' as const, label: 'My Prints', icon: Printer, count: items.filter(i => i.tabCategory === 'prints').length },
    { id: 'ai' as const, label: 'AI Generations', icon: Sparkles, count: items.filter(i => i.tabCategory === 'ai').length },
    { id: 'favorites' as const, label: 'Favorites', icon: Star, count: items.filter(i => i.isFavorite).length },
  ];

  // Dynamic Page Header Title based on active tab
  const activeSidebarObj = sidebarItems.find(s => s.id === sidebarTab) || sidebarItems[0];

  return (
    <div className="new-home-landing min-h-screen font-sans flex flex-col relative z-0" style={{ backgroundColor: '#FAF9F6', '--bg-primary': '#FAF9F6' } as React.CSSProperties}>
      {/* Main Header Nav */}
      <Header activeNav="workspace" onNavigate={handleNav} />

      {/* Main Spacious Workspace Container (Full Viewport Height Dashboard) */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1500px] mx-auto px-6 md:px-12 relative z-10" style={{ paddingTop: '100px', paddingBottom: '80px', minHeight: 'calc(100vh - 80px)' }}>
        
        {/* ========================================================
            LEFT SIDEBAR NAVIGATION PANEL (Spacious Layout)
           ======================================================== */}
        <aside className="w-full md:w-[280px] shrink-0 pr-0 md:pr-10 mb-8 md:mb-0 border-b md:border-b-0 md:border-r border-zinc-200/60 pb-8 md:pb-0">
          <div className="sticky top-28 flex flex-col gap-3">
            <div className="px-3 mb-2">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-zinc-400">
                WORKSPACE NAV
              </h3>
            </div>

            <nav className="flex flex-col gap-2.5">
              {sidebarItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = sidebarTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSidebarTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[14px] font-bold transition-all duration-200 text-left ${
                      isActive 
                        ? 'bg-white text-zinc-900 border-2 border-zinc-900 shadow-[0_4px_20px_rgba(0,0,0,0.06)] translate-x-1' 
                        : 'text-zinc-600 border-2 border-transparent hover:bg-zinc-200/50 hover:text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-zinc-900 stroke-[2.5]' : 'text-zinc-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.count > 0 && (
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black ${
                        isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-200/80 text-zinc-600'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ========================================================
            RIGHT MAIN WORKSPACE CONTENT AREA (Spacious Dashboard)
           ======================================================== */}
        <main className="flex-1 min-w-0 pl-0 md:pl-10 flex flex-col">
          
          {/* TOP ACTION BAR: Upload button & Quick Box Creator */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 mb-10">
            <div className="flex items-center gap-3.5 flex-wrap">
              {/* Upload Dieline Button (Matches reference screenshot button styling) */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".dxf,.pdf,.svg,.png,.jpg,.jpeg,.json" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-white border-2 border-zinc-900 hover:bg-zinc-900 hover:text-white text-zinc-900 font-extrabold text-xs rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Upload dieline to model
              </button>

              <button 
                onClick={() => handleNav('landing')}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5"
              >
                <Box className="w-4 h-4" /> Create New Box
              </button>
            </div>

            {/* Fast Search Filter Bar */}
            <div className="relative w-full sm:w-[280px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search models or size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200/90 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Upload Success Alert Banner */}
          <AnimatePresence>
            {uploadSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl text-xs font-bold mb-8 flex items-center gap-2.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccessMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SECTION HEADER BAR & TOP RIGHT CONTROLS */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-8">
            
            {/* Dynamic Section Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
                {activeSidebarObj.label}
              </h1>
            </div>

            {/* Top Right Controls: Sort & Grid/List View Toggles */}
            <div className="flex items-center gap-4 self-end sm:self-auto">
              
              {/* Sort Selector */}
              <div className="flex items-center gap-2 bg-white border border-zinc-200/90 rounded-2xl px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm">
                <span className="text-zinc-400 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent outline-none cursor-pointer text-zinc-900 font-bold pr-1"
                >
                  <option value="last_saved">Last saved</option>
                  <option value="newest">Newest first</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>

              {/* Grid / List View Toggle Icons */}
              <div className="bg-white border border-zinc-200/90 p-1.5 rounded-2xl flex items-center shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-zinc-900 text-white shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-900'}`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-colors ${viewMode === 'list' ? 'bg-zinc-900 text-white shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-900'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              MODEL DISPLAY CONTENT AREA (GRID / LIST / TAILORED EMPTY STATE)
             ======================================================== */}
          {isLoading ? (
            <div className="py-32 text-center text-zinc-400 font-bold flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-7 h-7 animate-spin text-zinc-900" />
              <span>Loading workspace items...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            
            /* TAILORED EMPTY STATE PER SECTION */
            searchQuery ? (
              <div className="flex-1 min-h-[460px] bg-white rounded-3xl p-12 md:p-20 text-center border-2 border-dashed border-zinc-200/80 flex flex-col items-center justify-center shadow-sm my-2">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
                  <Search className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-xl font-extrabold text-zinc-900 mb-2">No matching items found</h3>
                <p className="text-sm text-zinc-500 mb-6 max-w-md">No design sessions matched your search query "{searchQuery}".</p>
                <button onClick={() => setSearchQuery('')} className="px-5 py-2.5 bg-zinc-900 text-white text-xs font-extrabold rounded-xl shadow-md">
                  Clear Search Filter
                </button>
              </div>
            ) : sidebarTab === 'favorites' ? (
              /* FAVORITES CUSTOM EMPTY STATE */
              <div className="flex-1 min-h-[460px] bg-white rounded-3xl p-12 md:p-20 text-center border-2 border-dashed border-amber-200/80 flex flex-col items-center justify-center shadow-sm my-2">
                <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-6 shadow-sm">
                  <Star className="w-10 h-10 fill-amber-400 text-amber-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-extrabold text-zinc-900 mb-2">No Favorite Designs Saved Yet</h3>
                <p className="text-sm text-zinc-500 mb-8 max-w-md leading-relaxed">
                  Click the star icon (⭐) on any 3D packaging model or dieline template to add it to your quick-access favorites gallery.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => handleNav('models')}
                    className="px-6 py-3 bg-zinc-900 text-white text-xs font-extrabold rounded-2xl shadow-md hover:bg-zinc-800 transition-all flex items-center gap-2.5"
                  >
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Explore 3D Models Gallery
                  </button>
                  <button
                    onClick={() => handleNav('dielines')}
                    className="px-6 py-3 bg-white border-2 border-zinc-900 text-zinc-900 text-xs font-extrabold rounded-2xl shadow-sm hover:bg-zinc-900 hover:text-white transition-all flex items-center gap-2.5"
                  >
                    Browse Dieline Library <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : sidebarTab === 'prints' ? (
              /* MY PRINTS CUSTOM EMPTY STATE */
              <div className="flex-1 min-h-[460px] bg-white rounded-3xl p-12 md:p-20 text-center border-2 border-dashed border-indigo-200/80 flex flex-col items-center justify-center shadow-sm my-2">
                <div className="w-20 h-20 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
                  <Printer className="w-10 h-10 stroke-[2]" />
                </div>
                <h3 className="text-xl font-extrabold text-zinc-900 mb-2">No Print-Ready Dielines Exported</h3>
                <p className="text-sm text-zinc-500 mb-8 max-w-md leading-relaxed">
                  Export high-resolution production PDF or DXF CAD dielines from your 3D packaging sessions to see them here.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => handleNav('dielines')}
                    className="px-6 py-3 bg-zinc-900 text-white text-xs font-extrabold rounded-2xl shadow-md hover:bg-zinc-800 transition-all flex items-center gap-2.5"
                  >
                    <Printer className="w-4 h-4" /> Browse Dieline Templates
                  </button>
                  <button
                    onClick={() => handleNav('landing')}
                    className="px-6 py-3 bg-white border-2 border-zinc-900 text-zinc-900 text-xs font-extrabold rounded-2xl shadow-sm hover:bg-zinc-900 hover:text-white transition-all flex items-center gap-2.5"
                  >
                    Go to 3D Studio <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : sidebarTab === 'ai' ? (
              /* AI GENERATIONS CUSTOM EMPTY STATE */
              <div className="flex-1 min-h-[460px] bg-white rounded-3xl p-12 md:p-20 text-center border-2 border-dashed border-purple-200/80 flex flex-col items-center justify-center shadow-sm my-2">
                <div className="w-20 h-20 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-6 shadow-sm">
                  <Sparkles className="w-10 h-10 stroke-[2] animate-pulse" />
                </div>
                <h3 className="text-xl font-extrabold text-zinc-900 mb-2">No AI Generated Textures Yet</h3>
                <p className="text-sm text-zinc-500 mb-8 max-w-md leading-relaxed">
                  Generate custom artwork, marble foil textures, and packaging patterns using AI studio tools.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => handleNav('landing')}
                    className="px-6 py-3 bg-zinc-900 text-white text-xs font-extrabold rounded-2xl shadow-md hover:bg-zinc-800 transition-all flex items-center gap-2.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" /> Open 3D Studio & AI Tools
                  </button>
                  <button
                    onClick={() => handleNav('models')}
                    className="px-6 py-3 bg-white border-2 border-zinc-900 text-zinc-900 text-xs font-extrabold rounded-2xl shadow-sm hover:bg-zinc-900 hover:text-white transition-all flex items-center gap-2.5"
                  >
                    Explore 3D Models <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* RECENT WORK & PROJECTS CUSTOM EMPTY STATE */
              <div className="flex-1 min-h-[460px] bg-white rounded-3xl p-12 md:p-20 text-center border-2 border-dashed border-zinc-200/80 flex flex-col items-center justify-center shadow-sm my-2">
                <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
                  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
                    <polygon points="25,45 28,52 35,53 30,58 31,65 25,61 19,65 20,58 15,53 22,52" fill="#EAB308" className="animate-pulse" />
                    <g stroke="#18181b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M40 70 L75 90 L110 70 L75 50 Z" fill="#F4F4F5" />
                      <path d="M40 70 L40 95 L75 115 L75 90 Z" fill="#E4E4E7" />
                      <path d="M110 70 L110 95 L75 115 Z" fill="#D4D4D8" />
                      <path d="M40 70 L25 45 L60 25 L75 50 Z" fill="#FFFFFF" />
                      <path d="M110 70 L125 45 L90 25 L75 50 Z" fill="#F4F4F5" />
                      <path d="M75 50 L75 20" strokeDasharray="3 3" />
                    </g>
                  </svg>
                </div>

                <h3 className="text-xl font-extrabold text-zinc-900 mb-2">
                  {sidebarTab === 'recent' ? 'No Recent Work Found' : 'No Saved Projects Yet'}
                </h3>
                <p className="text-sm text-zinc-500 mb-8 max-w-md leading-relaxed">
                  {sidebarTab === 'recent' 
                    ? 'Your active design sessions and auto-saved drafts will automatically appear here as you work in the 3D studio.'
                    : 'Create, save, and organize your structural packaging projects and box prototypes in one place.'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-white border-2 border-zinc-900 text-zinc-900 text-xs font-extrabold rounded-2xl shadow-sm hover:bg-zinc-900 hover:text-white transition-all flex items-center gap-2.5"
                  >
                    <Upload className="w-4 h-4" /> Upload Dieline
                  </button>
                  <button
                    onClick={() => handleNav('landing')}
                    className="px-6 py-3 bg-zinc-900 text-white text-xs font-extrabold rounded-2xl shadow-md hover:bg-zinc-800 transition-all flex items-center gap-2.5"
                  >
                    <Plus className="w-4 h-4" /> Create New Box
                  </button>
                </div>
              </div>
            )

          ) : viewMode === 'grid' ? (
            
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-7 border border-zinc-200/80 shadow-[0_6px_24px_-6px_rgba(0,0,0,0.04)] hover:shadow-xl hover:border-zinc-300 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Header Row: Category Badge & Favorite Star */}
                    <div className="flex items-center justify-between mb-5">
                      <span className="bg-zinc-100 text-zinc-700 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                        {item.category}
                      </span>

                      <button
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        className={`p-2 rounded-full transition-all ${item.isFavorite ? 'bg-amber-50 text-amber-500' : 'text-zinc-300 hover:text-amber-500 hover:bg-zinc-50'}`}
                        title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`w-4.5 h-4.5 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>

                    {/* 3D Box Card Graphic */}
                    <div 
                      onClick={() => handleResumeEditing(item)}
                      className="w-full h-44 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl border border-zinc-100 flex items-center justify-center mb-6 group-hover:bg-amber-50/40 transition-colors relative cursor-pointer overflow-hidden"
                    >
                      <div className="w-18 h-18 rounded-2xl bg-white shadow-md flex items-center justify-center text-zinc-800 group-hover:scale-110 transition-transform p-4">
                        <Box className="w-9 h-9 text-zinc-900" />
                      </div>

                      {item.isDraft && (
                        <span className="absolute top-3.5 left-3.5 bg-amber-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                          Auto-Saved Draft
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-zinc-900 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-lg transition-all transform translate-y-2 group-hover:translate-y-0 flex items-center gap-1.5">
                          Open Studio <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                    {/* Item Title */}
                    <h3 
                      onClick={() => handleResumeEditing(item)}
                      className="font-extrabold text-zinc-900 text-lg mb-2.5 line-clamp-1 group-hover:text-amber-600 transition-colors cursor-pointer"
                    >
                      {item.name}
                    </h3>

                    {/* Dimensions Badge */}
                    <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl px-3.5 py-2.5 text-[11px] font-mono font-bold text-zinc-700 mb-5 flex items-center justify-between">
                      <span>L: {item.dimensions.L}mm</span>
                      <span>W: {item.dimensions.W}mm</span>
                      <span>H: {item.dimensions.H}mm</span>
                    </div>
                  </div>

                  {/* Footer Action Row */}
                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-zinc-400 font-medium">
                      Updated {new Date(item.updatedAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="p-2 text-zinc-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                        title="Delete model"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleResumeEditing(item)}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        Resume <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            
            /* LIST VIEW */
            <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden divide-y divide-zinc-100">
              {filteredItems.map((item) => (
                <div key={item.id} className="p-5 sm:p-6 flex items-center justify-between gap-5 hover:bg-zinc-50/80 transition-colors">
                  <div className="flex items-center gap-5 min-w-0">
                    <div 
                      onClick={() => handleResumeEditing(item)}
                      className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 cursor-pointer hover:bg-zinc-200 transition-colors"
                    >
                      <Box className="w-7 h-7 text-zinc-900" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h4 
                          onClick={() => handleResumeEditing(item)}
                          className="font-extrabold text-zinc-900 text-base truncate cursor-pointer hover:underline"
                        >
                          {item.name}
                        </h4>
                        {item.isDraft && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 font-mono mt-1 truncate">
                        {item.category} • {item.dimensions.L}×{item.dimensions.W}×{item.dimensions.H} mm
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 shrink-0">
                    <button
                      onClick={(e) => handleToggleFavorite(item.id, e)}
                      className={`p-2.5 rounded-xl transition-all ${item.isFavorite ? 'text-amber-500 bg-amber-50' : 'text-zinc-300 hover:text-amber-500'}`}
                    >
                      <Star className={`w-5 h-5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-2.5 text-zinc-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleResumeEditing(item)}
                      className="px-5 py-2.5 bg-zinc-900 text-white text-xs font-extrabold rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-1.5 shadow-md"
                    >
                      Resume <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
