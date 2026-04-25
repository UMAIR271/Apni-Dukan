'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  accountType: 'RETAIL' | 'WHOLESALE' | null;
  wholesaleApproved: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: { username: string; email: string; password: string; first_name?: string; last_name?: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<'RETAIL' | 'WHOLESALE' | null>(null);
  const [wholesaleApproved, setWholesaleApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const profile = await api.getUserProfile();
      setUser(profile.user);
      setAccountType(profile.account_type);
      setWholesaleApproved(profile.wholesale_approved);
      if (typeof window !== 'undefined') {
        localStorage.setItem('account_type', profile.account_type);
        localStorage.setItem('wholesale_approved', String(profile.wholesale_approved));
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  useEffect(() => {
    // Check for stored token on mount
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        fetchUserProfile();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await api.login(username, password);
    setToken(response.token);
    setUser(response.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.token);
    }
    // Fetch user profile to get account type and wholesale status
    await fetchUserProfile();
  };

  const signup = async (data: { username: string; email: string; password: string; first_name?: string; last_name?: string }) => {
    const response = await api.signup(data);
    setToken(response.token);
    setUser(response.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.token);
    }
    // Fetch user profile to get account type and wholesale status
    await fetchUserProfile();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAccountType(null);
    setWholesaleApproved(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('account_type');
      localStorage.removeItem('wholesale_approved');
    }
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchUserProfile();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        accountType,
        wholesaleApproved,
        login,
        signup,
        logout,
        isAuthenticated: !!token,
        loading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
