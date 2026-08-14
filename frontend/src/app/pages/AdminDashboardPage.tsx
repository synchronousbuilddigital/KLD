// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Package, CreditCard, Sparkles, Shield, Search, Filter, RefreshCw,
  ExternalLink, Trash2, ArrowLeft, CheckCircle2, XCircle, Edit3, Save, Lock, AlertTriangle, Layers, Database,
  TrendingUp, DollarSign, ChevronDown, ChevronUp, Folder, Tag, Gift, Plus, Calendar, Percent, Lightbulb, Clock
} from 'lucide-react';
import { authService, UserProfile } from '../../services/auth';
import { API_BASE_URL } from '../../config/api';
import './AdminDashboardPage.css';

interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  plans: { FREE: number; PRO: number; ENTERPRISE: number };
  revenue?: {
    mrrUSD: number;
    arrUSD: number;
    mrrINR: number;
    arrINR: number;
    proPrice: number;
    enterprisePrice: number;
  };
  recentUsers: any[];
  categoryStats: { _id: string; count: number }[];
}

interface AdminUserItem {
  id: string;
  email: string;
  fullName?: string;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  savedProjectsCount?: number;
  subscription: {
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    aiCredits: number;
  };
}

interface AdminProjectItem {
  _id: string;
  name: string;
  type: string;
  category: string;
  variantId?: number;
  user?: { email?: string; fullName?: string };
  dimensions?: { L?: number; W?: number; H?: number };
  createdAt?: string;
}

