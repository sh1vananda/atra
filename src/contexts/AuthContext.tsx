
"use client";

import type { User } from '@/types/user';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, pass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Mock session check from localStorage
    const storedUser = localStorage.getItem('loyaltyUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem('loyaltyUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, _pass: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const mockUser: User = { id: 'mock-user-id-123', name: 'Loyal Customer', email: email };
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('loyaltyUser', JSON.stringify(mockUser));
    setLoading(false);
    router.push('/profile');
  };

  const signup = async (name: string, email: string, _pass: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const mockUser: User = { id: `mock-user-${Date.now()}`, name, email };
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('loyaltyUser', JSON.stringify(mockUser));
    setLoading(false);
    router.push('/profile');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('loyaltyUser');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
