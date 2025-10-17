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
export interface SiteSetting {
  id: number;
  key: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'json';
  group: string;
  label: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SettingsGroup {
  [key: string]: SiteSetting[];
}

export interface SettingsUpdateRequest {
  key: string;
  value: any;
  type?: string;
  group?: string;
  label?: string;
  description?: string;
}

// Settings API
export const settingsApi = {
  // Get all settings grouped by group
  async getAll(): Promise<{ success: boolean; data: SettingsGroup }> {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get settings by group
  async getByGroup(group: string): Promise<{ success: boolean; data: SiteSetting[] }> {
    const response = await fetch(`${API_BASE_URL}/admin/settings/${group}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get a specific setting value
  async getValue(key: string): Promise<{ success: boolean; value: any }> {
    const response = await fetch(`${API_BASE_URL}/admin/settings/value/${key}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Bulk update settings
  async bulkUpdate(settings: SettingsUpdateRequest[]): Promise<{ success: boolean; data: SiteSetting[]; message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings }),
    });
    return handleResponse(response);
  },

  // Get public settings (for frontend use)
  async getPublicSettings(): Promise<{ success: boolean; data: Record<string, string> }> {
    const response = await fetch(`${API_BASE_URL}/settings/public`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

export default settingsApi;
