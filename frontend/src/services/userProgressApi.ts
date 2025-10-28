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
export interface UserProgress {
  id: number;
  user_id: number;
  video_id: number;
  category_id: number | null;
  time_watched: number;
  progress_percentage: number;
  is_completed: boolean;
  is_favorite: boolean;
  rating: number | null;
  review: string | null;
  first_watched_at: string;
  last_watched_at: string;
  completed_at: string | null;
  favorited_at: string | null;
  created_at: string;
  updated_at: string;
  video?: any;
  category?: any;
}

export interface UserStats {
  total_videos_watched: number;
  total_watch_time: number;
  total_completed: number;
  total_in_progress: number;
  total_categories_started: number;
  total_categories_completed: number;
  average_completion_rate: number;
  favorite_count?: number;
  recently_watched?: UserProgress[];
}

export interface UpdateProgressRequest {
  time_watched: number;
  video_duration: number;
  progress_percentage?: number;
  is_completed?: boolean;
}

export interface RateVideoRequest {
  rating: number;
  review?: string;
}

export const userProgressApi = {
  // Get all user progress
  getAll: async (params?: { type?: string; category_id?: number; sort_by?: string; sort_order?: string; per_page?: number }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const url = `${API_BASE_URL}/progress${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get user stats
  getStats: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/progress/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get continue watching
  continueWatching: async (limit?: number): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    
    const url = `${API_BASE_URL}/progress/continue-watching${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get favorites
  getFavorites: async (perPage?: number): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (perPage) queryParams.append('per_page', perPage.toString());
    
    const url = `${API_BASE_URL}/progress/favorites${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get completed
  getCompleted: async (perPage?: number): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (perPage) queryParams.append('per_page', perPage.toString());
    
    const url = `${API_BASE_URL}/progress/completed${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get video progress
  getVideoProgress: async (videoId: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/progress/video/${videoId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Update video progress
  updateVideoProgress: async (videoId: number, data: UpdateProgressRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/progress/video/${videoId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Toggle favorite
  toggleFavorite: async (videoId: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/progress/video/${videoId}/favorite`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Rate video
  rateVideo: async (videoId: number, data: RateVideoRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/progress/video/${videoId}/rate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },
};

export default userProgressApi;

