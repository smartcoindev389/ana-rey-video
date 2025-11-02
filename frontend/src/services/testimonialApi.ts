const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Helper function to get locale from localStorage or default to 'en'
const getLocale = (): string => {
  return localStorage.getItem('i18nextLng') || 'en';
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  const locale = getLocale();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': locale,
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Handle API response
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return {} as T;
}

// Types
export interface Testimonial {
  id: number;
  user_id: number | null;
  video_id: number | null;
  name: string;
  role: string | null;
  company: string | null;
  avatar: string | null;
  content: string;
  rating: number;
  is_approved: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  user?: any;
  video?: any;
}

export interface TestimonialCreateRequest {
  name: string;
  role?: string;
  company?: string;
  avatar?: string;
  content: string;
  rating: number;
  user_id?: number | null;
  video_id?: number | null;
  is_approved?: boolean;
  is_featured?: boolean;
  sort_order?: number;
}

export interface TestimonialUpdateRequest {
  name?: string;
  role?: string;
  company?: string;
  avatar?: string;
  content?: string;
  rating?: number;
  user_id?: number | null;
  video_id?: number | null;
  is_approved?: boolean;
  is_featured?: boolean;
  sort_order?: number;
}

export const testimonialApi = {
  // Get public testimonials (approved only)
  getPublic: async (params?: { featured?: boolean; limit?: number }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.featured) queryParams.append('featured', 'true');
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `${API_BASE_URL}/testimonials/public${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse<any>(response);
  },

  // Get all testimonials (admin)
  getAll: async (params?: { search?: string; approved?: boolean; featured?: boolean; sort_by?: string; sort_order?: string; per_page?: number }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.approved !== undefined) queryParams.append('approved', params.approved.toString());
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const url = `${API_BASE_URL}/admin/testimonials${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get single testimonial
  get: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/testimonials/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Create testimonial
  create: async (data: TestimonialCreateRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/testimonials`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Update testimonial
  update: async (id: number, data: TestimonialUpdateRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/testimonials/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Delete testimonial
  delete: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/testimonials/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Toggle approval
  toggleApproval: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/testimonials/${id}/toggle-approval`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Toggle featured
  toggleFeatured: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/testimonials/${id}/toggle-featured`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },
};

export default testimonialApi;
