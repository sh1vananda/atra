
"use client";

import type { AdminUser } from '@/types/admin';
import type { Business } from '@/types/business'; // Import Business type
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_BUSINESSES_DB } from './AuthContext'; // Assuming businesses are defined in AuthContext for now or a shared place

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  getManagedBusiness: () => Business | undefined;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Mock admin credentials - typically this would be a secure check against a database
const MOCK_ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'adminpass',
  businessId: 'biz-001', // Link this admin to the first mock business
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedAdminUser = localStorage.getItem('loyaltyAdminUser');
    if (storedAdminUser) {
      try {
        const parsedAdminUser = JSON.parse(storedAdminUser) as AdminUser;
        const business = MOCK_BUSINESSES_DB.find(b => b.id === parsedAdminUser.businessId);
        if (business && parsedAdminUser.email === MOCK_ADMIN_CREDENTIALS.email) { // Basic validation against mock
          setAdminUser({ ...parsedAdminUser, businessName: business.name });
          setIsAdminAuthenticated(true);
        } else {
            localStorage.removeItem('loyaltyAdminUser'); 
        }
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
    
    if (email === MOCK_ADMIN_CREDENTIALS.email && pass === MOCK_ADMIN_CREDENTIALS.password) {
      const business = MOCK_BUSINESSES_DB.find(b => b.id === MOCK_ADMIN_CREDENTIALS.businessId);
      if (business) {
        const mockAdminUser: AdminUser = { 
          id: 'admin-user-001', 
          email: email,
          businessId: business.id,
          businessName: business.name,
        };
        setAdminUser(mockAdminUser);
        setIsAdminAuthenticated(true);
        localStorage.setItem('loyaltyAdminUser', JSON.stringify(mockAdminUser));
        router.push('/admin/dashboard');
      } else {
        console.error("Admin login failed: Managed business not found.");
        // Consider toast: toast({ title: "Login Failed", description: "Admin configuration error.", variant: "destructive" });
      }
    } else {
      console.error("Admin login failed: Invalid credentials");
      // Consider toast: toast({ title: "Login Failed", description: "Invalid admin email or password.", variant: "destructive" });
    }
    setLoading(false);
  };

  const logout = () => {
    setAdminUser(null);
    setIsAdminAuthenticated(false);
    localStorage.removeItem('loyaltyAdminUser');
    router.push('/admin/login'); 
  };

  const getManagedBusiness = (): Business | undefined => {
    if (adminUser) {
      return MOCK_BUSINESSES_DB.find(b => b.id === adminUser.businessId);
    }
    return undefined;
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, isAdminAuthenticated, loading, login, logout, getManagedBusiness }}>
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
