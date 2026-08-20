import { API_BASE_URL } from '../config/api';

const safeJson = async (res: Response) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    if (!res.ok) throw new Error(`Server returned ${res.status}: ${res.statusText}. The backend might be offline.`);
    return {};
  }
};

export interface SaveDesignPayload {
  name: string;
  type: string;
  category: string;
  variantId: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  customColors?: any;
  tabCategory: string;
  isFavorite?: boolean;
  isDraft?: boolean;
  tags?: string[];
}

export const mockupService = {
  // Save a new design
  saveDesign: async (payload: SaveDesignPayload) => {
    const res = await fetch(`${API_BASE_URL}/mockups/saved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to save design');
    return data;
  },

  // Get all saved designs
  getSavedDesigns: async () => {
    const res = await fetch(`${API_BASE_URL}/mockups/saved`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to fetch saved designs');
    return data;
  },
};
