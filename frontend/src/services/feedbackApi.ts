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
export interface Feedback {
  id: number;
  user_id: number;
  video_id: number | null;
  type: 'bug_report' | 'feature_request' | 'general_feedback' | 'complaint';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'rejected';
  category: string | null;
  rating: number | null;
  metadata: any;
  resolved_at: string | null;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  user?: any;
  assigned_user?: any;
  video?: any;
}

export interface FeedbackCreateRequest {
  video_id?: number;
  type: 'bug_report' | 'feature_request' | 'general_feedback' | 'complaint';
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  rating?: number;
}

export const feedbackApi = {
  // Get all feedback (for admin or user's own)
  getAll: async (params?: { 
    search?: string;
    type?: string;
    status?: string;
    priority?: string;
    category?: string;
    video_id?: number;
    per_page?: number;
  }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.video_id) queryParams.append('video_id', params.video_id.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const url = `${API_BASE_URL}/feedback${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Create feedback
  create: async (data: FeedbackCreateRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Get single feedback
  get: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/feedback/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Update feedback (admin)
  update: async (id: number, data: Partial<Feedback>): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/feedback/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Delete feedback (admin)
  delete: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/feedback/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Get statistics (admin)
  getStatistics: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/feedback-statistics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Resolve feedback (admin)
  resolve: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/feedback/${id}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Reject feedback (admin)
  reject: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/feedback/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },
};

export default feedbackApi;

