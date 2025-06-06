
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

// Mock user data including purchases for admin view
const MOCK_USERS_DB: { [email: string]: User } = {
  'loyal@example.com': {
    id: 'mock-user-id-123',
    name: 'Loyal Customer',
    email: 'loyal@example.com',
    mockPurchases: [
      { id: 'p1', item: 'Coffee', amount: 3.50, date: new Date('2024-07-20T10:30:00Z').toISOString(), pointsEarned: 20 },
      { id: 'p2', item: 'Pastry', amount: 2.75, date: new Date('2024-07-15T09:15:00Z').toISOString(), pointsEarned: 15 },
    ]
  },
  'user@example.com': {
    id: 'usr-test-001',
    name: 'Test User',
    email: 'user@example.com',
    mockPurchases: [
      { id: 'p3', item: 'Sandwich', amount: 7.00, date: new Date('2024-07-22T12:00:00Z').toISOString(), pointsEarned: 30 },
      { id: 'p4', item: 'Juice', amount: 4.00, date: new Date('2024-07-22T12:00:00Z').toISOString(), pointsEarned: 10 },
    ]
  }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('loyaltyUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        // Enrich with mock purchases if they exist in our "DB"
        const dbUser = Object.values(MOCK_USERS_DB).find(u => u.id === parsedUser.id);
        if (dbUser) {
          setUser(dbUser);
        } else {
          setUser(parsedUser);
        }
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem('loyaltyUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    let foundUser: User | null = null;

    if (email === 'user@example.com' && pass === 'password123') {
      foundUser = MOCK_USERS_DB['user@example.com'];
    } else if (MOCK_USERS_DB[email]) { // Allow login for any user in mock DB with any password for demo
        foundUser = MOCK_USERS_DB[email];
    }


    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('loyaltyUser', JSON.stringify(foundUser));
      router.push('/profile');
    } else {
      // Handle login failure (e.g., show a toast message)
      console.error("Login failed: Invalid credentials");
      alert("Login failed: Invalid credentials. Test with user@example.com and password123.");
    }
    setLoading(false);
  };

  const signup = async (name: string, email: string, pass: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (MOCK_USERS_DB[email]) {
        alert("Signup failed: Email already exists.");
        setLoading(false);
        return;
    }

    const newUser: User = { 
      id: `mock-user-${Date.now()}`, 
      name, 
      email,
      mockPurchases: [
        { id: `p-${Date.now()}`, item: 'Welcome Bonus Points', amount: 0, date: new Date().toISOString(), pointsEarned: 50 }
      ]
    };
    MOCK_USERS_DB[email] = newUser; // Add to our mock DB
    
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('loyaltyUser', JSON.stringify(newUser));
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

// Function to be used by admin panel to get all mock users
export const getAllMockUsers = (): User[] => {
  return Object.values(MOCK_USERS_DB);
};
