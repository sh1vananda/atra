
"use client";

import type { User, MockPurchase, UserMembership } from '@/types/user';
import type { Business, Reward } from '@/types/business';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Gift, Coffee, Percent, ShoppingBag } from 'lucide-react'; // For mock rewards

// --- MOCK BUSINESSES DATABASE ---
export const MOCK_BUSINESSES_DB: Business[] = [
  {
    id: 'biz-001',
    name: 'Loyalty Leap Cafe',
    description: 'Your favorite neighborhood cafe with great coffee and pastries.',
    rewards: [
      { id: 'reward-cafe-1', title: 'Free Coffee', description: 'A complimentary cup of our house blend.', pointsCost: 100, icon: <Coffee className="h-6 w-6" />, image: 'https://placehold.co/400x300.png', imageHint: 'coffee cup', category: 'Beverages' },
      { id: 'reward-cafe-2', title: 'Pastry Discount', description: '20% off any pastry.', pointsCost: 150, icon: <Percent className="h-6 w-6" />, image: 'https://placehold.co/400x300.png', imageHint: 'discount pastry', category: 'Food' },
    ]
  },
  {
    id: 'biz-002',
    name: 'The Book Nook',
    description: 'Discover your next favorite read and enjoy member perks.',
    rewards: [
      { id: 'reward-book-1', title: '$5 Off Coupon', description: 'Get $5 off any book purchase over $20.', pointsCost: 200, icon: <Gift className="h-6 w-6" />, image: 'https://placehold.co/400x300.png', imageHint: 'gift voucher', category: 'Vouchers' },
      { id: 'reward-book-2', title: 'Exclusive Bookmark', description: 'A beautifully designed bookmark.', pointsCost: 50, icon: <ShoppingBag className="h-6 w-6" />, image: 'https://placehold.co/400x300.png', imageHint: 'bookmark design', category: 'Merchandise' },
    ]
  }
];

// --- MOCK USERS DATABASE ---
let MOCK_USERS_DB: { [email: string]: User } = {
  'loyal@example.com': {
    id: 'mock-user-id-123',
    name: 'Loyal Customer',
    email: 'loyal@example.com',
    memberships: [
      {
        businessId: 'biz-001',
        businessName: 'Loyalty Leap Cafe',
        pointsBalance: 120,
        purchases: [
          { id: 'p1', item: 'Latte', amount: 4.50, date: new Date('2024-07-20T10:30:00Z').toISOString(), pointsEarned: 20 },
          { id: 'p2', item: 'Croissant', amount: 3.00, date: new Date('2024-07-15T09:15:00Z').toISOString(), pointsEarned: 15 },
        ]
      },
      {
        businessId: 'biz-002',
        businessName: 'The Book Nook',
        pointsBalance: 75,
        purchases: [
          { id: 'p5', item: 'Fantasy Novel', amount: 18.00, date: new Date('2024-07-21T14:00:00Z').toISOString(), pointsEarned: 30 },
        ]
      }
    ]
  },
  'user@example.com': {
    id: 'usr-test-001',
    name: 'Test User',
    email: 'user@example.com',
    memberships: [
      {
        businessId: 'biz-001',
        businessName: 'Loyalty Leap Cafe',
        pointsBalance: 50, // Welcome bonus
        purchases: [
          { id: 'p3', item: 'Welcome Bonus', amount: 0, date: new Date('2024-07-22T12:00:00Z').toISOString(), pointsEarned: 50 },
        ]
      }
    ]
  }
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  addMockPurchaseToUser: (userId: string, businessId: string, purchaseDetails: { item: string; amount: number; pointsEarned: number }) => Promise<boolean>;
  getAllMockUsers: () => User[];
  getBusinessById: (businessId: string) => Business | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    } else if (email === 'loyal@example.com' && pass === 'password123') { // Added for easier testing
      foundUser = MOCK_USERS_DB['loyal@example.com'];
    }
     else if (MOCK_USERS_DB[email]) { // Fallback for any mock user by email
        foundUser = MOCK_USERS_DB[email];
    }


    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('loyaltyUser', JSON.stringify(foundUser));
      router.push('/loyalty'); 
    } else {
      console.error("Login failed: Invalid credentials");
      alert("Login failed: Invalid credentials. Test with user@example.com or loyal@example.com (pass: password123).");
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
      memberships: [] 
    };
    const defaultBusiness = MOCK_BUSINESSES_DB[0];
    if (defaultBusiness) {
      newUser.memberships.push({
        businessId: defaultBusiness.id,
        businessName: defaultBusiness.name,
        pointsBalance: 50,
        purchases: [{ id: `wp-${Date.now()}`, item: 'Welcome Bonus', amount: 0, date: new Date().toISOString(), pointsEarned: 50 }]
      });
    }

    MOCK_USERS_DB[email] = newUser; 
    
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('loyaltyUser', JSON.stringify(newUser));
    setLoading(false);
    router.push('/loyalty'); 
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('loyaltyUser');
    router.push('/login');
  };

  const addMockPurchaseToUser = async (userId: string, businessId: string, purchaseDetails: { item: string; amount: number; pointsEarned: number }): Promise<boolean> => {
    const targetUser = Object.values(MOCK_USERS_DB).find(u => u.id === userId);
    if (!targetUser) {
      console.error("User not found for adding purchase:", userId);
      return false;
    }

    let membership = targetUser.memberships.find(m => m.businessId === businessId);
    if (!membership) {
      const business = MOCK_BUSINESSES_DB.find(b => b.id === businessId);
      if (!business) {
        console.error("Business not found for creating membership:", businessId);
        return false;
      }
      membership = {
        businessId: business.id,
        businessName: business.name,
        pointsBalance: 0,
        purchases: [],
      };
      targetUser.memberships.push(membership);
    }

    const newPurchase: MockPurchase = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      date: new Date().toISOString(),
      ...purchaseDetails,
    };

    membership.purchases.push(newPurchase);
    membership.pointsBalance += purchaseDetails.pointsEarned;
    
    MOCK_USERS_DB[targetUser.email] = {...targetUser, memberships: [...targetUser.memberships]};

    if (user && user.id === userId) {
      const updatedCurrentUser = JSON.parse(JSON.stringify(MOCK_USERS_DB[targetUser.email])); 
      setUser(updatedCurrentUser);
      localStorage.setItem('loyaltyUser', JSON.stringify(updatedCurrentUser));
    }
    return true;
  };
  
  const getBusinessById = (businessId: string): Business | undefined => {
    return MOCK_BUSINESSES_DB.find(b => b.id === businessId);
  };

  const getAllMockUsers = (): User[] => {
    return Object.values(MOCK_USERS_DB);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, signup, addMockPurchaseToUser, getAllMockUsers, getBusinessById }}>
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
