
"use client";

import type { User as AuthUser } from 'firebase/auth'; // Firebase Auth user type
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove, increment, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Gift, Coffee, Percent, ShoppingBag } from 'lucide-react';

import { auth, db } from '@/lib/firebase';
import type { User, MockPurchase, UserMembership } from '@/types/user';
import type { Business } from '@/types/business';
import { useToast } from '@/hooks/use-toast';


// --- MOCK BUSINESSES DATABASE (REMAINS MOCK FOR NOW) ---
export const MOCK_BUSINESSES_DB: Business[] = [
  {
    id: 'biz-001',
    name: 'Loyalty Leap Cafe',
    description: 'Your favorite neighborhood cafe with great coffee and pastries.',
    joinCode: 'CAFE123',
    rewards: [
      { id: 'reward-cafe-1', title: 'Free Coffee', description: 'A complimentary cup of our house blend.', pointsCost: 100, icon: <Coffee className="h-6 w-6" />, image: 'https://placehold.co/400x300.png', imageHint: 'coffee cup', category: 'Beverages' },
      { id: 'reward-cafe-2', title: 'Pastry Discount', description: '20% off any pastry.', pointsCost: 150, icon: <Percent className="h-6 w-6" />, image: 'https://placehold.co/400x300.png', imageHint: 'discount pastry', category: 'Food' },
    ]
  },
  {
    id: 'biz-002',
    name: 'The Book Nook',
    description: 'Discover your next favorite read and enjoy member perks.',
    joinCode: 'BOOKS4U',
    rewards: [
      { id: 'reward-book-1', title: '$5 Off Coupon', description: 'Get $5 off any book purchase over $20.', pointsCost: 200, icon: <Gift className="h-6 w-6" />, image: 'https://placehold.co/400x300.png', imageHint: 'gift voucher', category: 'Vouchers' },
      { id: 'reward-book-2', title: 'Exclusive Bookmark', description: 'A beautifully designed bookmark.', pointsCost: 50, icon: <ShoppingBag className="h-6 w-6" />, image: 'https://placehold.co/400x300.png', imageHint: 'bookmark design', category: 'Merchandise' },
    ]
  }
];


