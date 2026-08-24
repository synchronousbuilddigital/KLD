import { API_BASE_URL } from '../config/api';

export interface ExportItem {
  _id: string;
  user?: string;
  design?: {
    _id: string;
    name: string;
    category?: string;
    type?: string;
  };
  format: 'SVG' | 'PDF' | 'DXF' | 'PNG' | 'MP4';
  resolution?: string;
  fileUrl?: string;
  fileName?: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  errorMsg?: string;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = 'kld_export_history';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const exportService = {
  /**
   * Log an export event (MongoDB + localStorage fallback)
   */
  logExport: async (payload: {
    format: 'SVG' | 'PDF' | 'DXF' | 'PNG' | 'MP4';
    resolution?: string;
    designId?: string;
    fileUrl?: string;
    fileName?: string;
  }) => {
    const timestamp = new Date().toISOString();
    const localItem: ExportItem = {
      _id: 'local_exp_' + Date.now(),
      format: payload.format,
      resolution: payload.resolution || 'Vector',
      fileName: payload.fileName || `KLD_${payload.format}_${Date.now()}`,
      fileUrl: payload.fileUrl || undefined,
      status: 'DONE',
      createdAt: timestamp,
    };

    // 1. Save to localStorage immediately
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      let items: ExportItem[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(items)) items = [];
      items.unshift(localItem);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('LocalStorage export write error:', e);
    }

    // 2. Save to backend API if token exists
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`${API_BASE_URL}/exports`, {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.data?._id) {
          return data;
        }
      }
    } catch (err) {
      console.error('Backend export API error:', err);
    }

    return { success: true, data: localItem };
  },

  /**
   * Get past export history (Combines MongoDB + localStorage)
   */
  getExportHistory: async () => {
    let mongoExports: ExportItem[] = [];
    
    // Fetch from MongoDB if logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/exports/history`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.exports)) {
          mongoExports = data.data.exports;
        }
      } catch (e) {
        console.error('Error fetching MongoDB export history:', e);
      }
    }

    // Fetch local items from localStorage
    let localItems: ExportItem[] = [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) localItems = parsed;
      }
    } catch (e) {
      console.error('Error parsing local export history:', e);
    }

    // Combine MongoDB + Local without duplicates
    const mongoIds = new Set(mongoExports.map(e => e._id));
    const combined = [
      ...mongoExports,
      ...localItems.filter(item => !mongoIds.has(item._id))
    ];

    return { success: true, data: { exports: combined } };
  },

  /**
   * Check export processing status
   */
  getExportStatus: async (id: string) => {
    const token = localStorage.getItem('token');
    if (token && id && id.length === 24) {
      try {
        const res = await fetch(`${API_BASE_URL}/exports/${id}/status`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        return res.json();
      } catch (e) {}
    }
    return { success: true, data: { status: 'DONE' } };
  },

  /**
   * Delete an export record from history
   */
  deleteExportRecord: async (id: string) => {
    // Delete from localStorage
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: ExportItem[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const remaining = parsed.filter(item => item._id !== id);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remaining));
        }
      }
    } catch (e) {
      console.error('LocalStorage export delete error:', e);
    }

    // Delete from MongoDB if authenticated
    const token = localStorage.getItem('token');
    if (token && id && id.length === 24) {
      try {
        const res = await fetch(`${API_BASE_URL}/exports/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        return res.json();
      } catch (err) {
        console.error('Backend export delete error:', err);
      }
    }

    return { success: true };
  },
};
