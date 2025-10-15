const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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
      // If response is not JSON, use status text
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
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  series_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Series {
  id: number;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  visibility: 'freemium' | 'basic' | 'premium';
  status: 'draft' | 'published' | 'archived';
  category_id: number;
  instructor_id: number;
  thumbnail: string | null;
  cover_image: string | null;
  trailer_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  video_count: number;
  total_duration: number;
  total_views: number;
  rating: string;
  rating_count: number;
  price: string;
  is_free: boolean;
  published_at: string | null;
  featured_until: string | null;
  is_featured: boolean;
  sort_order: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  instructor?: any;
  published_videos_count?: number;
}

export interface Video {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  series_id: number;
  instructor_id: number | null;
  video_url: string | null;
  video_file_path: string | null;
  thumbnail: string | null;
  duration: number;
  file_size: number | null;
  video_format: string | null;
  video_quality: string | null;
  streaming_urls: any | null;
  hls_url: string | null;
  dash_url: string | null;
  visibility: 'freemium' | 'basic' | 'premium';
  status: 'draft' | 'published' | 'archived';
  is_free: boolean;
  price: string | null;
  episode_number: number | null;
  sort_order: number;
  tags: string[] | null;
  views: number;
  unique_views: number;
  rating: string;
  rating_count: number;
  completion_rate: number;
  published_at: string | null;
  scheduled_at: string | null;
  downloadable_resources: any | null;
  allow_download: boolean;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  series?: Series;
  instructor?: any;
}

// Category API
export const categoryApi = {
  async getAll(params?: { search?: string; with_counts?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.with_counts) queryParams.append('with_counts', 'true');
    
    const response = await fetch(`${API_BASE_URL}/admin/categories?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: { data: Category[] } }>(response);
  },

  async getPublic() {
    const response = await fetch(`${API_BASE_URL}/categories/public`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: Category[] }>(response);
  },

  async create(data: Partial<Category>) {
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; data: Category; message: string }>(response);
  },

  async update(id: number, data: Partial<Category>) {
    const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; data: Category; message: string }>(response);
  },

  async delete(id: number) {
    const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
};

// Series API
export const seriesApi = {
  async getAll(params?: { 
    search?: string; 
    category_id?: number; 
    status?: string;
    visibility?: string;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.visibility) queryParams.append('visibility', params.visibility);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const response = await fetch(`${API_BASE_URL}/admin/series?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: { data: Series[]; total: number } }>(response);
  },

  async getFeatured(limit?: number) {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/series/featured?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: Series[] }>(response);
  },

  async getPopular(limit?: number) {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/series/popular?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: Series[] }>(response);
  },

  async getNewReleases(limit?: number) {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/series/new-releases?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: Series[] }>(response);
  },

  async getById(id: number) {
    const response = await fetch(`${API_BASE_URL}/admin/series/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: { series: Series; user_progress?: any } }>(response);
  },

  async create(data: Partial<Series>) {
    const response = await fetch(`${API_BASE_URL}/admin/series`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; data: Series; message: string }>(response);
  },

  async update(id: number, data: Partial<Series>) {
    const response = await fetch(`${API_BASE_URL}/admin/series/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; data: Series; message: string }>(response);
  },

  async delete(id: number) {
    const response = await fetch(`${API_BASE_URL}/admin/series/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
};

// Video API
export const videoApi = {
  async getAll(params?: { 
    search?: string; 
    series_id?: number; 
    status?: string;
    visibility?: string;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.series_id) queryParams.append('series_id', params.series_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.visibility) queryParams.append('visibility', params.visibility);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const response = await fetch(`${API_BASE_URL}/admin/videos?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: { data: Video[]; total: number } }>(response);
  },

  async getById(id: number) {
    const response = await fetch(`${API_BASE_URL}/admin/videos/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: { video: Video; user_progress?: any; next_video?: Video; previous_video?: Video } }>(response);
  },

  async create(data: Partial<Video>) {
    const response = await fetch(`${API_BASE_URL}/admin/videos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; data: Video; message: string }>(response);
  },

  async update(id: number, data: Partial<Video>) {
    const response = await fetch(`${API_BASE_URL}/admin/videos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; data: Video; message: string }>(response);
  },

  async delete(id: number) {
    const response = await fetch(`${API_BASE_URL}/admin/videos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  async getSeriesVideos(seriesId: number) {
    const response = await fetch(`${API_BASE_URL}/series/${seriesId}/videos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: { videos: Video[]; user_progress?: any; series: Series } }>(response);
  },
};

export default {
  category: categoryApi,
  series: seriesApi,
  video: videoApi,
};

