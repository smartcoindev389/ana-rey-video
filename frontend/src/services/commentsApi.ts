const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface VideoComment {
  id: number;
  video_id: number;
  user_id: number;
  comment: string;
  likes_count: number;
  replies_count: number;
  parent_id: number | null;
  comment_time: number | null;
  created_at: string;
  updated_at: string;
  is_liked?: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  replies?: VideoComment[];
}

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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

export const commentsApi = {
  async getComments(videoId: number, sortBy: 'newest' | 'most_liked' = 'newest') {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comments?sort_by=${sortBy}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: VideoComment[] }>(response);
  },

  async createComment(videoId: number, data: { comment: string; parent_id?: number | null; comment_time?: number | null }) {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; data: VideoComment; message: string }>(response);
  },

  async updateComment(commentId: number, comment: string) {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comment }),
    });
    return handleResponse<{ success: boolean; data: VideoComment; message: string }>(response);
  },

  async deleteComment(commentId: number) {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  async toggleLike(commentId: number) {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/like`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: { liked: boolean; likes_count: number }; message: string }>(response);
  },
};

export default commentsApi;

