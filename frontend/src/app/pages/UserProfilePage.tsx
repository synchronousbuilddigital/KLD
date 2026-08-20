// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Shield, ShieldCheck, Key, CreditCard, Package, Download, 
  Sparkles, LogOut, ArrowLeft, CheckCircle2, Trash2, Eye, EyeOff, Save, Lock, X, LayoutDashboard, ExternalLink, Search, Copy, Filter
} from 'lucide-react';
import { authService, UserProfile } from '../../services/auth';
import { API_BASE_URL } from '../../config/api';
import './UserProfilePage.css';

interface SavedDesignItem {
  _id: string;
  name: string;
  type: string;
  category: string;
  variantId?: number;
  dimensions?: { L?: number; W?: number; H?: number; glueTab?: number; tuck?: number; flapH?: number };
  createdAt?: string;
}

function UserProfilePage({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (view: string) => void }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'projects' | 'subscription' | 'exports'>('profile');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleNavToView = (view: 'models' | 'dielines' | 'landing') => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      window.dispatchEvent(new CustomEvent('navigate', { detail: view }));
    }
  };
  
  const [savedProjects, setSavedProjects] = useState<SavedDesignItem[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Reset body zoom and width overrides set by App hero scaling
    document.body.style.zoom = '1';
    document.body.style.width = '100%';
    document.body.style.overflowX = 'hidden';

    try {
      const u = authService.getCurrentUser();
      if (u?.role === 'ADMIN') {
        window.history.pushState(null, '', '/admin');
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'admin' }));
        return;
      }
      setUser(u);
      if (u?.fullName) setFullName(u.fullName);
    } catch (e) {
      console.error('Error loading local user profile', e);
    }
    
    fetchProfileFromBackend();
    fetchSavedProjects();

    const handleProjectSaved = () => {
      fetchSavedProjects();
    };
    window.addEventListener('project-saved', handleProjectSaved);

    return () => {
      window.removeEventListener('project-saved', handleProjectSaved);
      document.body.style.zoom = '';
      document.body.style.width = '';
    };
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchProfileFromBackend = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        if (data.data.fullName) setFullName(data.data.fullName);
        localStorage.setItem('user', JSON.stringify(data.data));
      }
    } catch (e) {
      console.error('Error fetching backend profile', e);
    }
  };

  const fetchSavedProjects = async () => {
    setIsLoadingProjects(true);
    let mongoDesigns: SavedDesignItem[] = [];
    try {
      const res = await fetch(`${API_BASE_URL}/mockups/saved`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.designs)) {
        mongoDesigns = data.data.designs;
      }
    } catch (e) {
      console.error('Error fetching saved projects from MongoDB', e);
    }

    // Read local workspace items from localStorage (fallback / sync)
    let localItems: SavedDesignItem[] = [];
    try {
      const stored = localStorage.getItem('kld_workspace_items');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const mockIds = new Set(['model-1', 'model-2', 'proj-1', 'proj-2', 'print-1', 'ai-1', 'active-session-draft']);
          localItems = parsed
            .filter((item: any) => !mockIds.has(item.id))
            .map((item: any) => ({
              _id: item.id || item._id,
              name: item.name,
              type: item.type || 'DIELINE',
              category: item.category || 'Custom Box',
              dimensions: item.dimensions || { L: 150, W: 70, H: 200 },
              createdAt: item.updatedAt || new Date().toISOString(),
              isFavorite: !!item.isFavorite
            }));
        }
      }
    } catch (err) {
      console.error('Error parsing local workspace items in profile:', err);
    }

    // Merge MongoDB and Local items without duplicates
    const mongoIds = new Set(mongoDesigns.map(d => d._id));
    const combined = [
      ...mongoDesigns,
      ...localItems.filter(item => !mongoIds.has(item._id))
    ];

    setSavedProjects(combined);
    setIsLoadingProjects(false);

    // Auto-sync un-synced local items to MongoDB if logged in
    const token = localStorage.getItem('token');
    if (token) {
      const unSynced = localItems.filter(item => !mongoIds.has(item._id) && (!item._id || item._id.length !== 24));
      for (const item of unSynced) {
        try {
          await fetch(`${API_BASE_URL}/mockups/saved`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: item.name,
              type: item.type || 'DIELINE',
              category: item.category || 'Custom Box',
              dimensions: item.dimensions,
              isFavorite: item.isFavorite
            })
          });
        } catch (syncErr) {
          console.error('Auto sync local project error:', syncErr);
        }
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsUpdating(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify({ fullName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');

      setStatusMsg({ type: 'success', text: 'Profile name updated successfully!' });
      fetchProfileFromBackend();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Profile update failed' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setIsUpdating(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password');

      setStatusMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Password update failed' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this saved packaging project?')) return;
    
    // 1. Instantly remove from local React state
    setSavedProjects(prev => prev.filter(p => p._id !== projectId && p.id !== projectId));

    // 2. Instantly remove from localStorage cache
    try {
      const stored = localStorage.getItem('kld_workspace_items');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const remaining = parsed.filter((item: any) => item.id !== projectId && item._id !== projectId);
          localStorage.setItem('kld_workspace_items', JSON.stringify(remaining));
        }
      }
    } catch (e) {
      console.error('Error removing item from localStorage:', e);
    }

    // 3. Dispatch real-time event for cross-component sync
    window.dispatchEvent(new CustomEvent('project-saved'));

    // 4. Delete from MongoDB if authenticated and valid 24-character ObjectId
    const token = localStorage.getItem('token');
    if (token && projectId && projectId.length === 24) {
      try {
        await fetch(`${API_BASE_URL}/mockups/saved/${projectId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include'
        });
      } catch (err) {
        console.error('MongoDB delete error:', err);
      }
    }
  };

  const handleDuplicateProject = async (project: SavedDesignItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/mockups/saved`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify({
          name: `${project.name} (Copy)`,
          type: project.type || 'DIELINE',
          category: project.category || 'Tuck End Box',
          variantId: project.variantId || 1,
          dimensions: project.dimensions || { L: 150, W: 70, H: 200 }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchSavedProjects();
        window.dispatchEvent(new CustomEvent('project-saved'));
      } else {
        alert(data.message || 'Failed to duplicate project');
      }
    } catch {
      alert('Error duplicating project.');
    }
  };

  const handleOpenProject = (project: SavedDesignItem) => {
    const L_mm = project.dimensions?.L || 150;
    const W_mm = project.dimensions?.W || 70;
    const H_mm = project.dimensions?.H || 200;
    const cat = (project.category || project.name || '').toLowerCase();
    let model: "te" | "rte" | "auto_lock" | "cosmetic" = "te";
    if (cat.includes('reverse') || project.variantId === 2) {
      model = "rte";
    } else if (cat.includes('auto lock') || project.variantId === 3) {
      model = "auto_lock";
    } else if (cat.includes('cosmetic')) {
      model = "cosmetic";
    }

    try {
      const store = (window as any).__BOX_STORE__;
      if (store) {
        store.setBoxModel(model);
        store.setDim('L', L_mm / 25.4);
        store.setDim('W', W_mm / 25.4);
        store.setDim('H', H_mm / 25.4);
      }
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('navigate', { detail: 'dielines' }));
    onBack();
  };

  const userPlan = (user as any)?.subscription?.plan || user?.plan || 'FREE';
  const aiCredits = (user as any)?.subscription?.aiCredits ?? user?.aiCredits ?? 0;
  const projectList = Array.isArray(savedProjects) ? savedProjects : [];

  const filteredProjects = useMemo(() => {
    return projectList.filter(project => {
      if (!project) return false;
      const pName = String(project.name || 'Untitled Project');
      const pCat = String(project.category || '');
      const nameMatch = pName.toLowerCase().includes((searchQuery || '').toLowerCase());
      const categoryMatch = pCat.toLowerCase().includes((searchQuery || '').toLowerCase());
      const matchesQuery = nameMatch || categoryMatch;

      if (selectedCategoryFilter === 'ALL') return matchesQuery;
      const cat = pCat.toLowerCase();
      if (selectedCategoryFilter === 'TUCK') return matchesQuery && (cat.includes('tuck end box') || cat === 'tuck end');
      if (selectedCategoryFilter === 'REVERSE') return matchesQuery && cat.includes('reverse');
      if (selectedCategoryFilter === 'AUTO_LOCK') return matchesQuery && cat.includes('auto lock');
      if (selectedCategoryFilter === 'PRINT') return matchesQuery && cat.includes('print');
      return matchesQuery;
    });
  }, [projectList, searchQuery, selectedCategoryFilter]);

  return (
    <div className="user-profile-page">
      {/* LEFT SIDEBAR PANEL (Matching Screenshot Reference) */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-top-section">
          <div className="sidebar-logo" onClick={onBack} title="Return to Home">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <span>KEYLINE DESIGN</span>
          </div>

          <div className="sidebar-section-title">MENU</div>

          <nav className="sidebar-menu-list">
            <button 
              className={`sidebar-menu-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User className="w-4 h-4" /> Profile & Security
            </button>

            <button 
              className={`sidebar-menu-btn ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              <Package className="w-4 h-4" /> Saved Projects ({projectList.length})
            </button>

            <button 
              className={`sidebar-menu-btn ${activeTab === 'subscription' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscription')}
            >
              <CreditCard className="w-4 h-4" /> Subscription & Plan
            </button>

            <button 
              className={`sidebar-menu-btn ${activeTab === 'exports' ? 'active' : ''}`}
              onClick={() => setActiveTab('exports')}
            >
              <Download className="w-4 h-4" /> Export History
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom-section">
          <button 
            className="sidebar-logout-link"
            onClick={() => { authService.logout(); onBack(); }}
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="dashboard-main">
        {/* Top Header + Close Button (✕) */}
        <div className="main-top-header">
          <div className="page-title-block">
            <h1>
              {activeTab === 'profile' && 'Profile & Account Settings'}
              {activeTab === 'projects' && 'Saved Projects & Dielines'}
              {activeTab === 'subscription' && 'Subscription & Membership'}
              {activeTab === 'exports' && 'Export Downloads History'}
            </h1>
            <p>
              {activeTab === 'profile' && 'Manage your account details, name, email address, and security password.'}
              {activeTab === 'projects' && 'View, inspect, and manage all your 3D packaging designs.'}
              {activeTab === 'subscription' && 'Manage your active plan subscription and AI generation credits.'}
              {activeTab === 'exports' && 'Access and download past dieline blueprints and rendered packaging files.'}
            </p>
          </div>

          {/* CLOSE BUTTON (✕) to exit page */}
          <button 
            className="page-close-btn" 
            onClick={onBack}
            title="Close Profile Page (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message Notification */}
        {statusMsg && (
          <div 
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              marginBottom: '20px',
              background: statusMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: statusMsg.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FECACA',
              color: statusMsg.type === 'success' ? '#065F46' : '#991B1B',
              fontSize: '0.88rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : '⚠️'}
            {statusMsg.text}
          </div>
        )}

        {/* SECTION 1: PROFILE & SECURITY */}
        {activeTab === 'profile' && (
          <>
            <div className="clean-panel-card">
              <h2 className="panel-card-title">
                <User className="w-4 h-4 text-zinc-900" /> Account Information
              </h2>
              <form onSubmit={handleUpdateProfile}>
                <div className="clean-form-grid">
                  <div className="clean-field-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Your Full Name"
                      required
                    />
                  </div>

                  <div className="clean-field-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      value={user?.email || ''} 
                      disabled
                      style={{ opacity: 0.7, background: '#F3F4F6', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button type="submit" className="clean-submit-btn" disabled={isUpdating}>
                    <Save className="w-4 h-4" /> Save Profile Details
                  </button>
                </div>
              </form>
            </div>

            <div className="clean-panel-card">
              <h2 className="panel-card-title">
                <Lock className="w-4 h-4 text-zinc-900" /> Change Security Password
              </h2>
              <form onSubmit={handleChangePassword}>
                <div className="clean-form-grid">
                  <div className="clean-field-group">
                    <label>Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="clean-field-group">
                    <label>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        minLength={8}
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="clean-field-group">
                    <label>Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button type="submit" className="clean-submit-btn" disabled={isUpdating}>
                    <Key className="w-4 h-4" /> Update Password
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* SECTION 2: SAVED PROJECTS DATA TABLE */}
        {activeTab === 'projects' && (
          <div className="clean-panel-card">
            <div className="table-filter-bar">
              <span className="filter-badge-pill">Total Projects: <strong>{projectList.length}</strong></span>
              <span className="filter-badge-pill">Showing: <strong>{filteredProjects.length}</strong></span>
              <span className="filter-badge-pill">Saved in Cloud: <strong>Active</strong></span>
            </div>

            {/* Search & Category Filter Controls (Always Visible) */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#9CA3AF' }} />
                <input 
                  type="text"
                  placeholder="Search saved projects by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '36px',
                    paddingRight: '12px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'TUCK', label: 'Tuck End' },
                  { id: 'REVERSE', label: 'Reverse Tuck' },
                  { id: 'AUTO_LOCK', label: 'Auto Lock' },
                  { id: 'PRINT', label: 'Print Layouts' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategoryFilter(tab.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: selectedCategoryFilter === tab.id ? 700 : 500,
                      background: selectedCategoryFilter === tab.id ? '#111827' : '#F3F4F6',
                      color: selectedCategoryFilter === tab.id ? '#ffffff' : '#374151',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingProjects ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                Loading saved projects from MongoDB...
              </div>
            ) : projectList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
                <Package className="w-10 h-10 mx-auto mb-3 opacity-40 text-zinc-400" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>No Saved Projects Yet</h3>
                <p style={{ fontSize: '0.88rem', margin: '0 0 20px 0' }}>Design custom packaging box dielines in the studio and click "Save Project".</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    className="clean-submit-btn" 
                    onClick={() => handleNavToView('models')}
                    style={{ background: '#111827', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Package className="w-4 h-4" /> Explore 3D Mockup Models
                  </button>
                  <button 
                    className="clean-submit-btn" 
                    onClick={() => handleNavToView('dielines')}
                    style={{ background: '#ffffff', color: '#111827', border: '1.5px solid #111827', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" /> Open Dieline Generator
                  </button>
                </div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>No saved projects match your search query or filter.</p>
              </div>
            ) : (
              <table className="clean-data-table">
                <thead>
                  <tr>
                    <th>SNO</th>
                    <th>PROJECT NAME</th>
                    <th>BOX CATEGORY</th>
                    <th>DIMENSIONS (L×W×H)</th>
                    <th>DATE SAVED</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project, idx) => (
                    <tr key={project._id}>
                      <td style={{ fontWeight: 600, color: '#6B7280' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600, color: '#111827' }}>{project.name}</td>
                      <td>
                        <span style={{ background: '#F3F4F6', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                          {project.category || 'Packaging'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {project.dimensions ? `${project.dimensions.L || '-'} × ${project.dimensions.W || '-'} × ${project.dimensions.H || '-'} mm` : '-'}
                      </td>
                      <td style={{ color: '#6B7280' }}>
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button 
                          className="action-btn-primary"
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                          }}
                          onClick={() => handleOpenProject(project)}
                          title="Open Dieline Editor with Saved Dimensions"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open / Edit
                        </button>
                        <button 
                          className="action-btn-secondary"
                          style={{
                            background: '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)'
                          }}
                          onClick={() => handleDuplicateProject(project)}
                          title="Duplicate / Clone this project"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicate
                        </button>
                        <button 
                          className="action-btn-danger" 
                          onClick={() => handleDeleteProject(project._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* SECTION 3: SUBSCRIPTION & PLAN */}
        {activeTab === 'subscription' && (
          <div className="clean-panel-card">
            <h2 className="panel-card-title">
              <CreditCard className="w-4 h-4 text-zinc-900" /> Subscription & Membership Overview
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '20px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Current Plan</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>{userPlan} Tier</div>
                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>✓ Active Subscription</div>
              </div>

              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '20px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Monthly AI Credits</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>{aiCredits.toLocaleString()}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Resets on 1st of every month</div>
              </div>
            </div>

            <button 
              className="clean-submit-btn"
              onClick={() => {
                onBack();
                window.dispatchEvent(new CustomEvent('navigate', { detail: 'pricing' }));
              }}
            >
              <Sparkles className="w-4 h-4" /> Upgrade Membership Plan
            </button>
          </div>
        )}

        {/* SECTION 4: EXPORT HISTORY */}
        {activeTab === 'exports' && (
          <div className="clean-panel-card">
            <h2 className="panel-card-title">
              <Download className="w-4 h-4 text-zinc-900" /> Export Downloads Log
            </h2>

            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
              <Download className="w-10 h-10 mx-auto mb-3 opacity-30 text-zinc-400" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>No Export Logs Found</h3>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Rendered SVG, PDF, and 2K/8K images will appear here for direct download.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

class UserProfileErrorBoundary extends React.Component<{ onBack: () => void; children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('UserProfilePage Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#18181b', margin: '0 0 8px 0' }}>Profile Page Error</h2>
          <p style={{ color: '#71717a', fontSize: '0.9rem', maxWidth: '500px', margin: '0 0 24px 0' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button onClick={this.props.onBack} style={{ padding: '10px 20px', borderRadius: '8px', background: '#111827', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Back to Studio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function UserProfilePageWrapper(props: { onBack: () => void; onNavigate?: (view: string) => void }) {
  return (
    <UserProfileErrorBoundary onBack={props.onBack}>
      <UserProfilePage {...props} />
    </UserProfileErrorBoundary>
  );
}
