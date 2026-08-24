import { API_BASE_URL } from '../config/api';

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    publicId?: string;
    width?: number;
    height?: number;
    user?: any;
  };
}

export const uploadService = {
  // Upload Brand Logo / Decal Image to Cloudinary
  uploadLogo: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('logo', file);

    const res = await fetch(`${API_BASE_URL}/uploads/logo`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to upload logo image to cloud.');
    }
    return data;
  },

  // Upload User Profile Avatar to Cloudinary & update User model
  uploadAvatar: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/uploads/avatar`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to upload avatar image.');
    }

    // Update stored local user object
    if (data.data?.user) {
      localStorage.setItem('user', JSON.stringify(data.data.user));
      window.dispatchEvent(new Event('auth-change'));
    }

    return data;
  },

  // Upload Dieline Asset File (DXF, PDF, SVG, JSON)
  uploadDieline: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('dieline', file);

    const res = await fetch(`${API_BASE_URL}/uploads/dieline`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to upload dieline asset.');
    }
    return data;
  },

  // Delete Cloudinary asset
  deleteAsset: async (publicId: string): Promise<boolean> => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/uploads/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    const data = await res.json();
    return res.ok && data.success;
  },
};
