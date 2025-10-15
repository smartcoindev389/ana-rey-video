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

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  subscription_type: 'freemium' | 'basic' | 'premium' | 'admin';
  role: 'user' | 'admin';
  bio?: string;
  avatar?: string;
  website?: string;
  social_links?: Record<string, string>;
  subscription_started_at?: string;
  subscription_expires_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_spent: number;
  active_subscription: boolean;
  subscription_active: boolean;
  days_remaining: number | null;
  progress_count: number;
  completed_videos: number;
}

export interface UserStatistics {
  total_users: number;
  active_users: number;
  premium_users: number;
  basic_users: number;
  freemium_users: number;
  suspended_users: number;
  total_revenue: number;
}

// User API
export const userApi = {
  async getAll(params?: { 
    search?: string; 
    subscription_type?: string;
    role?: string;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
    with_stats?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.subscription_type) queryParams.append('subscription_type', params.subscription_type);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.with_stats) queryParams.append('with_stats', 'true');
    
    const response = await fetch(`${API_BASE_URL}/users?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: { data: User[]; total: number } }>(response);
  },

  async getById(id: number) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: { user: User; stats: UserStats } }>(response);
  },

  async create(data: Partial<User> & { password: string }) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; data: User; message: string }>(response);
  },

  async update(id: number, data: Partial<User>) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; data: User; message: string }>(response);
  },

  async delete(id: number) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  async toggleStatus(id: number) {
    const response = await fetch(`${API_BASE_URL}/users/${id}/toggle-status`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: User; message: string }>(response);
  },

  async upgradeSubscription(id: number, data: { subscription_type: 'basic' | 'premium'; duration_days?: number }) {
    const response = await fetch(`${API_BASE_URL}/users/${id}/upgrade`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; data: User; message: string }>(response);
  },

  async getStatistics() {
    const response = await fetch(`${API_BASE_URL}/users-statistics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: UserStatistics }>(response);
  },
};

export default userApi;

