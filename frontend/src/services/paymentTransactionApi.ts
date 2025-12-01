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

export interface PaymentTransaction {
  id: number;
  user_id: number;
  subscription_id?: number | null;
  transaction_id: string;
  payment_gateway: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: string;
  payment_method: string;
  card_last_four?: string | null;
  payment_details?: any;
  gateway_response?: any;
  paid_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  subscription?: {
    id: number;
    plan?: {
      id: number;
      name: string;
      display_name: string;
    };
  };
}

export interface PaymentTransactionUpdateRequest {
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  payment_details?: any;
  gateway_response?: any;
}

export interface PaymentTransactionFilters {
  search?: string;
  status?: string;
  gateway?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
}

export interface PaymentTransactionStatistics {
  total_transactions: number;
  completed_transactions: number;
  pending_transactions: number;
  failed_transactions: number;
  refunded_transactions: number;
  total_revenue: number;
  pending_revenue: number;
  refunded_amount: number;
  average_transaction_value: number;
  monthly_revenue?: Array<{
    year: number;
    month: number;
    revenue: number;
    count: number;
  }>;
  gateway_breakdown?: Array<{
    payment_gateway: string;
    count: number;
    revenue: number;
  }>;
}

export const paymentTransactionApi = {
  // Get all payment transactions with filters
  async getAll(params?: PaymentTransactionFilters): Promise<{ success: boolean; data: any }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.gateway) queryParams.append('gateway', params.gateway);
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.amount_min) queryParams.append('amount_min', params.amount_min.toString());
    if (params?.amount_max) queryParams.append('amount_max', params.amount_max.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/payment-transactions?${queryParams.toString()}`, {
      headers: {
        ...getAuthHeaders(),
        'Accept-Language': locale,
      },
    });
    return handleResponse<{ success: boolean; data: any }>(response);
  },

  // Get payment transaction by ID
  async getById(id: number): Promise<{ success: boolean; data: PaymentTransaction }> {
    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/payment-transactions/${id}`, {
      headers: {
        ...getAuthHeaders(),
        'Accept-Language': locale,
      },
    });
    return handleResponse<{ success: boolean; data: PaymentTransaction }>(response);
  },

  // Update payment transaction
  async update(id: number, transaction: PaymentTransactionUpdateRequest): Promise<{ success: boolean; data: PaymentTransaction; message: string }> {
    const locale = localStorage.getItem('i18nextLng') || 'en';
    const response = await fetch(`${API_BASE_URL}/admin/payment-transactions/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'Accept-Language': locale,
      },
      body: JSON.stringify(transaction),
    });
    return handleResponse<{ success: boolean; data: PaymentTransaction; message: string }>(response);
  },

  // Mark transaction as completed
  async markCompleted(id: number): Promise<{ success: boolean; data: PaymentTransaction; message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/payment-transactions/${id}/mark-completed`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: PaymentTransaction; message: string }>(response);
  },

  // Mark transaction as failed
  async markFailed(id: number): Promise<{ success: boolean; data: PaymentTransaction; message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/payment-transactions/${id}/mark-failed`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: PaymentTransaction; message: string }>(response);
  },

  // Refund transaction
  async refund(id: number): Promise<{ success: boolean; data: PaymentTransaction; message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/payment-transactions/${id}/refund`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: PaymentTransaction; message: string }>(response);
  },

  // Get payment statistics
  async getStatistics(): Promise<{ success: boolean; data: PaymentTransactionStatistics }> {
    const response = await fetch(`${API_BASE_URL}/admin/payment-transactions/statistics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: PaymentTransactionStatistics }>(response);
  },

  // Export transactions
  async export(params?: PaymentTransactionFilters): Promise<{ success: boolean; data: any[][]; message: string }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);

    const response = await fetch(`${API_BASE_URL}/admin/payment-transactions/export?${queryParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: any[][]; message: string }>(response);
  },
};

export default paymentTransactionApi;


