import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, subscriptionType: 'freemium' | 'basic' | 'premium' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!user;

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log('AuthContext: Initializing auth...');
      const token = localStorage.getItem('auth_token');
      console.log('AuthContext: Token found:', !!token);
      
      if (token) {
        try {
          console.log('AuthContext: Fetching user data...');
          const { user: userData } = await api.getUser();
          console.log('AuthContext: User data received:', userData);
          setUser(userData);
        } catch (error) {
          console.error('AuthContext: Failed to fetch user:', error);
          localStorage.removeItem('auth_token');
        }
      }
      console.log('AuthContext: Setting loading to false');
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login({ email, password });
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
      return response.user; // Return user data for immediate use
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    subscriptionType: 'freemium' | 'basic' | 'premium' | 'admin'
  ) => {
    console.log('=== AuthContext: Starting Registration ===');
    console.log('Data:', { name, email, subscription_type: subscriptionType });
    
    try {
      console.log('Calling API register...');
      const response = await api.register({
        name,
        email,
        password,
        subscription_type: subscriptionType,
      });
      console.log('API register response:', response);
      
      localStorage.setItem('auth_token', response.token);
      console.log('Token saved to localStorage');
      
      setUser(response.user);
      console.log('User state updated');
    } catch (error) {
      console.error('Registration failed in AuthContext:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    try {
      const { user: userData } = await api.getUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

