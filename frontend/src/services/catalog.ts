import { API_BASE_URL } from '../config/api';

export interface MockupVariant {
  _id?: string;
  id: number;
  name: string;
  animation?: string;
  imageUrl?: string;
  description?: string;
  dimensions?: string;
  material?: string;
  finishing?: string;
  printing?: string;
  moq?: string;
  isFeatured?: boolean;
  gridSize?: 'large' | 'medium' | 'small';
}

export interface CatalogItemData {
  _id?: string;
  itemId: string;
  title: string;
  subtitle: string;
  img: string;
  group: 'boxes' | 'bottles' | 'pouches' | 'containers';
  badge?: string;
  tag?: string;
  isFeatured?: boolean;
  showInMarquee?: boolean;
  active?: boolean;
  order?: number;
  boxModelKey?: string;
  variants?: MockupVariant[];
  createdAt?: string;
  updatedAt?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const catalogService = {
  /**
   * Fetch active catalog items for public display
   */
  async getPublicCatalog(): Promise<CatalogItemData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/catalog/public`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.warn('Failed to fetch catalog from backend API, using local fallback:', error);
      return [];
    }
  },

  /**
   * Fetch all catalog items for Admin management
   */
  async getAdminCatalog(): Promise<CatalogItemData[]> {
    try {
      let response = await fetch(`${API_BASE_URL}/catalog/admin/list`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.status === 401) {
        await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
        response = await fetch(`${API_BASE_URL}/catalog/admin/list`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching admin catalog:', error);
      throw error;
    }
  },

  /**
   * Admin: Create a new 3D model product
   */
  async createCatalogItem(itemData: Partial<CatalogItemData>): Promise<CatalogItemData> {
    const response = await fetch(`${API_BASE_URL}/catalog/admin/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(itemData),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to create catalog product.');
    }
    return data.data;
  },

  /**
   * Admin: Update an existing 3D model product
   */
  async updateCatalogItem(id: string, itemData: Partial<CatalogItemData>): Promise<CatalogItemData> {
    const response = await fetch(`${API_BASE_URL}/catalog/admin/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(itemData),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update catalog product.');
    }
    return data.data;
  },

  /**
   * Admin: Delete a catalog product
   */
  async deleteCatalogItem(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/catalog/admin/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete catalog product.');
    }
    return true;
  },

  /**
   * Admin: Add a sub-variant to a category
   */
  async addVariant(categoryId: string, variantData: Partial<MockupVariant>): Promise<CatalogItemData> {
    const response = await fetch(`${API_BASE_URL}/catalog/admin/${categoryId}/variants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(variantData),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to add sub-model variant.');
    }
    return data.data;
  },

  /**
   * Admin: Update a sub-variant in a category
   */
  async updateVariant(categoryId: string, variantId: string | number, variantData: Partial<MockupVariant>): Promise<CatalogItemData> {
    const response = await fetch(`${API_BASE_URL}/catalog/admin/${categoryId}/variants/${variantId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(variantData),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update sub-model variant.');
    }
    return data.data;
  },

  /**
   * Admin: Delete a sub-variant from a category
   */
  async deleteVariant(categoryId: string, variantId: string | number): Promise<CatalogItemData> {
    const response = await fetch(`${API_BASE_URL}/catalog/admin/${categoryId}/variants/${variantId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete sub-model variant.');
    }
    return data.data;
  },
};
