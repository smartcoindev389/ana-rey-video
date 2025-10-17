import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaqResponse {
  success: boolean;
  data: Record<string, Faq[]>;
  categories?: string[];
}

export interface FaqCreateRequest {
  question: string;
  answer: string;
  category: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface FaqUpdateRequest {
  question?: string;
  answer?: string;
  category?: string;
  sort_order?: number;
  is_active?: boolean;
}

class FaqApi {
  private baseURL = `${API_BASE_URL}/faqs`;

  // Public methods (no auth required)
  async getFaqs(category?: string): Promise<FaqResponse> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') {
        params.append('category', category);
      }
      
      const response = await axios.get(`${this.baseURL}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw error;
    }
  }

  async getCategories(): Promise<{ success: boolean; data: string[] }> {
    try {
      const response = await axios.get(`${this.baseURL}/categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
      throw error;
    }
  }

  // Helper method to get auth headers
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Admin methods (require auth)
  async createFaq(faqData: FaqCreateRequest): Promise<{ success: boolean; data: Faq; message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/faqs`, faqData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating FAQ:', error);
      throw error;
    }
  }

  async updateFaq(id: number, faqData: FaqUpdateRequest): Promise<{ success: boolean; data: Faq; message: string }> {
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/faqs/${id}`, faqData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating FAQ:', error);
      throw error;
    }
  }

  async deleteFaq(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/admin/faqs/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      throw error;
    }
  }

  async getFaq(id: number): Promise<{ success: boolean; data: Faq }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/faqs/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      throw error;
    }
  }

  // Admin method to get all FAQs (including inactive)
  async getAdminFaqs(): Promise<FaqResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/faqs`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin FAQs:', error);
      throw error;
    }
  }
}

export const faqApi = new FaqApi();
