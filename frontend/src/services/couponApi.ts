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

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_trial';
  value: number;
  minimum_amount?: number;
  maximum_discount?: number;
  usage_limit?: number;
  usage_limit_per_user?: number;
  used_count: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  applicable_plans?: string[];
  first_time_only: boolean;
  created_at?: string;
  updated_at?: string;
  usages_count?: number;
}

export interface CouponCreateRequest {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_trial';
  value: number;
  minimum_amount?: number;
  maximum_discount?: number;
  usage_limit?: number;
  usage_limit_per_user?: number;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
  applicable_plans?: string[];
  first_time_only?: boolean;
}

export interface CouponUpdateRequest extends Partial<CouponCreateRequest> {}

export interface CouponValidateRequest {
  code: string;
  amount: number;
  plan?: string;
}

export const couponApi = {
  // Get all coupons
  async getAll(params?: {
    search?: string;
    status?: 'active' | 'expired' | 'valid' | 'inactive';
    type?: string;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
  }): Promise<{ success: boolean; data: any }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/coupons?${queryParams.toString()}`, {
      headers: {
        ...getAuthHeaders(),
        'Accept-Language': locale,
      },
    });
    return handleResponse<{ success: boolean; data: any }>(response);
  },

  // Get coupon by ID
  async getById(id: number): Promise<{ success: boolean; data: Coupon }> {
    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
      headers: {
        ...getAuthHeaders(),
        'Accept-Language': locale,
      },
    });
    return handleResponse<{ success: boolean; data: Coupon }>(response);
  },

  // Create coupon
  async create(coupon: CouponCreateRequest): Promise<{ success: boolean; data: Coupon; message: string }> {
    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/coupons`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'Accept-Language': locale,
      },
      body: JSON.stringify(coupon),
    });
    return handleResponse<{ success: boolean; data: Coupon; message: string }>(response);
  },

  // Update coupon
  async update(id: number, coupon: CouponUpdateRequest): Promise<{ success: boolean; data: Coupon; message: string }> {
    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'Accept-Language': locale,
      },
      body: JSON.stringify(coupon),
    });
    return handleResponse<{ success: boolean; data: Coupon; message: string }>(response);
  },

  // Delete coupon
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // Toggle coupon status
  async toggleStatus(id: number): Promise<{ success: boolean; data: Coupon; message: string }> {
    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/coupons/${id}/toggle-status`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Accept-Language': locale,
      },
    });
    return handleResponse<{ success: boolean; data: Coupon; message: string }>(response);
  },

  // Validate coupon
  async validate(data: CouponValidateRequest): Promise<{
    success: boolean;
    data: {
      coupon: Coupon;
      discount_amount: number;
      final_amount: number;
    };
    message?: string;
  }> {
    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': locale,
      },
      body: JSON.stringify(data),
    });
    return handleResponse<{
      success: boolean;
      data: {
        coupon: Coupon;
        discount_amount: number;
        final_amount: number;
      };
      message?: string;
    }>(response);
  },

  // Get coupon statistics
  async getStatistics(id: number): Promise<{ success: boolean; data: any }> {
    const response = await fetch(`${API_BASE_URL}/admin/coupons/${id}/statistics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: any }>(response);
  },

  // Get coupon usage
  async getUsage(id: number, params?: {
    search?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
  }): Promise<{ success: boolean; data: any }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const response = await fetch(`${API_BASE_URL}/admin/coupons/${id}/usage?${queryParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: any }>(response);
  },

  // Get overall statistics
  async getOverallStatistics(): Promise<{ success: boolean; data: any }> {
    const response = await fetch(`${API_BASE_URL}/admin/coupons-statistics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: any }>(response);
  },
};

export default couponApi;

