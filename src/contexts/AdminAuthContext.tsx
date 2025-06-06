
"use client";

import type { AdminUser } from '@/types/admin';
import { useRouter }_from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedAdminUser = localStorage.getItem('loyaltyAdminUser');
    if (storedAdminUser) {
      try {
        setAdminUser(JSON.parse(storedAdminUser) as AdminUser);
        setIsAdminAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse stored admin user:", e);
        localStorage.removeItem('loyaltyAdminUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test admin account
    if (email === 'admin@example.com' && pass === 'adminpass') {
      const mockAdminUser: AdminUser = { 
        id: 'admin-001', 
        businessName: 'Loyalty Leap Admin', 
        email: email 
      };
      setAdminUser(mockAdminUser);
      setIsAdminAuthenticated(true);
      localStorage.setItem('loyaltyAdminUser', JSON.stringify(mockAdminUser));
      router.push('/admin/dashboard');
    } else {
      // Handle login failure
      console.error("Admin login failed: Invalid credentials");
      alert("Admin login failed. Use admin@example.com and adminpass.");
    }
    setLoading(false);
  };

  const logout = () => {
    setAdminUser(null);
    setIsAdminAuthenticated(false);
    localStorage.removeItem('loyaltyAdminUser');
    router.push('/admin/login');
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, isAdminAuthenticated, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
