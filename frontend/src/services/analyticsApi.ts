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

export const analyticsApi = {
  // Get overview analytics
  getOverview: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/analytics/overview`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get user growth analytics
  getUserGrowth: async (params?: { period?: string }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    
    const url = `${API_BASE_URL}/analytics/user-growth${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get revenue analytics
  getRevenue: async (params?: { period?: string }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    
    const url = `${API_BASE_URL}/analytics/revenue${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get top videos
  getTopVideos: async (params?: { limit?: number }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `${API_BASE_URL}/analytics/top-videos${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get subscription stats
  getSubscriptionStats: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/analytics/subscription-stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get content analytics
  getContentAnalytics: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/analytics/content-analytics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get engagement analytics
  getEngagementAnalytics: async (params?: { period?: string }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    
    const url = `${API_BASE_URL}/analytics/engagement-analytics${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },
};

export default analyticsApi;

