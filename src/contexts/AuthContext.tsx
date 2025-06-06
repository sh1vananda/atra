
"use client";

import type { User as AuthUser } from 'firebase/auth'; // Firebase Auth user type
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, arrayUnion, query, where, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { auth, db } from '@/lib/firebase';
import type { User, MockPurchase, UserMembership } from '@/types/user';
import type { Business } from '@/types/business';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  firebaseUser: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  addMockPurchaseToUser: (userId: string, businessId: string, purchaseDetails: { item: string; amount: number; pointsEarned: number }) => Promise<boolean>;
  joinBusinessByCode: (businessCode: string) => Promise<{ success: boolean; message: string }>;
  getAllMockUsers: () => Promise<User[]>;
  getBusinessById: (businessId: string) => Promise<Business | null>;
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
        // Check if this user is potentially an admin (by checking 'admins' collection)
        // This is to prevent regular users who happen to be admins from being stuck in customer context if they land here.
        const adminProfileRef = doc(db, 'admins', fbUser.uid);
        const adminProfileSnap = await getDoc(adminProfileRef);

        if (adminProfileSnap.exists()) {
            // This user is an admin. If they are on customer pages, they might be confused.
            // For now, let customer auth context proceed, but admin context would also set its state.
            // Ideal scenario: redirect admin to /admin/dashboard if they land on customer pages while logged in as admin.
            // For now, just log a warning.
            console.warn("Admin user detected in customer auth context. This might be confusing.");
        }

        setFirebaseUser(fbUser);
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUser({ id: fbUser.uid, ...userDocSnap.data() } as User);
        } else {
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
      router.push('/loyalty');
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      const newUserProfile: User = {
        id: fbUser.uid,
        name,
        email: fbUser.email || email,
        memberships: [],
      };
      await setDoc(doc(db, 'users', fbUser.uid), newUserProfile);
      router.push('/loyalty');
    } catch (error: any) {
      console.error("Signup failed:", error);
      toast({
        title: "Signup Failed",
        description: error.message || "Could not create account.",
        variant: "destructive",
      });
      setLoading(false);
    }
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
        // State will be updated by onAuthStateChanged
    }
  };

  const addMockPurchaseToUser = async (userId: string, businessId: string, purchaseDetails: { item: string; amount: number; pointsEarned: number }): Promise<boolean> => {
    const userDocRef = doc(db, 'users', userId);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
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
        const oldMembership = { ...userData.memberships[existingMembershipIndex] };
        oldMembership.purchases = [newPurchase, ...(oldMembership.purchases || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        oldMembership.pointsBalance = (oldMembership.pointsBalance || 0) + purchaseDetails.pointsEarned;
        
        updatedMemberships = userData.memberships.map((m, index) =>
          index === existingMembershipIndex ? oldMembership : m
        );
      } else {
        const businessDetails = await getBusinessById(businessId);
        if (!businessDetails) {
          toast({ title: "Error", description: "Business not found.", variant: "destructive" });
          return false;
        }
        const newMembershipEntry: UserMembership = {
            businessId: businessId,
            businessName: businessDetails.name,
            pointsBalance: purchaseDetails.pointsEarned,
            purchases: [newPurchase]
        };
        updatedMemberships = [...(userData.memberships || []), newMembershipEntry];
      }
      
      await updateDoc(userDocRef, { memberships: updatedMemberships });

      if (user && user.id === userId) {
         setUser(prevUser => prevUser ? ({ ...prevUser, memberships: updatedMemberships }) : null);
      }
      toast({ title: "Purchase Added", description: `Purchase recorded.`, variant: "default" });
      return true;

    } catch (error: any) {
      console.error("Error adding purchase to Firestore:", error);
      toast({ title: "Error", description: `Failed to add purchase: ${error.message}`, variant: "destructive" });
      return false;
    }
  };

  const joinBusinessByCode = async (businessCode: string): Promise<{ success: boolean; message: string }> => {
    if (!firebaseUser || !user) {
      return { success: false, message: "You must be logged in to join a program." };
    }

    const businessesRef = collection(db, "businesses");
    const q = query(businessesRef, where("joinCode", "==", businessCode.toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: "Invalid business code." };
    }
    
    const businessToJoinDoc = querySnapshot.docs[0];
    const businessToJoin = { id: businessToJoinDoc.id, ...businessToJoinDoc.data() } as Business;


    const userDocRef = doc(db, 'users', firebaseUser.uid);
    // It's good practice to re-fetch user data or use a transaction if data consistency is critical
    const currentUserData = user; // Using existing state for simplicity, but re-fetch is safer in complex scenarios.

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
      
      setUser(prevUser => prevUser ? ({
        ...prevUser,
        memberships: [...(prevUser.memberships || []), newMembership]
      }) : null);
      
      return { success: true, message: `Successfully joined ${businessToJoin.name} and received ${welcomeBonusPoints} welcome points!` };
    } catch (error: any) {
      console.error("Error joining business in Firestore:", error);
      return { success: false, message: `Failed to join program: ${error.message}` };
    }
  };
  
  const getBusinessById = async (businessId: string): Promise<Business | null> => {
    if (!businessId) return null;
    const businessDocRef = doc(db, 'businesses', businessId);
    const businessDocSnap = await getDoc(businessDocRef);
    if (businessDocSnap.exists()) {
      return { id: businessDocSnap.id, ...businessDocSnap.data() } as Business;
    }
    return null;
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
    } catch (error: any).
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
