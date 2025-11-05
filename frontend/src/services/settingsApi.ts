const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Helper function to get locale from localStorage or default to 'en'
const getLocale = (): string => {
  return localStorage.getItem('i18nextLng') || 'en';
};

// Helper function to get auth headers
const getAuthHeaders = (localeOverride?: string): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  const locale = localeOverride || getLocale();
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
  locale?: string; // Add locale support for translations
}

// Settings API
export const settingsApi = {
  // Get all settings grouped by group
  async getAll(locale?: string): Promise<{ success: boolean; data: SettingsGroup }> {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      headers: getAuthHeaders(locale),
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
  async bulkUpdate(settings: SettingsUpdateRequest[], locale?: string): Promise<{ success: boolean; data: SiteSetting[]; message: string }> {
    // Add locale to each setting if provided (but don't override if already set)
    const settingsWithLocale = locale 
      ? settings.map(s => ({ ...s, locale: s.locale || locale }))
      : settings;
    
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings: settingsWithLocale }),
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
