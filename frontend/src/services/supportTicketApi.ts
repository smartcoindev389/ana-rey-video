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
export interface SupportTicket {
  id: number;
  user_id: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'account' | 'content' | 'general';
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  user?: any;
  assigned_user?: any;
  replies?: TicketReply[];
}

export interface TicketReply {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  created_at: string;
  updated_at: string;
  user?: any;
}

export interface SupportTicketCreateRequest {
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'account' | 'content' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface SupportTicketUpdateRequest {
  subject?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'technical' | 'billing' | 'account' | 'content' | 'general';
  assigned_to?: number | null;
}

export interface TicketReplyCreateRequest {
  message: string;
}

export const supportTicketApi = {
  // Get all tickets (for admin)
  getAll: async (params?: { status?: string; category?: string; priority?: string }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.priority) queryParams.append('priority', params.priority);
    
    const url = `${API_BASE_URL}/support-tickets${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get user's tickets
  getUserTickets: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/support-tickets`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get single ticket
  get: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/support-tickets/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Create ticket
  create: async (data: SupportTicketCreateRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/support-tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Update ticket (admin)
  update: async (id: number, data: SupportTicketUpdateRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/support-tickets/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Delete ticket (admin)
  delete: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/support-tickets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Assign ticket
  assign: async (id: number, userId: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/support-tickets/${id}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_id: userId }),
    });
    return handleResponse<any>(response);
  },

  // Resolve ticket
  resolve: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/support-tickets/${id}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Close ticket
  close: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/support-tickets/${id}/close`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Reopen ticket
  reopen: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/support-tickets/${id}/reopen`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Add reply to ticket
  addReply: async (id: number, data: TicketReplyCreateRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/support-tickets/${id}/add-reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Get replies for ticket
  getReplies: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/support-tickets/${id}/replies`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get statistics (admin)
  getStatistics: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/support-tickets-statistics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },
};

export default supportTicketApi;
