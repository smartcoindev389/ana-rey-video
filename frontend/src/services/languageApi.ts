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

export interface Language {
  code: string;
  name: string;
  native: string;
  flag: string;
}

export const languageApi = {
  // Get available languages
  getLanguages: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/languages`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse<any>(response);
  },

  // Get current locale
  getLocale: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/locale`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse<any>(response);
  },

  // Set locale
  setLocale: async (locale: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/locale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ locale }),
    });
    return handleResponse<any>(response);
  },

  // Get translations for a locale
  getTranslations: async (locale?: string): Promise<any> => {
    try {
      const url = locale ? `${API_BASE_URL}/translations/${locale}` : `${API_BASE_URL}/translations`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      const result = await handleResponse<any>(response);
      console.log(`API response for ${locale}:`, result);
      // The backend returns { success: true, locale: 'en', data: {...} }
      const translations = result.data || result.translations || {};
      console.log(`Extracted translations for ${locale}:`, Object.keys(translations).length, 'top-level keys');
      return translations;
    } catch (error) {
      console.error(`Error fetching translations for ${locale}:`, error);
      return {};
    }
  },

  // Admin: Get all translations
  getAllTranslations: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/translations`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // Admin: Update translation
  updateTranslation: async (key: string, locale: string, value: string, group?: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/translations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ key, locale, value, group }),
    });
    return handleResponse<any>(response);
  },

  // Admin: Bulk update translations
  bulkUpdateTranslations: async (translations: Array<{key: string, locale: string, value: string, group?: string}>): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/translations/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ translations }),
    });
    return handleResponse<any>(response);
  },

  // Admin: Delete translation
  deleteTranslation: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/admin/translations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },
};

export default languageApi;

