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

export interface SubscriptionPlan {
  id: number;
  name: string;
  display_name: string;
  description: string;
  price: number;
  duration_days: number;
  features?: string[];
  max_devices: number;
  video_quality: string;
  downloadable_content: boolean;
  certificates: boolean;
  priority_support: boolean;
  ad_free: boolean;
  is_active: boolean;
  sort_order: number;
  stripe_price_id?: string | null;
  billing_cycle?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionPlanCreateRequest {
  name: string;
  display_name: string;
  description: string;
  price: number;
  duration_days: number;
  features?: string[];
  max_devices?: number;
  video_quality?: string;
  downloadable_content?: boolean;
  certificates?: boolean;
  priority_support?: boolean;
  ad_free?: boolean;
  is_active?: boolean;
  sort_order?: number;
  stripe_price_id?: string | null;
}

export interface SubscriptionPlanUpdateRequest extends Partial<SubscriptionPlanCreateRequest> {}

export const subscriptionPlanApi = {
  // Get all subscription plans
  async getAll(params?: {
    search?: string;
    status?: boolean;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
  }): Promise<{ success: boolean; data: any }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status !== undefined) queryParams.append('status', params.status.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/subscription-plans?${queryParams.toString()}`, {
      headers: {
        ...getAuthHeaders(),
        'Accept-Language': locale,
      },
    });
    return handleResponse<{ success: boolean; data: any }>(response);
  },

  // Get subscription plan by ID
  async getById(id: number): Promise<{ success: boolean; data: SubscriptionPlan }> {
    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/subscription-plans/${id}`, {
      headers: {
        ...getAuthHeaders(),
        'Accept-Language': locale,
      },
    });
    return handleResponse<{ success: boolean; data: SubscriptionPlan }>(response);
  },

  // Create subscription plan
  async create(plan: SubscriptionPlanCreateRequest): Promise<{ success: boolean; data: SubscriptionPlan; message: string }> {
    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/subscription-plans`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'Accept-Language': locale,
      },
      body: JSON.stringify(plan),
    });
    return handleResponse<{ success: boolean; data: SubscriptionPlan; message: string }>(response);
  },

  // Update subscription plan
  async update(id: number, plan: SubscriptionPlanUpdateRequest): Promise<{ success: boolean; data: SubscriptionPlan; message: string }> {
    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/subscription-plans/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'Accept-Language': locale,
      },
      body: JSON.stringify(plan),
    });
    return handleResponse<{ success: boolean; data: SubscriptionPlan; message: string }>(response);
  },

  // Delete subscription plan
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/subscription-plans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // Toggle plan status
  async toggleStatus(id: number): Promise<{ success: boolean; data: SubscriptionPlan; message: string }> {
    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/subscription-plans/${id}/toggle-status`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Accept-Language': locale,
      },
    });
    return handleResponse<{ success: boolean; data: SubscriptionPlan; message: string }>(response);
  },

  // Get plan statistics
  async getStatistics(id: number): Promise<{ success: boolean; data: any }> {
    const response = await fetch(`${API_BASE_URL}/admin/subscription-plans/${id}/statistics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: any }>(response);
  },

  // Get public plans (for subscription page)
  async getPublic(): Promise<{ success: boolean; data: SubscriptionPlan[] }> {
    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/subscription-plans/public`, {
      headers: {
        'Accept-Language': locale,
      },
    });
    return handleResponse<{ success: boolean; data: SubscriptionPlan[] }>(response);
  },
};

export default subscriptionPlanApi;

