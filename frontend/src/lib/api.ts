const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

interface User {
  id: number;
  name: string;
  email: string;
  subscription_type: 'freemium' | 'basic' | 'premium' | 'admin';
  role: 'user' | 'admin';
  is_admin: boolean;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  is_subscription_active?: boolean;
}

interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  subscription_type: 'freemium' | 'basic' | 'premium' | 'admin';
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const error: ApiError = await response.json();
        throw new Error(error.message || 'An error occurred');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (isJson) {
      return response.json();
    }

    return {} as T;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('=== API: Register Request ===');
    console.log('URL:', `${this.baseUrl}/register`);
    console.log('Data:', { ...data, password: '***' });
    
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    console.log('Register response status:', response.status);
    const result = await this.handleResponse<AuthResponse>(response);
    console.log('Register result:', { ...result, token: '***' });
    return result;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    console.log('Attempting login to:', `${this.baseUrl}/login`);
    console.log('Login data:', { email: data.email });
    
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    console.log('Login response status:', response.status);
    return this.handleResponse<AuthResponse>(response);
  }

  async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/logout`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    await this.handleResponse<void>(response);
    localStorage.removeItem('auth_token');
  }

  async getUser(): Promise<{ user: User }> {
    const response = await fetch(`${this.baseUrl}/user`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ user: User }>(response);
  }

  async updateSubscription(subscriptionType: 'freemium' | 'basic' | 'premium' | 'admin'): Promise<{ user: User; message: string }> {
    const response = await fetch(`${this.baseUrl}/subscription`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ subscription_type: subscriptionType }),
    });

    return this.handleResponse<{ user: User; message: string }>(response);
  }
}

export const api = new ApiClient(API_BASE_URL);

export type { User, AuthResponse, LoginData, RegisterData };

