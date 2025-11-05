import axios from 'axios';

export interface HeroBackground {
  id: number;
  name: string;
  description?: string;
  image_path: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface HeroBackgroundResponse {
  success: boolean;
  data: HeroBackground[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const heroBackgroundApi = {
  /**
   * Get active hero backgrounds for public display
   */
  getPublic: async (): Promise<HeroBackgroundResponse> => {
    const response = await axios.get(`${API_BASE_URL}/hero-backgrounds/public`);
    return response.data;
  },

  /**
   * Get all hero backgrounds (admin only)
   */
  getAll: async (): Promise<HeroBackgroundResponse> => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}/admin/hero-backgrounds`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    return response.data;
  },

  /**
   * Create a new hero background (admin only)
   */
  create: async (formData: FormData): Promise<HeroBackgroundResponse> => {
    const token = localStorage.getItem('auth_token');
    try {
      // Let the browser/axios set proper multipart boundaries automatically
      const response = await axios.post(`${API_BASE_URL}/admin/hero-backgrounds`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (err: any) {
      const server = err?.response?.data;
      // Normalize error to surface validation messages clearly
      const msg = server?.message 
        || (server?.errors && Object.values(server.errors)[0]?.[0])
        || 'Upload failed';
      throw new Error(msg);
    }
  },

  /**
   * Update a hero background (admin only)
   */
  update: async (id: number, formData: FormData): Promise<HeroBackgroundResponse> => {
    const token = localStorage.getItem('auth_token');
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/hero-backgrounds/${id}?_method=PUT`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (err: any) {
      const server = err?.response?.data;
      const msg = server?.message 
        || (server?.errors && Object.values(server.errors)[0]?.[0])
        || 'Update failed';
      throw new Error(msg);
    }
  },

  /**
   * Delete a hero background (admin only)
   */
  delete: async (id: number): Promise<HeroBackgroundResponse> => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.delete(`${API_BASE_URL}/admin/hero-backgrounds/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    return response.data;
  },

  /**
   * Toggle hero background status (admin only)
   */
  toggleStatus: async (id: number): Promise<HeroBackgroundResponse> => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.post(`${API_BASE_URL}/admin/hero-backgrounds/${id}/toggle-status`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    return response.data;
  },
};

