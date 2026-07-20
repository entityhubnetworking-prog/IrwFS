import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await authAPI.checkSession();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const userData = await authAPI.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await authAPI.login(email, password);
    setIsAuthenticated(true);
    const userData = await authAPI.getMe();
    setUser(userData);
  };

  const register = async (email: string, username: string, password: string, fullName?: string) => {
    await authAPI.register(email, username, password, fullName);
    // After registration, user needs to verify email and login
  };

  const logout = async () => {
    await authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshUser = async () => {
    if (isAuthenticated) {
      const userData = await authAPI.getMe();
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading,
      login,
      register,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
