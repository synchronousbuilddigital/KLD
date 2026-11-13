import { API_BASE_URL } from '../config/api';

export interface MockupVariant {
  _id?: string;
  id: number;
  name: string;
  animation?: string;
  imageUrl?: string;
  whiteImageUrl?: string;
  kraftImageUrl?: string;
  boxModelKey?: string;
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
  dieline2DImg?: string;
  box3DImg?: string;
  group: 'boxes' | 'bottles' | 'pouches' | 'containers' | 'dielines';
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

const CATALOG_STORAGE_KEY = 'kld_cached_public_catalog';

export const DEFAULT_FALLBACK_CATALOG: CatalogItemData[] = [
  {
    itemId: 'box-mockups',
    title: 'Box Mockups',
    subtitle: '7 Models',
    img: '/images/catalog/box-mockups.png',
    group: 'boxes',
    badge: '🔥 MOST POPULAR',
    tag: '3D & DXF Ready',
    isFeatured: true,
    active: true,
    order: 1,
    boxModelKey: 'rte',
  },
  {
    itemId: 'pouch-bag-mockups',
    title: 'Pouch / Bag Mockups',
    subtitle: 'Stand-Up Foil Pouches & Kraft Bags',
    img: '/images/catalog/pouch-bag-mockups.png',
    group: 'pouches',
    badge: '⚡ HIGH REVENUE',
    tag: '3D Visualizer',
    isFeatured: true,
    active: true,
    order: 2,
    boxModelKey: 'rte',
  },
  {
    itemId: 'bottle-mockups',
    title: 'Bottle Mockups',
    subtitle: '2 Models',
    img: '/images/catalog/bottle-mockups.png',
    group: 'bottles',
    badge: '✦ PREMIUM GLASS',
    tag: 'Pro CAD Dieline',
    isFeatured: true,
    active: true,
    order: 3,
    boxModelKey: 'bottle',
  },
  {
    itemId: 'can-mockups',
    title: 'Can Mockups',
    subtitle: '2 Models',
    img: '/images/catalog/can-mockups.png',
    group: 'bottles',
    tag: '3D Studio',
    isFeatured: true,
    active: true,
    order: 4,
    boxModelKey: 'rte',
  },
  {
    itemId: 'tube-mockups',
    title: 'Tube Mockups',
    subtitle: '1 Models',
    img: '/images/catalog/tube-mockups.png',
    group: 'containers',
    tag: '3D Studio',
    active: true,
    order: 5,
    boxModelKey: 'cosmetic',
  },
  {
    itemId: 'cup-container-mockups',
    title: 'Cup / Container Mockups',
    subtitle: 'Eco Paper Coffee Cups & Tubs',
    img: '/images/catalog/cup-container-mockups.png',
    group: 'containers',
    tag: 'Vector Dieline',
    active: true,
    order: 6,
    boxModelKey: 'rte',
  },
  {
    itemId: 'food-packaging-mockups',
    title: 'Food Packaging Mockups',
    subtitle: 'Takeout, Noodle & Fast Food Boxes',
    img: '/images/catalog/food-packaging-mockups.png',
    group: 'boxes',
    tag: 'Auto-Lock Dieline',
    active: true,
    order: 7,
    boxModelKey: 'auto_lock',
  },
  {
    itemId: 'water-bottle-mockups',
    title: 'Water Bottle Mockups',
    subtitle: 'Sport PET & Mineral Water Bottles',
    img: '/images/catalog/water-bottle-mockups.png',
    group: 'bottles',
    tag: '3D Visualizer',
    active: true,
    order: 8,
    boxModelKey: 'rte',
  },
  {
    itemId: 'gift-box-mockups',
    title: 'Gift Box Mockups',
    subtitle: 'Rigid Luxury & Magnetic Lid Boxes',
    img: '/images/catalog/gift-box-mockups.png',
    group: 'boxes',
    tag: '3D Studio',
    active: true,
    order: 9,
    boxModelKey: 'te',
  },
  {
    itemId: 'paper-bag-mockups',
    title: 'Paper Bag Mockups',
    subtitle: 'Retail Shopping Bags with Handles',
    img: '/images/catalog/paper-bag-mockups.png',
    group: 'pouches',
    tag: 'Vector Blueprint',
    active: true,
    order: 10,
    boxModelKey: 'rte',
  },
  {
    itemId: 'pizza-packaging-mockups',
    title: 'Pizza Box Mockups',
    subtitle: '1 Model',
    img: '/images/catalog/pizza-packaging-mockups.png',
    group: 'boxes',
    badge: '🔥 HOT',
    tag: '3D Studio',
    active: true,
    order: 11,
    boxModelKey: 'pizza_box',
  },
  {
    itemId: 'supplement-bottle-mockups',
    title: 'Supplement Box Mockups',
    subtitle: '20 Models',
    img: '/images/catalog/supplement-bottle-mockups.png',
    group: 'containers',
    badge: '💊 POPULAR',
    tag: '3D Studio',
    active: true,
    order: 12,
    boxModelKey: 'cosmetic',
  },
];

export const catalogService = {
  /**
   * Synchronously get cached catalog from localStorage for instant 0ms rendering
   */
  getCachedCatalog(): CatalogItemData[] {
    try {
      const cached = localStorage.getItem(CATALOG_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_FALLBACK_CATALOG;
  },

  /**
   * Clear cached catalog in localStorage
   */
  clearCache(): void {
    try {
      localStorage.removeItem(CATALOG_STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('catalog-updated'));
      }
    } catch {}
  },

  /**
   * Fetch active catalog items for public display with local cache fallback
   */
  async getPublicCatalog(): Promise<CatalogItemData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/catalog/public`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          try {
            localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(data.data));
          } catch {}
          return data.data;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch catalog from backend API, using fallback data:', error);
    }
    return this.getCachedCatalog();
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
    this.clearCache();
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
    this.clearCache();
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
    this.clearCache();
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
    this.clearCache();
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
    this.clearCache();
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
    this.clearCache();
    return data.data;
  },
};