interface AuthContextType {
  user: User | null; // Combines Firebase Auth data with Firestore profile
  firebaseUser: AuthUser | null; // Raw Firebase Auth user
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  addMockPurchaseToUser: (userId: string, businessId: string, purchaseDetails: { item: string; amount: number; pointsEarned: number }) => Promise<boolean>;
  joinBusinessByCode: (businessCode: string) => Promise<{ success: boolean; message: string }>;
  getAllMockUsers: () => Promise<User[]>; // Will now fetch from Firestore
  getBusinessById: (businessId: string) => Business | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Fetch user profile from Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUser({ id: fbUser.uid, ...userDocSnap.data() } as User);
        } else {
          // This case should ideally not happen if signup creates the doc
          // Or, could be a new user signing in with a social provider for the first time
          setUser(null); 
          console.warn("User document not found in Firestore for UID:", fbUser.uid);
        }
        setIsAuthenticated(true);
      } else {
        setFirebaseUser(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle fetching Firestore data and setting user state
      router.push('/loyalty');
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
      setLoading(false); // Ensure loading is false on error
    }
    // setLoading(false) will be handled by onAuthStateChanged listener
  };

  const signup = async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      // Create user document in Firestore
      const newUserProfile: User = {
        id: fbUser.uid,
        name,
        email: fbUser.email || email, // Use email from auth if available
        memberships: [],
      };
      await setDoc(doc(db, 'users', fbUser.uid), newUserProfile);
      // onAuthStateChanged will set user state
      router.push('/loyalty');
    } catch (error: any) {
      console.error("Signup failed:", error);
      toast({
        title: "Signup Failed",
        description: error.message || "Could not create account.",
        variant: "destructive",
      });
      setLoading(false); // Ensure loading is false on error
    }
     // setLoading(false) will be handled by onAuthStateChanged listener
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Failed",
        description: error.message || "Could not log out.",
        variant: "destructive",
      });
    } finally {
      // States will be updated by onAuthStateChanged
    }
  };

  const addMockPurchaseToUser = async (userId: string, businessId: string, purchaseDetails: { item: string; amount: number; pointsEarned: number }): Promise<boolean> => {
    const userDocRef = doc(db, 'users', userId);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        console.error("User not found for adding purchase:", userId);
        toast({ title: "Error", description: "User not found.", variant: "destructive" });
        return false;
      }

      const userData = userDocSnap.data() as User;
      const newPurchase: MockPurchase = {
        id: `p-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        date: new Date().toISOString(),
        ...purchaseDetails,
      };

      let updatedMemberships: UserMembership[];
      const existingMembershipIndex = userData.memberships.findIndex(m => m.businessId === businessId);

      if (existingMembershipIndex > -1) {
        const oldMembership = userData.memberships[existingMembershipIndex];
        const updatedMembership: UserMembership = {
          ...oldMembership,
          purchases: [newPurchase, ...oldMembership.purchases].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          pointsBalance: oldMembership.pointsBalance + purchaseDetails.pointsEarned,
        };
        updatedMemberships = userData.memberships.map((m, index) =>
          index === existingMembershipIndex ? updatedMembership : m
        );
      } else {
        // This case should ideally be prevented by UI (admin can only add purchase for enrolled user in their business)
        // For robustness, create membership if it doesn't exist, though this might indicate a logic flaw elsewhere.
        const business = MOCK_BUSINESSES_DB.find(b => b.id === businessId);
        if (!business) {
          toast({ title: "Error", description: "Business not found.", variant: "destructive" });
          return false;
        }
        const newMembership: UserMembership = {
            businessId: businessId,
            businessName: business.name,
            pointsBalance: purchaseDetails.pointsEarned,
            purchases: [newPurchase]
        };
        updatedMemberships = [...userData.memberships, newMembership];
      }
      
      await updateDoc(userDocRef, { memberships: updatedMemberships });

      // If the updated user is the currently logged-in user, refresh their local state
      if (user && user.id === userId) {
         setUser(prevUser => prevUser ? ({ ...prevUser, memberships: updatedMemberships }) : null);
      }
      toast({ title: "Purchase Added", description: `Purchase recorded for user.`, variant: "default" });
      return true;

    } catch (error: any) {
      console.error("Error adding purchase to Firestore:", error);
      toast({ title: "Error", description: `Failed to add purchase: ${error.message}`, variant: "destructive" });
      return false;
    }
  };

  const joinBusinessByCode = async (businessCode: string): Promise<{ success: boolean; message: string }> => {
    if (!firebaseUser || !user) { // Check firebaseUser for auth, user for profile
      return { success: false, message: "You must be logged in to join a program." };
    }

    const businessToJoin = MOCK_BUSINESSES_DB.find(b => b.joinCode === businessCode);

    if (!businessToJoin) {
      return { success: false, message: "Invalid business code." };
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef); // Fetch fresh user data

    if (!userDocSnap.exists()) {
      return { success: false, message: "User profile not found." };
    }
    const currentUserData = userDocSnap.data() as User;


    const isAlreadyMember = currentUserData.memberships.some(m => m.businessId === businessToJoin.id);
    if (isAlreadyMember) {
      return { success: false, message: `You are already a member of ${businessToJoin.name}.` };
    }

    const welcomeBonusPoints = 50;
    const newMembership: UserMembership = {
      businessId: businessToJoin.id,
      businessName: businessToJoin.name,
      pointsBalance: welcomeBonusPoints,
      purchases: [
        {
          id: `wb-${Date.now()}`,
          item: "Welcome Bonus",
          amount: 0,
          date: new Date().toISOString(),
          pointsEarned: welcomeBonusPoints,
        }
      ],
    };

    try {
      await updateDoc(userDocRef, {
        memberships: arrayUnion(newMembership)
      });
      
      // Update local user state
      setUser(prevUser => prevUser ? ({
        ...prevUser,
        memberships: [...prevUser.memberships, newMembership]
      }) : null);
      
      return { success: true, message: `Successfully joined ${businessToJoin.name} and received ${welcomeBonusPoints} welcome points!` };
    } catch (error: any) {
      console.error("Error joining business in Firestore:", error);
      return { success: false, message: `Failed to join program: ${error.message}` };
    }
  };
  
  const getBusinessById = (businessId: string): Business | undefined => {
    return MOCK_BUSINESSES_DB.find(b => b.id === businessId);
  };

  const getAllMockUsers = async (): Promise<User[]> => {
    setLoading(true);
    try {
      const usersCollectionRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollectionRef);
      const usersList: User[] = [];
      querySnapshot.forEach((docSnap) => {
        usersList.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
      setLoading(false);
      return usersList;
    } catch (error: any) {
      console.error("Error fetching all users from Firestore:", error);
      toast({
          title: "Error Fetching Users",
          description: error.message || "Could not load user data.",
          variant: "destructive",
      });
      setLoading(false);
      return [];
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isAuthenticated, loading, login, logout, signup, addMockPurchaseToUser, joinBusinessByCode, getAllMockUsers, getBusinessById }}>
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
