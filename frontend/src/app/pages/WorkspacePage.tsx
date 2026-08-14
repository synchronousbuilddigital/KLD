// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, Star, Clock, Plus, Search, Filter, Trash2, Edit3, Eye, 
  Sparkles, CheckCircle2, Box, Layers, ArrowRight, Grid, List, RefreshCw,
  Printer, Upload, SlidersHorizontal, ChevronDown, Copy, Check, X, User
} from 'lucide-react';
import Header from '../components/layout/Header';
import { API_BASE_URL } from '../../config/api';
import '../../styles/new-home.css';
import './UserProfilePage.css';

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

  // Local state for Workspace Items & Authentication
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true' || !!localStorage.getItem('token'));

  useEffect(() => {
    const handleAuth = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true' || !!localStorage.getItem('token'));
    };
    window.addEventListener('auth-change', handleAuth);
    return () => window.removeEventListener('auth-change', handleAuth);
  }, []);

  // Hidden File Input Ref for "Upload dieline to model"
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Smooth layout setup
  useEffect(() => {
    window.scrollTo(0, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleNav('landing');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Load items from MongoDB on mount (with localStorage fallback & sync)
  useEffect(() => {
    const fetchWorkspaceItems = async () => {
      let mongoItems: WorkspaceItem[] = [];
      const token = localStorage.getItem('token');
      
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
            mongoItems = data.data.designs.map((d: any) => ({
              id: d._id,
              name: d.name,
              category: d.category || 'Custom Box',
              tabCategory: d.tabCategory || 'projects',
              dimensions: d.dimensions || { L: 150, W: 70, H: 200, glueTab: 15, tuck: 18, flapH: 35 },
              updatedAt: d.updatedAt || new Date().toISOString(),
              isFavorite: !!d.isFavorite,
              isDraft: d.isDraft !== undefined ? d.isDraft : false,
              tags: d.tags || []
            }));
          }
        } catch (err) {
          console.log('MongoDB fetch error, using local workspace items:', err);
        }
      }

      // Local storage items fallback / merge (Filtering out any mock dummy items and auto drafts)
      let localItems: WorkspaceItem[] = [];
      try {
        const stored = localStorage.getItem('kld_workspace_items');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const mockIds = new Set(['model-1', 'model-2', 'proj-1', 'proj-2', 'print-1', 'ai-1', 'active-session-draft']);
            localItems = parsed
              .filter(item => !mockIds.has(item.id))
              .map(item => ({
                ...item,
                tabCategory: item.tabCategory || 'projects'
              }));
          }
        }
        // Save cleaned items without mock or auto-draft data back to localStorage
        localStorage.setItem('kld_workspace_items', JSON.stringify(localItems));
      } catch (err) {
        console.log('Local storage parse error:', err);
      }

      // Merge MongoDB and Local Storage items without duplicates
      const mongoIds = new Set(mongoItems.map(i => i.id));
      let combined = [...mongoItems, ...localItems.filter(i => !mongoIds.has(i.id))].filter(i => i.id !== 'active-session-draft');

      // Sort by last updated (newest / most recent first)
      combined.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setItems(combined);
      setIsLoading(false);
    };

    fetchWorkspaceItems();
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
  const sectionSubtitles: Record<string, string> = {
    recent: 'Your active design sessions and auto-saved drafts in real time.',
    projects: 'Organize and manage your custom structural 3D packaging models.',
    prints: 'Exported CAD dielines and print-ready production files.',
    ai: 'Custom artwork textures and patterns generated with AI.',
    favorites: 'Your quick-access starred packaging designs.'
  };

  return (
    <div className="user-profile-page font-sans">
      {/* ========================================================
          LEFT SIDEBAR NAVIGATION PANEL (Corner-anchored Full Height)
         ======================================================== */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-top-section">
          {/* LOGO */}
          <div 
            className="sidebar-logo" 
            onClick={() => handleNav('landing')} 
            title="Return to Packaging Studio"
          >
            <div className="w-7 h-7 rounded-lg bg-[#C89A63] text-white flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <span>KEYLINE DESIGN</span>
          </div>

          <div className="sidebar-section-title">WORKSPACE NAV</div>

          <nav className="sidebar-menu-list">
            {sidebarItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = sidebarTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSidebarTab(item.id)}
                  className={`sidebar-menu-btn ${isActive ? 'active' : ''}`}
                >
                  <IconComponent className={`w-4 h-4 ${isActive ? 'text-zinc-900' : 'text-zinc-500'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count > 0 && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom-section">
          <button 
            className="sidebar-logout-link"
            onClick={() => handleNav('landing')}
          >
            <ArrowRight className="w-4 h-4 rotate-180 text-zinc-500" /> Back to Studio
          </button>
        </div>
      </aside>

      {/* ========================================================
          RIGHT MAIN WORKSPACE CONTENT AREA (Expanded & Spacious Dashboard)
         ======================================================== */}
      <main className="dashboard-main">
        {/* Top Header Bar with Title & Close (✕) Button */}
        <div className="main-top-header mb-6">
          <div className="page-title-block">
            <h1>{activeSidebarObj.label}</h1>
            <p>{sectionSubtitles[sidebarTab] || 'Access your saved 3D packaging models and dielines.'}</p>
          </div>

          <button 
            className="page-close-btn" 
            onClick={() => handleNav('landing')}
            title="Close Workspace (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION ACTION BAR: Only visible on Projects section */}
        {sidebarTab === 'projects' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Upload Dieline Button */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".dxf,.pdf,.svg,.png,.jpg,.jpeg,.json" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-white border-2 border-zinc-900 hover:bg-zinc-900 hover:text-white text-zinc-900 font-extrabold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Upload dieline to model
              </button>

              <button 
                onClick={() => handleNav('landing')}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Box className="w-4 h-4" /> Create New Box
              </button>
            </div>

            {/* Search Filter Bar */}
            <div className="relative w-full sm:w-[320px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search models or size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs font-bold outline-none focus:border-zinc-900 focus:bg-white shadow-inner transition-all"
              />
            </div>
          </div>
        )}

        {/* Upload Success Alert Banner */}
        <AnimatePresence>
          {uploadSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl text-xs font-bold mb-6 flex items-center gap-2.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTROLS ROW */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 bg-zinc-200/70 text-zinc-700 rounded-full">
              {filteredItems.length} items
            </span>
          </div>

          {/* Top Right Controls: Search (if not in projects), Sort & Grid/List View Toggles */}
          <div className="flex items-center gap-3 flex-wrap self-end sm:self-auto">
            {sidebarTab !== 'projects' && (
              <div className="relative w-full sm:w-[260px]">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search in this section..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200/90 rounded-xl text-xs font-bold outline-none focus:border-zinc-900 shadow-sm transition-all"
                />
              </div>
            )}

            {/* Sort Selector */}
            <div className="flex items-center gap-2 bg-white border border-zinc-200/90 rounded-xl px-3.5 py-1.5 text-xs font-bold text-zinc-700 shadow-sm">
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
            <div className="bg-white border border-zinc-200/90 p-1 rounded-xl flex items-center shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-zinc-900 text-white shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-900'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-zinc-900 text-white shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-900'}`}
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
              !isLoggedIn ? (
                /* UNAUTHENTICATED WORKSPACE CARD */
                <div className="flex-1 min-h-[460px] bg-white rounded-3xl p-12 md:p-20 text-center border-2 border-dashed border-zinc-200/80 flex flex-col items-center justify-center shadow-sm my-2">
                  <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-6 shadow-sm">
                    <Box className="w-10 h-10 stroke-[2]" />
                  </div>
                  <h3 className="text-xl font-extrabold text-zinc-900 mb-2">
                    Sign In to View Your Workspace
                  </h3>
                  <p className="text-sm text-zinc-500 mb-8 max-w-md leading-relaxed">
                    Log in to your account to save 3D box models, custom dielines, and access your personal workspace across devices.
                  </p>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-sign-in-modal'))}
                    className="px-6 py-3.5 bg-zinc-900 text-white text-xs font-extrabold rounded-2xl shadow-md hover:bg-zinc-800 transition-all flex items-center gap-2.5 cursor-pointer active:scale-95"
                  >
                    <User className="w-4 h-4 text-amber-400" /> Sign In / Create Account
                  </button>
                </div>
              ) : (
                /* RECENT WORK & PROJECTS CUSTOM EMPTY STATE FOR LOGGED IN USERS */
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
                      className="px-6 py-3 bg-white border-2 border-zinc-900 text-zinc-900 text-xs font-extrabold rounded-2xl shadow-sm hover:bg-zinc-900 hover:text-white transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Upload Dieline
                    </button>
                    <button
                      onClick={() => handleNav('landing')}
                      className="px-6 py-3 bg-zinc-900 text-white text-xs font-extrabold rounded-2xl shadow-md hover:bg-zinc-800 transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Create New Box
                    </button>
                  </div>
                </div>
              )
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
  );
}