function AdminDashboardPage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'projects' | 'cms' | 'membership' | 'settings'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Membership & Promotion state
  const [basePriceMonthly, setBasePriceMonthly] = useState<number>(1000);
  const [basePriceYearly, setBasePriceYearly] = useState<number>(600);
  const [baseAiCredits, setBaseAiCredits] = useState<number>(300);
  const [proPriceMonthly, setProPriceMonthly] = useState<number>(10000);
  const [proPriceYearly, setProPriceYearly] = useState<number>(6000);
  const [proAiCredits, setProAiCredits] = useState<number>(10000);
  const [yearlyDiscountPercent, setYearlyDiscountPercent] = useState<number>(40);
  const [membershipSubTab, setMembershipSubTab] = useState<'prices' | 'campaign' | 'coupons'>('prices');

  const [promoActive, setPromoActive] = useState<boolean>(false);
  const [promoTitle, setPromoTitle] = useState<string>('Festival Sale');
  const [promoDescription, setPromoDescription] = useState<string>('Save 40% on all plans!');
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(40);
  const [promoStartsAt, setPromoStartsAt] = useState<string>('');
  const [promoEndsAt, setPromoEndsAt] = useState<string>('');
  const [isSavingPlanConfig, setIsSavingPlanConfig] = useState(false);

  // Coupons state
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscountPercent, setNewCouponDiscountPercent] = useState(20);
  const [newCouponFlatINR, setNewCouponFlatINR] = useState(0);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState(1000);
  const [newCouponExpiresAt, setNewCouponExpiresAt] = useState('');
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  // Users state
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'USER' | 'ADMIN'>('USER');
  const [editPlan, setEditPlan] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE');
  const [editCredits, setEditCredits] = useState<number>(0);
  const [editVerified, setEditVerified] = useState<boolean>(true);

  // Projects state
  const [projectsList, setProjectsList] = useState<AdminProjectItem[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectViewMode, setProjectViewMode] = useState<'grouped' | 'list'>('grouped');
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  const toggleUserExpand = (emailKey: string) => {
    setExpandedUsers(prev => ({ ...prev, [emailKey]: !prev[emailKey] }));
  };

  // Group projects by user
  const groupedProjects = useMemo(() => {
    const map: Record<string, { userObj: { fullName?: string; email?: string }; projects: AdminProjectItem[] }> = {};
    projectsList.forEach(p => {
      const emailKey = p.user?.email || 'guest@system.local';
      if (!map[emailKey]) {
        map[emailKey] = {
          userObj: p.user || { fullName: 'Guest / System', email: 'guest@system.local' },
          projects: []
        };
      }
      map[emailKey].projects.push(p);
    });
    return Object.values(map);
  }, [projectsList]);

  // Maintenance mode
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => {
    return localStorage.getItem('maintenanceMode') === 'true';
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggleMaintenance = () => {
    const nextState = !maintenanceMode;
    setMaintenanceMode(nextState);
    localStorage.setItem('maintenanceMode', String(nextState));
    window.dispatchEvent(new Event('maintenance-mode-change'));
    setStatusMsg({
      type: 'success',
      text: nextState
        ? 'System Maintenance Mode ENABLED! Non-admin users will see the maintenance notice screen.'
        : 'System Maintenance Mode DISABLED! Platform is fully operational for all users.'
    });
  };

  useEffect(() => {
    fetchStats(false);
    fetchUsers(false);
    fetchProjects(false);

    const handleProjectSaved = () => {
      fetchStats(true);
      fetchUsers(true);
      fetchProjects(true);
    };
    window.addEventListener('project-saved', handleProjectSaved);

    const interval = setInterval(() => {
      fetchStats(true);
      fetchUsers(true);
      fetchProjects(true);
    }, 10000); // Silent background sync every 10 seconds

    return () => {
      window.removeEventListener('project-saved', handleProjectSaved);
      clearInterval(interval);
    };
  }, [userSearch, userRoleFilter, projectSearch]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchStats = async (silent = false) => {
    if (!silent && !stats) setIsLoadingStats(true);
    try {
      let res = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.status === 401) {
        await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
        res = await fetch(`${API_BASE_URL}/admin/stats`, { headers: getAuthHeaders(), credentials: 'include' });
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error('Error fetching admin stats', e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchUsers = async (silent = false) => {
    if (!silent && usersList.length === 0) setIsLoadingUsers(true);
    try {
      const url = `${API_BASE_URL}/admin/users?search=${encodeURIComponent(userSearch)}&role=${userRoleFilter}`;
      let res = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.status === 401) {
        await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
        res = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.users)) {
        setUsersList(data.data.users);
      }
    } catch (e) {
      console.error('Error fetching admin users', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchProjects = async (silent = false) => {
    if (!silent && projectsList.length === 0) setIsLoadingProjects(true);
    try {
      const url = `${API_BASE_URL}/admin/projects?search=${encodeURIComponent(projectSearch)}`;
      let res = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.status === 401) {
        await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
        res = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.projects)) {
        setProjectsList(data.data.projects);
      }
    } catch (e) {
      console.error('Error fetching admin projects', e);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleStartEditUser = (user: AdminUserItem) => {
    setEditingUserId(user.id);
    setEditRole(user.role || 'USER');
    setEditPlan(user.subscription?.plan || 'FREE');
    setEditCredits(user.subscription?.aiCredits || 0);
    setEditVerified(user.isVerified ?? true);
  };

  const handleSaveUser = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          role: editRole,
          plan: editPlan,
          aiCredits: editCredits,
          isVerified: editVerified
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: 'User details updated successfully!' });
        setEditingUserId(null);
        fetchUsers();
        fetchStats();
      } else {
        alert(data.message || 'Failed to update user.');
      }
    } catch {
      alert('Error updating user.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Admin Action: Delete this user design project permanently?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/projects/${projectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        setProjectsList(prev => prev.filter(p => p._id !== projectId));
        window.dispatchEvent(new CustomEvent('project-saved'));
        fetchStats(true);
      } else {
        alert('Failed to delete project.');
      }
    } catch {
      alert('Error deleting project.');
    }
  };

  const handleOpenProjectInStudio = (project: AdminProjectItem) => {
    const L_mm = project.dimensions?.L || 150;
    const W_mm = project.dimensions?.W || 70;
    const H_mm = project.dimensions?.H || 200;
    const cat = (project.category || project.name || '').toLowerCase();
    let model: "te" | "rte" | "auto_lock" | "cake" = "te";
    if (cat.includes('reverse') || project.variantId === 2) {
      model = "rte";
    } else if (cat.includes('auto lock') || project.variantId === 3) {
      model = "auto_lock";
    } else if (cat.includes('cake')) {
      model = "cake";
    }

    window.dispatchEvent(new CustomEvent('open-box-studio', {
      detail: { model, L: L_mm, W: W_mm, H: H_mm }
    }));
  };

  /* ─── MEMBERSHIP & COUPON API HANDLERS ──────────────────────────── */
  const fetchPlanConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/plans`);
      const data = await res.json();
      if (data.success && data.data) {
        const c = data.data;
        setBasePriceMonthly(c.basePriceMonthly || 1000);
        setBasePriceYearly(c.basePriceYearly || 600);
        setBaseAiCredits(c.baseAiCredits || 300);
        setProPriceMonthly(c.proPriceMonthly || 10000);
        setProPriceYearly(c.proPriceYearly || 6000);
        setProAiCredits(c.proAiCredits || 10000);
        setYearlyDiscountPercent(c.yearlyDiscountPercent || 40);

        if (c.promotion) {
          setPromoActive(Boolean(c.promotion.active));
          setPromoTitle(c.promotion.title || 'Festival Sale');
          setPromoDescription(c.promotion.description || '');
          setPromoDiscountPercent(c.promotion.discountPercent || 0);
          setPromoStartsAt(c.promotion.startsAt ? c.promotion.startsAt.split('T')[0] : '');
          setPromoEndsAt(c.promotion.endsAt ? c.promotion.endsAt.split('T')[0] : '');
        }
      }
    } catch (e) {
      console.error('Failed to fetch plan config', e);
    }
  };

  const handleSavePlanConfig = async () => {
    try {
      setIsSavingPlanConfig(true);
      const res = await fetch(`${API_BASE_URL}/plans/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          basePriceMonthly,
          basePriceYearly,
          baseAiCredits,
          proPriceMonthly,
          proPriceYearly,
          proAiCredits,
          yearlyDiscountPercent,
          promotion: {
            active: promoActive,
            title: promoTitle,
            description: promoDescription,
            discountPercent: promoDiscountPercent,
            startsAt: promoStartsAt || null,
            endsAt: promoEndsAt || null
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: 'Membership pricing and promotion settings updated live!' });
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to update plan config.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Error saving plan config.' });
    } finally {
      setIsSavingPlanConfig(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setIsLoadingCoupons(true);
      const res = await fetch(`${API_BASE_URL}/plans/admin/coupons`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setCouponsList(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch coupons', e);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    try {
      setIsCreatingCoupon(true);
      const res = await fetch(`${API_BASE_URL}/plans/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: newCouponCode,
          discountPercent: newCouponDiscountPercent,
          flatDiscountINR: newCouponFlatINR,
          maxUses: newCouponMaxUses,
          expiresAt: newCouponExpiresAt || null,
          active: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: `Coupon "${newCouponCode.toUpperCase()}" created!` });
        setNewCouponCode('');
        fetchCoupons();
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to create coupon.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Error creating coupon.' });
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleToggleCoupon = async (couponId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/plans/admin/coupons/${couponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !currentActive })
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (e) {
      console.error('Failed to toggle coupon', e);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon code?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/plans/admin/coupons/${couponId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setCouponsList(prev => prev.filter(c => c._id !== couponId));
        setStatusMsg({ type: 'success', text: 'Coupon deleted.' });
      }
    } catch (e) {
      console.error('Failed to delete coupon', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'membership') {
      fetchPlanConfig();
      fetchCoupons();
    }
  }, [activeTab]);

  return (
    <div className="admin-dashboard-container">
      {/* HEADER BAR */}
      <header className="admin-header">
        <div className="admin-header-left">
          <button className="admin-back-btn" onClick={onBack} title="Back to Packaging Studio">
            <ArrowLeft className="w-4 h-4" /> Back to Studio
          </button>
          <div className="admin-brand">
            <Shield className="w-6 h-6 text-amber-500" />
            <span>KLD Control Center</span>
            <span className="admin-role-badge">ADMIN</span>
          </div>
        </div>
        <div className="admin-header-right">
          <button className="admin-refresh-btn" onClick={() => { fetchStats(); fetchUsers(); fetchProjects(); }}>
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
        </div>
      </header>

      {/* STATUS TOAST */}
      {statusMsg && (
        <div className={`admin-status-bar ${statusMsg.type}`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: 'auto', cursor: 'pointer' }}>×</button>
        </div>
      )}

      <div className="admin-body">
        {/* SIDEBAR NAVIGATION */}
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            <button
              className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Shield className="w-4 h-4" /> Executive Overview
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users className="w-4 h-4" /> User Management
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              <Package className="w-4 h-4" /> Saved Projects
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'cms' ? 'active' : ''}`}
              onClick={() => setActiveTab('cms')}
            >
              <Layers className="w-4 h-4" /> Template & Model CMS
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'membership' ? 'active' : ''}`}
              onClick={() => setActiveTab('membership')}
            >
              <CreditCard className="w-4 h-4 text-emerald-600" /> Membership & Coupons
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Database className="w-4 h-4" /> Platform Settings
            </button>
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="admin-main">
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="admin-tab-content">
              <h2 className="admin-page-title">Executive Dashboard Overview</h2>

              {/* KPI STAT CARDS */}
              <div className="admin-kpi-grid">
                <div className="kpi-card" style={{ borderTop: '3px solid #10b981' }}>
                  <div className="kpi-header">
                    <span className="kpi-title">Monthly Revenue (MRR)</span>
                    <TrendingUp className="w-5 h-5" style={{ color: '#10b981' }} />
                  </div>
                  <div className="kpi-value" style={{ color: '#047857' }}>
                    ₹{(stats?.revenue?.mrrINR ?? 0).toLocaleString('en-IN')}
                  </div>
                  <div className="kpi-sub">
                    Monthly Recurring Revenue
                  </div>
                </div>

                <div className="kpi-card" style={{ borderTop: '3px solid #d97706' }}>
                  <div className="kpi-header">
                    <span className="kpi-title">Annual Revenue (ARR)</span>
                    <TrendingUp className="w-5 h-5" style={{ color: '#d97706' }} />
                  </div>
                  <div className="kpi-value" style={{ color: '#b45309' }}>
                    ₹{(stats?.revenue?.arrINR ?? 0).toLocaleString('en-IN')}
                  </div>
                  <div className="kpi-sub">
                    Annualized Subscription Revenue
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Total Users</span>
                    <Users className="w-5 h-5" style={{ color: '#d97706' }} />
                  </div>
                  <div className="kpi-value">{stats?.totalUsers ?? '-'}</div>
                  <div className="kpi-sub">Registered Accounts</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Saved Box Designs</span>
                    <Package className="w-5 h-5" style={{ color: '#C89A63' }} />
                  </div>
                  <div className="kpi-value">{stats?.totalProjects ?? '-'}</div>
                  <div className="kpi-sub">Total 3D Packaging Models</div>
                </div>
              </div>

              {/* RECENT ACTIVITY, REVENUE & BREAKDOWN */}
              <div className="admin-grid-3">
                {/* Recent Signups */}
                <div className="admin-panel-card">
                  <h3 className="panel-title">Recent Registrations</h3>
                  <div className="admin-list">
                    {stats?.recentUsers?.map((u: any) => (
                      <div key={u._id} className="admin-list-row">
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{u.email}</div>
                          <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>Joined {new Date(u.createdAt).toLocaleDateString()}</div>
                        </div>
                        <span className={`role-pill ${u.role}`}>{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscription Tier Revenue Breakdown */}
                <div className="admin-panel-card">
                  <h3 className="panel-title">Subscription & Revenue Tier</h3>
                  <div className="admin-list">
                    {/* BASE TIER */}
                    <div className="admin-list-row">
                      <div>
                        <span style={{ fontWeight: 700, color: '#2563eb' }}>BASE Tier</span> (₹{(basePriceMonthly || stats?.revenue?.basePrice || 1000).toLocaleString('en-IN')} / mo)
                        <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{stats?.plans?.BASE || 0} Paid Accounts</div>
                      </div>
                      <span className="plan-pill BASE" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                        ₹{((stats?.plans?.BASE || 0) * (basePriceMonthly || stats?.revenue?.basePrice || 1000)).toLocaleString('en-IN')} / mo
                      </span>
                    </div>

                    {/* PRO TIER */}
                    <div className="admin-list-row">
                      <div>
                        <span style={{ fontWeight: 700, color: '#4f46e5' }}>PRO Tier</span> (₹{(proPriceMonthly || stats?.revenue?.proPrice || 10000).toLocaleString('en-IN')} / mo)
                        <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{stats?.plans?.PRO || 0} Paid Accounts</div>
                      </div>
                      <span className="plan-pill PRO" style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                        ₹{((stats?.plans?.PRO || 0) * (proPriceMonthly || stats?.revenue?.proPrice || 10000)).toLocaleString('en-IN')} / mo
                      </span>
                    </div>

                    {/* FREE TIER */}
                    <div className="admin-list-row">
                      <div>
                        <span style={{ fontWeight: 700, color: '#52525b' }}>FREE Tier</span> (₹0 / mo)
                        <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{stats?.plans?.FREE || 0} Accounts</div>
                      </div>
                      <span className="plan-pill FREE" style={{ background: '#f4f4f5', color: '#52525b', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                        ₹0 / mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Packaging Category Breakdown */}
                <div className="admin-panel-card">
                  <h3 className="panel-title">Popular Dieline Categories</h3>
                  <div className="admin-list">
                    {stats?.categoryStats?.length ? stats.categoryStats.map((c: any) => (
                      <div key={c._id || 'other'} className="admin-list-row">
                        <span style={{ fontWeight: 600, color: '#374151' }}>{c._id || 'Standard Packaging'}</span>
                        <span className="badge-pill">{c.count} Projects</span>
                      </div>
                    )) : (
                      <div style={{ color: '#9CA3AF', padding: '20px', textAlign: 'center' }}>No category stats available yet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="admin-tab-content">
              <div className="admin-header-row">
                <h2 className="admin-page-title">User Account Directory</h2>
                <div className="admin-search-bar">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  />
                  <button onClick={fetchUsers} className="admin-action-btn">Search</button>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>USER EMAIL</th>
                      <th>FULL NAME</th>
                      <th>ROLE</th>
                      <th>PLAN</th>
                      <th>AI CREDITS</th>
                      <th>VERIFIED</th>
                      <th>SAVED PROJECTS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingUsers ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>Loading users directory...</td></tr>
                    ) : usersList.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>No users match search query.</td></tr>
                    ) : (
                      usersList.map((user) => {
                        const targetId = user.id || (user as any)._id;
                        const isEditing = Boolean(editingUserId) && String(editingUserId) === String(targetId);
                        return (
                          <tr key={targetId} style={{ background: isEditing ? '#fefce8' : undefined }}>
                            <td style={{ fontWeight: 600 }}>{user.email}</td>
                            <td>{user.fullName || '-'}</td>
                            <td>
                              <span className={`role-pill ${user.role}`}>{user.role}</span>
                            </td>
                            <td>
                              {isEditing ? (
                                <select
                                  value={editPlan}
                                  onChange={(e) => setEditPlan(e.target.value as any)}
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    border: '2px solid #10b981',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    background: '#ffffff',
                                    color: '#18181b',
                                    outline: 'none'
                                  }}
                                >
                                  <option value="FREE">FREE</option>
                                  <option value="PRO">PRO</option>
                                  <option value="ENTERPRISE">ENTERPRISE</option>
                                </select>
                              ) : (
                                <span className={`plan-pill ${user.subscription?.plan || 'FREE'}`}>{user.subscription?.plan || 'FREE'}</span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editCredits}
                                  onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
                                  style={{
                                    width: '80px',
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    border: '2px solid #2563eb',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                  }}
                                />
                              ) : (
                                <strong>{user.subscription?.aiCredits || 0}</strong>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <select
                                  value={editVerified ? 'true' : 'false'}
                                  onChange={(e) => setEditVerified(e.target.value === 'true')}
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    border: '2px solid #059669',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    background: '#ffffff',
                                    color: '#18181b',
                                    outline: 'none'
                                  }}
                                >
                                  <option value="true">✓ Verified</option>
                                  <option value="false">Pending</option>
                                </select>
                              ) : user.isVerified ? (
                                <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>✓ Verified</span>
                              ) : (
                                <span style={{ color: '#D97706', fontSize: '0.8rem' }}>Pending</span>
                              )}
                            </td>
                            <td>
                              <button
                                style={{
                                  cursor: 'pointer',
                                  background: user.savedProjectsCount ? '#fef3c7' : '#f4f4f5',
                                  color: user.savedProjectsCount ? '#92400e' : '#71717a',
                                  border: '1px solid rgba(0,0,0,0.06)',
                                  borderRadius: '12px',
                                  padding: '4px 10px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Click to view all projects saved by this user"
                                onClick={() => {
                                  setProjectSearch(user.email);
                                  setActiveTab('projects');
                                }}
                              >
                                <Package className="w-3 h-3" /> {user.savedProjectsCount || 0} Saved
                              </button>
                            </td>
                            <td>
                              {isEditing ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="save-btn" onClick={() => handleSaveUser(targetId)}>
                                    <Save className="w-3.5 h-3.5" /> Save
                                  </button>
                                  <button className="cancel-btn" onClick={() => setEditingUserId(null)}>Cancel</button>
                                </div>
                              ) : (
                                <button className="edit-btn" onClick={() => handleStartEditUser(user)}>
                                  <Edit3 className="w-3.5 h-3.5" /> Edit User
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: GLOBAL SAVED PROJECTS */}
          {activeTab === 'projects' && (
            <div className="admin-tab-content">
              <div className="admin-header-row" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 className="admin-page-title" style={{ marginBottom: '4px' }}>Global Saved Dielines & Projects</h2>
                  <div style={{ fontSize: '0.82rem', color: '#6B7280' }}>
                    Showing <strong>{projectsList.length}</strong> project{projectsList.length !== 1 ? 's' : ''} across <strong>{groupedProjects.length}</strong> customer account{groupedProjects.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* View Switcher Controls & Search */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
                  <div style={{ display: 'flex', background: '#e4e4e7', padding: '3px', borderRadius: '10px', gap: '4px' }}>
                    <button
                      onClick={() => setProjectViewMode('grouped')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: projectViewMode === 'grouped' ? '#ffffff' : 'transparent',
                        color: projectViewMode === 'grouped' ? '#18181b' : '#71717a',
                        boxShadow: projectViewMode === 'grouped' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Folder className="w-4 h-4 text-amber-600" /> Group by User
                    </button>
                    <button
                      onClick={() => setProjectViewMode('list')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: projectViewMode === 'list' ? '#ffffff' : 'transparent',
                        color: projectViewMode === 'list' ? '#18181b' : '#71717a',
                        boxShadow: projectViewMode === 'list' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Package className="w-4 h-4 text-zinc-600" /> All Projects List
                    </button>
                  </div>

                  <div className="admin-search-bar">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by project or user..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchProjects()}
                    />
                    {projectSearch && (
                      <button
                        onClick={() => { setProjectSearch(''); fetchProjects(); }}
                        style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '0 4px', fontSize: '0.85rem' }}
                        title="Clear filter"
                      >
                        ✕
                      </button>
                    )}
                    <button onClick={fetchProjects} className="admin-action-btn">Search</button>
                  </div>
                </div>
              </div>

              {/* SEARCH FILTER NOTICE */}
              {projectSearch && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Showing search results for: <strong>"{projectSearch}"</strong></span>
                  <button onClick={() => { setProjectSearch(''); fetchProjects(); }} style={{ background: 'none', border: 'none', color: '#92400e', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Clear Search</button>
                </div>
              )}

              {/* GROUPED USER FOLDERS VIEW */}
              {projectViewMode === 'grouped' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  {isLoadingProjects ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', background: '#ffffff', borderRadius: '12px' }}>Loading projects list...</div>
                  ) : groupedProjects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', background: '#ffffff', borderRadius: '12px' }}>No saved projects found across system.</div>
                  ) : (
                    groupedProjects.map((group) => {
                      const userEmail = group.userObj?.email || 'guest@system.local';
                      const isExpanded = expandedUsers[userEmail] !== false;

                      return (
                        <div
                          key={userEmail}
                          style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            border: '1px solid #e4e4e7',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                            overflow: 'hidden',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* USER FOLDER HEADER */}
                          <div
                            onClick={() => toggleUserExpand(userEmail)}
                            style={{
                              padding: '16px 20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              background: isExpanded ? '#fafafa' : '#ffffff',
                              borderBottom: isExpanded ? '1px solid #f4f4f5' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fde68a' }}>
                                <Users className="w-5 h-5" />
                              </div>
                              <div>
                                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {group.userObj?.fullName || 'Anonymous Customer'}
                                  <span style={{ fontSize: '0.72rem', background: '#f4f4f5', color: '#52525b', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                    {group.projects.length} Saved Design{group.projects.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.82rem', color: '#71717a', marginTop: '2px' }}>
                                  {group.userObj?.email || 'No email associated'}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleUserExpand(userEmail);
                              }}
                              style={{
                                background: isExpanded ? '#18181b' : '#f4f4f5',
                                color: isExpanded ? '#ffffff' : '#18181b',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              {isExpanded ? (
                                <><span>Hide Projects</span> <ChevronUp className="w-4 h-4" /></>
                              ) : (
                                <><span>View Projects ({group.projects.length})</span> <ChevronDown className="w-4 h-4" /></>
                              )}
                            </button>
                          </div>

                          {/* EXPANDABLE USER PROJECTS TABLE */}
                          {isExpanded && (
                            <div style={{ padding: '0 4px 8px 4px' }}>
                              <table className="admin-table" style={{ margin: 0 }}>
                                <thead>
                                  <tr>
                                    <th>PROJECT NAME</th>
                                    <th>BOX CATEGORY</th>
                                    <th>SAVED DIMENSIONS (L×W×H)</th>
                                    <th>DATE CREATED</th>
                                    <th>ADMIN ACTIONS</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.projects.map((project) => (
                                    <tr key={project._id}>
                                      <td style={{ fontWeight: 700, color: '#18181b' }}>{project.name}</td>
                                      <td>
                                        <span className="badge-pill">{project.category || 'Tuck End'}</span>
                                      </td>
                                      <td style={{ fontFamily: 'monospace' }}>
                                        {project.dimensions ? `${project.dimensions.L || '-'} × ${project.dimensions.W || '-'} × ${project.dimensions.H || '-'} mm` : '-'}
                                      </td>
                                      <td style={{ color: '#6B7280' }}>
                                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recent'}
                                      </td>
                                      <td style={{ display: 'flex', gap: '6px' }}>
                                        <button className="open-studio-btn" onClick={() => handleOpenProjectInStudio(project)}>
                                          <ExternalLink className="w-3.5 h-3.5" /> Inspect in 3D
                                        </button>
                                        <button className="delete-btn" onClick={() => handleDeleteProject(project._id)}>
                                          <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* LIST VIEW (FLAT TABLE) */}
              {projectViewMode === 'list' && (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>PROJECT NAME</th>
                        <th>USER OWNER</th>
                        <th>BOX CATEGORY</th>
                        <th>SAVED DIMENSIONS (L×W×H)</th>
                        <th>DATE CREATED</th>
                        <th>ADMIN ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingProjects ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>Loading projects...</td></tr>
                      ) : projectsList.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>No saved projects found across system.</td></tr>
                      ) : (
                        projectsList.map((project) => (
                          <tr key={project._id}>
                            <td style={{ fontWeight: 600 }}>{project.name}</td>
                            <td>
                              <div style={{ fontWeight: 700, color: '#111827' }}>
                                {project.user?.fullName || 'Anonymous User'}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                                {project.user?.email || 'Guest / System'}
                              </div>
                            </td>
                            <td>
                              <span className="badge-pill">{project.category || 'Tuck End'}</span>
                            </td>
                            <td style={{ fontFamily: 'monospace' }}>
                              {project.dimensions ? `${project.dimensions.L || '-'} × ${project.dimensions.W || '-'} × ${project.dimensions.H || '-'} mm` : '-'}
                            </td>
                            <td style={{ color: '#6B7280' }}>
                              {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recent'}
                            </td>
                            <td style={{ display: 'flex', gap: '6px' }}>
                              <button className="open-studio-btn" onClick={() => handleOpenProjectInStudio(project)}>
                                <ExternalLink className="w-3.5 h-3.5" /> Inspect in 3D
                              </button>
                              <button className="delete-btn" onClick={() => handleDeleteProject(project._id)}>
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TEMPLATE & MODEL CMS */}
          {activeTab === 'cms' && (
            <div className="admin-tab-content">
              <h2 className="admin-page-title">Template & Dieline CMS</h2>
              <div className="admin-panel-card">
                <h3 className="panel-title">Active 3D Packaging Models & Studio Generators</h3>
                <div className="admin-list" style={{ gap: '16px' }}>

                  {/* Template 1 */}
                  <div className="admin-list-row" style={{ padding: '16px 20px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '1.05rem', color: '#18181b' }}>Tuck End Box</strong>
                        <span className="role-pill ADMIN">ACTIVE</span>
                        <span style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}>Variant ID: 1</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>
                        Standard straight tuck packaging box with 3D canvas folding logic and dieline blueprint export.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className="open-studio-btn"
                        style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('open-box-studio', { detail: { model: 'te', L: 150, W: 70, H: 200 } }));
                        }}
                        title="Open and Inspect 3D Canvas Model"
                      >
                        <ExternalLink className="w-4 h-4" /> Open / Inspect 3D Model
                      </button>
                    </div>
                  </div>

                  {/* Template 2 */}
                  <div className="admin-list-row" style={{ padding: '16px 20px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '1.05rem', color: '#18181b' }}>Reverse Tuck End Box</strong>
                        <span className="role-pill ADMIN">ACTIVE</span>
                        <span style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}>Variant ID: 2</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>
                        Reverse tuck dieline layout with opposite opening flaps and automatic 3D folding animation.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className="open-studio-btn"
                        style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('open-box-studio', { detail: { model: 'rte', L: 150, W: 70, H: 200 } }));
                        }}
                        title="Open and Inspect 3D Canvas Model"
                      >
                        <ExternalLink className="w-4 h-4" /> Open / Inspect 3D Model
                      </button>
                    </div>
                  </div>

                  {/* Template 3 */}
                  <div className="admin-list-row" style={{ padding: '16px 20px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '1.05rem', color: '#18181b' }}>Auto Lock Bottom Box</strong>
                        <span className="role-pill ADMIN">ACTIVE</span>
                        <span style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}>Variant ID: 3</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>
                        Heavy-duty crash lock bottom packaging template with automated interlocking base dieline logic.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className="open-studio-btn"
                        style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('open-box-studio', { detail: { model: 'auto_lock', L: 150, W: 70, H: 200 } }));
                        }}
                        title="Open and Inspect 3D Canvas Model"
                      >
                        <ExternalLink className="w-4 h-4" /> Open / Inspect 3D Model
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MEMBERSHIP & COUPONS MANAGEMENT */}
          {activeTab === 'membership' && (
            <div className="admin-tab-content">
              {/* HERO METRICS HEADER */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                  borderRadius: '20px',
                  padding: '24px 28px',
                  color: '#ffffff',
                  marginBottom: '24px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Membership & Promotions Control</h2>
                      <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginTop: '2px' }}>
                        Manage dynamic plan rates, AI credit limits, auto-expiring sale banners, and coupon vouchers.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleSavePlanConfig}
                    disabled={isSavingPlanConfig}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Save className="w-4.5 h-4.5" /> {isSavingPlanConfig ? 'Saving...' : 'Save Live Configuration'}
                  </button>
                </div>
              </div>

              {/* SUB-TAB NAVIGATION PILLS */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  background: '#f4f4f5',
                  padding: '6px',
                  borderRadius: '14px',
                  marginBottom: '24px',
                  width: 'fit-content',
                  border: '1px solid #e4e4e7'
                }}
              >
                <button
                  onClick={() => setMembershipSubTab('prices')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    background: membershipSubTab === 'prices' ? '#ffffff' : 'transparent',
                    color: membershipSubTab === 'prices' ? '#18181b' : '#71717a',
                    boxShadow: membershipSubTab === 'prices' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Plan Prices & AI Credits
                </button>
                <button
                  onClick={() => setMembershipSubTab('campaign')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    background: membershipSubTab === 'campaign' ? '#ffffff' : 'transparent',
                    color: membershipSubTab === 'campaign' ? '#18181b' : '#71717a',
                    boxShadow: membershipSubTab === 'campaign' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <Gift className="w-4 h-4 text-amber-600" /> Sale Campaign & Banner
                  {promoActive && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  )}
                </button>
                <button
                  onClick={() => setMembershipSubTab('coupons')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    background: membershipSubTab === 'coupons' ? '#ffffff' : 'transparent',
                    color: membershipSubTab === 'coupons' ? '#18181b' : '#71717a',
                    boxShadow: membershipSubTab === 'coupons' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <Tag className="w-4 h-4 text-indigo-600" /> Coupons & Vouchers ({couponsList.length})
                </button>
              </div>

              {/* SUB-TAB 1: PLAN PRICES & AI CREDITS */}
              {membershipSubTab === 'prices' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                  {/* BASE PLAN CARD */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '24px',
                      border: '1px solid #e4e4e7',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f4f4f5', color: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#18181b', margin: 0 }}>Base Plan</h3>
                          <span style={{ fontSize: '0.78rem', color: '#71717a' }}>Starter tier for individual designers</span>
                        </div>
                      </div>
                      <span style={{ background: '#f4f4f5', color: '#52525b', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>BASE TIER</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                      <div style={{ background: '#fafafa', padding: '14px 16px', borderRadius: '14px', border: '1px solid #f4f4f5' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#27272a', display: 'block', marginBottom: '6px' }}>
                          Monthly Rate (₹ / month)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1.5px solid #e4e4e7', borderRadius: '10px', padding: '0 12px' }}>
                          <span style={{ fontWeight: 800, color: '#71717a', fontSize: '1rem' }}>₹</span>
                          <input
                            type="number"
                            value={basePriceMonthly}
                            onChange={(e) => setBasePriceMonthly(Number(e.target.value))}
                            style={{ border: 'none', width: '100%', padding: '10px 8px', fontSize: '1rem', fontWeight: 800, outline: 'none', color: '#18181b' }}
                          />
                        </div>
                      </div>

                      <div style={{ background: '#fafafa', padding: '14px 16px', borderRadius: '14px', border: '1px solid #f4f4f5' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#27272a', display: 'block', marginBottom: '6px' }}>
                          Yearly Effective Rate (₹ / month when billed annually)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1.5px solid #e4e4e7', borderRadius: '10px', padding: '0 12px' }}>
                          <span style={{ fontWeight: 800, color: '#71717a', fontSize: '1rem' }}>₹</span>
                          <input
                            type="number"
                            value={basePriceYearly}
                            onChange={(e) => setBasePriceYearly(Number(e.target.value))}
                            style={{ border: 'none', width: '100%', padding: '10px 8px', fontSize: '1rem', fontWeight: 800, outline: 'none', color: '#18181b' }}
                          />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Yearly bill: ₹{(basePriceYearly * 12).toLocaleString('en-IN')} / year (Saves ₹{((basePriceMonthly - basePriceYearly) * 12).toLocaleString('en-IN')})
                        </div>
                      </div>

                      <div style={{ background: '#fafafa', padding: '14px 16px', borderRadius: '14px', border: '1px solid #f4f4f5' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#27272a', display: 'block', marginBottom: '6px' }}>
                          Monthly AI Credits Limit
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1.5px solid #e4e4e7', borderRadius: '10px', padding: '0 12px' }}>
                          <Sparkles className="w-4 h-4 text-amber-500 mr-1" />
                          <input
                            type="number"
                            value={baseAiCredits}
                            onChange={(e) => setBaseAiCredits(Number(e.target.value))}
                            style={{ border: 'none', width: '100%', padding: '10px 8px', fontSize: '1rem', fontWeight: 800, outline: 'none', color: '#18181b' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PRO PLAN CARD */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '24px',
                      border: '2px solid #6366f1',
                      boxShadow: '0 10px 30px rgba(99,102,241,0.12)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#18181b', margin: 0 }}>Pro Plan</h3>
                          <span style={{ fontSize: '0.78rem', color: '#71717a' }}>Commercial tier for packaging studios</span>
                        </div>
                      </div>
                      <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>COMMERCIAL PRO</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                      <div style={{ background: '#fafafa', padding: '14px 16px', borderRadius: '14px', border: '1px solid #f4f4f5' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#27272a', display: 'block', marginBottom: '6px' }}>
                          Monthly Rate (₹ / month)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1.5px solid #e4e4e7', borderRadius: '10px', padding: '0 12px' }}>
                          <span style={{ fontWeight: 800, color: '#71717a', fontSize: '1rem' }}>₹</span>
                          <input
                            type="number"
                            value={proPriceMonthly}
                            onChange={(e) => setProPriceMonthly(Number(e.target.value))}
                            style={{ border: 'none', width: '100%', padding: '10px 8px', fontSize: '1rem', fontWeight: 800, outline: 'none', color: '#18181b' }}
                          />
                        </div>
                      </div>

                      <div style={{ background: '#fafafa', padding: '14px 16px', borderRadius: '14px', border: '1px solid #f4f4f5' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#27272a', display: 'block', marginBottom: '6px' }}>
                          Yearly Effective Rate (₹ / month when billed annually)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1.5px solid #e4e4e7', borderRadius: '10px', padding: '0 12px' }}>
                          <span style={{ fontWeight: 800, color: '#71717a', fontSize: '1rem' }}>₹</span>
                          <input
                            type="number"
                            value={proPriceYearly}
                            onChange={(e) => setProPriceYearly(Number(e.target.value))}
                            style={{ border: 'none', width: '100%', padding: '10px 8px', fontSize: '1rem', fontWeight: 800, outline: 'none', color: '#18181b' }}
                          />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Yearly bill: ₹{(proPriceYearly * 12).toLocaleString('en-IN')} / year (Saves ₹{((proPriceMonthly - proPriceYearly) * 12).toLocaleString('en-IN')})
                        </div>
                      </div>

                      <div style={{ background: '#fafafa', padding: '14px 16px', borderRadius: '14px', border: '1px solid #f4f4f5' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#27272a', display: 'block', marginBottom: '6px' }}>
                          Monthly AI Credits Limit
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1.5px solid #e4e4e7', borderRadius: '10px', padding: '0 12px' }}>
                          <Sparkles className="w-4 h-4 text-indigo-600 mr-1" />
                          <input
                            type="number"
                            value={proAiCredits}
                            onChange={(e) => setProAiCredits(Number(e.target.value))}
                            style={{ border: 'none', width: '100%', padding: '10px 8px', fontSize: '1rem', fontWeight: 800, outline: 'none', color: '#18181b' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: AUTO-EXPIRING SALE CAMPAIGN */}
              {membershipSubTab === 'campaign' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                  {/* CAMPAIGN CONFIG FORM */}
                  <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e4e4e7', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#18181b', margin: 0 }}>Sale Campaign Setup</h3>
                          <span style={{ fontSize: '0.78rem', color: '#71717a' }}>Auto-expiring promo banner engine</span>
                        </div>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: promoActive ? '#dcfce7' : '#f4f4f5', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <input
                          type="checkbox"
                          checked={promoActive}
                          onChange={(e) => setPromoActive(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: promoActive ? '#15803d' : '#71717a' }}>
                          {promoActive ? 'LIVE ACTIVE' : 'DISABLED'}
                        </span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3f3f46', display: 'block', marginBottom: '6px' }}>Campaign Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Festival Sale"
                          value={promoTitle}
                          onChange={(e) => setPromoTitle(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e4e4e7', fontSize: '0.9rem', fontWeight: 700 }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3f3f46', display: 'block', marginBottom: '6px' }}>Discount Badge %</label>
                          <input
                            type="number"
                            placeholder="40"
                            value={promoDiscountPercent}
                            onChange={(e) => setPromoDiscountPercent(Number(e.target.value))}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e4e4e7', fontSize: '0.9rem', fontWeight: 700 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3f3f46', display: 'block', marginBottom: '6px' }}>Start Date</label>
                          <input
                            type="date"
                            value={promoStartsAt}
                            onChange={(e) => setPromoStartsAt(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e4e4e7', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3f3f46', display: 'block', marginBottom: '6px' }}>
                          Campaign Expiry Date (Auto-Expires After Date)
                        </label>
                        <input
                          type="date"
                          value={promoEndsAt}
                          onChange={(e) => setPromoEndsAt(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e4e4e7', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3f3f46', display: 'block', marginBottom: '6px' }}>Campaign Description Subtitle</label>
                        <input
                          type="text"
                          placeholder="e.g. Save 40% on all plans for a limited time!"
                          value={promoDescription}
                          onChange={(e) => setPromoDescription(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e4e4e7', fontSize: '0.88rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* LIVE WEBSITE BANNER PREVIEW */}
                  <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e4e4e7', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#18181b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles className="w-4 h-4 text-amber-500" /> Live Website Infinite Marquee Preview
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '20px' }}>
                      Exact right-to-left infinite scrolling ticker preview as seen by customers on live site:
                    </div>

                    <div
                      style={{
                        background: promoActive ? '#fef3c7' : '#f4f4f5',
                        color: promoActive ? '#78350f' : '#71717a',
                        borderRadius: '14px',
                        padding: '12px 10px',
                        boxShadow: promoActive ? '0 4px 14px rgba(245,158,11,0.15)' : 'none',
                        border: promoActive ? '1px solid #fde68a' : '1px solid #e4e4e7',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <style>{`
                        @keyframes adminPreviewTicker {
                          0% { transform: translateX(0%); }
                          100% { transform: translateX(-50%); }
                        }
                        .admin-preview-track {
                          display: flex;
                          width: max-content;
                          animation: adminPreviewTicker 18s linear infinite;
                        }
                      `}</style>

                      <div className="admin-preview-track" style={{ display: 'flex', alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map((idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#78350f', fontWeight: 900 }}>
                              <Gift className="w-4 h-4 text-amber-700 shrink-0" /> {promoTitle || 'Sale Title'}
                            </span>
                            <span style={{ background: '#f59e0b', color: '#ffffff', padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>
                              -{promoDiscountPercent || 0}% OFF
                            </span>
                            <span style={{ color: '#27272a', fontWeight: 600 }}>{promoDescription || 'Campaign description'}</span>
                            {promoEndsAt && (
                              <span style={{ color: '#78350f', fontFamily: 'monospace', fontSize: '0.72rem', background: 'rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock className="w-3 h-3 text-amber-800 shrink-0" /> Expires: {new Date(promoEndsAt).toLocaleDateString()}
                              </span>
                            )}
                            <span style={{ color: '#f59e0b', fontWeight: 800 }}>•</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {!promoActive && (
                      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem', color: '#ef4444', fontWeight: 700 }}>
                        ⚠️ Banner is currently DISABLED. Check "Enable Live Promotion Banner" above to publish.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: COUPON CODES & VOUCHERS */}
              {membershipSubTab === 'coupons' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* CREATE COUPON FORM CARD */}
                  <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e4e4e7', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#18181b', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Plus className="w-5 h-5 text-indigo-600" /> Create New Discount Coupon Code
                    </h3>

                    <form onSubmit={handleCreateCoupon} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#3f3f46', display: 'block', marginBottom: '6px' }}>COUPON CODE (UPPERCASE)</label>
                        <input
                          type="text"
                          placeholder="e.g. DIWALI50"
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e4e4e7', fontFamily: 'monospace', fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#3f3f46', display: 'block', marginBottom: '6px' }}>DISCOUNT PERCENTAGE (%)</label>
                        <input
                          type="number"
                          placeholder="20"
                          value={newCouponDiscountPercent}
                          onChange={(e) => setNewCouponDiscountPercent(Number(e.target.value))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e4e4e7', fontSize: '0.9rem', fontWeight: 700 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#3f3f46', display: 'block', marginBottom: '6px' }}>MAX USAGE LIMIT</label>
                        <input
                          type="number"
                          placeholder="1000"
                          value={newCouponMaxUses}
                          onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e4e4e7', fontSize: '0.9rem', fontWeight: 700 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#3f3f46', display: 'block', marginBottom: '6px' }}>EXPIRATION DATE</label>
                        <input
                          type="date"
                          value={newCouponExpiresAt}
                          onChange={(e) => setNewCouponExpiresAt(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e4e4e7', fontSize: '0.85rem' }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isCreatingCoupon}
                        style={{
                          background: '#18181b',
                          color: '#ffffff',
                          border: 'none',
                          padding: '12px 20px',
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Plus className="w-4 h-4" /> {isCreatingCoupon ? 'Creating...' : 'Create Coupon'}
                      </button>
                    </form>
                  </div>

                  {/* DIRECTORY TABLE */}
                  <div className="admin-table-container" style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e4e4e7', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>COUPON CODE</th>
                          <th>DISCOUNT</th>
                          <th>USAGE LIMIT</th>
                          <th>EXPIRATION DATE</th>
                          <th>STATUS</th>
                          <th>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingCoupons ? (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>Loading coupons directory...</td></tr>
                        ) : couponsList.length === 0 ? (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#71717a' }}>No coupons created yet. Type a code above (e.g. DIWALI50) to create your first coupon!</td></tr>
                        ) : (
                          couponsList.map((c) => (
                            <tr key={c._id}>
                              <td>
                                <span style={{ background: '#18181b', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontFamily: 'monospace', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                                  {c.code}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}>
                                  {c.discountPercent ? `${c.discountPercent}% OFF` : `₹${c.flatDiscountINR} OFF`}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{c.usedCount} / {c.maxUses} used</div>
                                <div style={{ width: '100px', height: '4px', background: '#e4e4e7', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(100, (c.usedCount / c.maxUses) * 100)}%`, height: '100%', background: '#10b981' }}></div>
                                </div>
                              </td>
                              <td style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                                {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'No Expiry'}
                              </td>
                              <td>
                                <span style={{ background: c.active ? '#dcfce7' : '#fee2e2', color: c.active ? '#15803d' : '#b91c1c', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                                  {c.active ? 'ACTIVE' : 'DISABLED'}
                                </span>
                              </td>
                              <td style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => handleToggleCoupon(c._id, c.active)}
                                  style={{ padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #d4d4d8', background: c.active ? '#fee2e2' : '#dcfce7', color: c.active ? '#991b1b' : '#166534', cursor: 'pointer' }}
                                >
                                  {c.active ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                  onClick={() => handleDeleteCoupon(c._id)}
                                  className="delete-btn"
                                  style={{ padding: '5px 10px' }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PLATFORM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="admin-tab-content">
              <h2 className="admin-page-title">Platform & System Settings</h2>

              <div className="admin-panel-card">
                <h3 className="panel-title">Maintenance & System Mode</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>System Maintenance Mode</div>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>When enabled, non-admin users will see a maintenance notice screen.</div>
                  </div>
                  <button
                    className={maintenanceMode ? 'delete-btn' : 'open-studio-btn'}
                    onClick={handleToggleMaintenance}
                  >
                    {maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

class AdminErrorBoundary extends React.Component<{ onBack: () => void; children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Admin Dashboard Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#18181b', margin: '0 0 8px 0' }}>Admin Dashboard Loaded with Fallback</h2>
          <p style={{ color: '#71717a', fontSize: '0.9rem', maxWidth: '500px', margin: '0 0 24px 0' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred while rendering the dashboard.'}
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              style={{ padding: '10px 18px', background: '#18181b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              <RefreshCw className="w-4 h-4 inline mr-1" /> Reload Page
            </button>
            <button
              onClick={this.props.onBack}
              style={{ padding: '10px 18px', background: '#e4e4e7', color: '#18181b', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Back to Studio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminDashboardPageWrapper(props: { onBack: () => void }) {
  return (
    <AdminErrorBoundary onBack={props.onBack}>
      <AdminDashboardPage {...props} />
    </AdminErrorBoundary>
  );
}
