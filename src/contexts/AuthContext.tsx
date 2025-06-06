
"use client";

import type { User as AuthUser } from 'firebase/auth'; // Firebase Auth user type
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
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
      setLoading(true);
      if (fbUser) {
        const adminProfileRef = doc(db, 'admins', fbUser.uid);
        try {
          const adminProfileSnap = await getDoc(adminProfileRef);
          if (adminProfileSnap.exists()) {
            // This is an admin user trying to use the customer portal.
            // Log them out from Firebase Auth to prevent conflicts and ensure they use the admin portal.
            await signOut(auth); 
            // setUser, setFirebaseUser, setIsAuthenticated will be handled by the signOut triggering onAuthStateChanged again.
            // No toast here to avoid confusion if they were just testing.
            setLoading(false);
            return; // Exit early
          }
        } catch (error) {
           console.error("Error checking for admin profile in customer context:", error);
           // Proceed as if not an admin, but log the error.
        }
        
        setFirebaseUser(fbUser);
        const userDocRef = doc(db, 'users', fbUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUser({ id: fbUser.uid, ...userDocSnap.data() } as User);
            setIsAuthenticated(true);
          } else {
            // User authenticated with Firebase but no Firestore profile.
            // This could happen if Firestore doc creation failed during signup.
            // For now, treat as not fully authenticated in the app.
            setUser(null); 
            setIsAuthenticated(false);
            toast({ title: "Profile Error", description: "User profile not found. Please try signing up again or contact support.", variant: "destructive" });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null); 
          setIsAuthenticated(false);
          toast({ title: "Error", description: "Could not fetch user profile.", variant: "destructive" });
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // router removed as it's stable, add back if needed for specific logic

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle fetching user data and setting state
      router.push('/loyalty');
    } catch (error: any) {
      console.error("Customer login failed:", error);
      let errorMessage = "Invalid email or password.";
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address format is not valid.';
            break;
          default:
            errorMessage = error.message || "An unexpected error occurred during login.";
        }
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false); // Ensure loading is false regardless of outcome if not handled by onAuthStateChanged immediately
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
        email: fbUser.email || email, // Use passed email as fallback
        memberships: [],
      };
      await setDoc(doc(db, 'users', fbUser.uid), newUserProfile);
      // onAuthStateChanged will handle setting user data and state
      router.push('/loyalty');
    } catch (error: any) {
      console.error("Customer signup failed:", error);
      let errorMessage = "Could not create account.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered. Please log in or use a different email.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak. Please choose a stronger password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          default:
            errorMessage = error.message || "An unexpected error occurred during signup.";
        }
      }
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will clear user, firebaseUser, isAuthenticated
      router.push('/login');
      toast({ title: "Logged Out", description: "You have been successfully logged out."});
    } catch (error: any) {
      console.error("Customer logout failed:", error);
      toast({
        title: "Logout Failed",
        description: error.message || "Could not log out.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      const existingMembershipIndex = userData.memberships?.findIndex(m => m.businessId === businessId) ?? -1;

      if (existingMembershipIndex > -1 && userData.memberships) {
        const oldMembership = userData.memberships[existingMembershipIndex];
        const updatedMembership: UserMembership = {
          ...oldMembership,
          purchases: [newPurchase, ...(oldMembership.purchases || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          pointsBalance: (oldMembership.pointsBalance || 0) + purchaseDetails.pointsEarned,
        };
        updatedMemberships = userData.memberships.map((m, index) =>
          index === existingMembershipIndex ? updatedMembership : m
        );
      } else {
        // This case should ideally not happen if an admin is adding a purchase,
        // as the user should already be a member. But handle defensively.
        const businessDetails = await getBusinessById(businessId);
        if (!businessDetails) {
          toast({ title: "Error", description: "Business not found for new membership.", variant: "destructive" });
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

      // If the updated user is the currently logged-in user, update their local state.
      if (user && user.id === userId) {
         setUser(prevUser => prevUser ? ({ ...prevUser, memberships: [...updatedMemberships] }) : null);
      }
      toast({ title: "Purchase Added", description: `Purchase recorded for user.`, variant: "default" });
      return true;

    } catch (error: any) {
      console.error("Error adding purchase to Firestore:", error);
      toast({ title: "Error Adding Purchase", description: `Failed to add purchase: ${error.message || 'Unknown error'}`, variant: "destructive" });
      return false;
    }
  };

  const joinBusinessByCode = async (businessCode: string): Promise<{ success: boolean; message: string }> => {
    if (!firebaseUser || !user) { 
      return { success: false, message: "You must be logged in to join a program." };
    }

    const businessesRef = collection(db, "businesses");
    const q = query(businessesRef, where("joinCode", "==", businessCode.toUpperCase()));
    
    try {
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, message: "Invalid business code." };
      }
      
      const businessToJoinDoc = querySnapshot.docs[0];
      const businessToJoin = { id: businessToJoinDoc.id, ...businessToJoinDoc.data() } as Business;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef); // Ensure we have the latest user data
      if (!userDocSnap.exists()) {
        return { success: false, message: "User profile not found." };
      }
      const currentUserData = userDocSnap.data() as User;

      const isAlreadyMember = currentUserData.memberships?.some(m => m.businessId === businessToJoin.id);
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
            id: `wb-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            item: "Welcome Bonus",
            amount: 0,
            date: new Date().toISOString(),
            pointsEarned: welcomeBonusPoints,
          }
        ],
      };
      
      const updatedMemberships = [...(currentUserData.memberships || []), newMembership];
      await updateDoc(userDocRef, {
        memberships: updatedMemberships
      });
      
      // Update local user state
      setUser(prevUser => prevUser ? ({
        ...prevUser,
        memberships: [...updatedMemberships] 
      }) : null);
      
      return { success: true, message: `Successfully joined ${businessToJoin.name} and received ${welcomeBonusPoints} welcome points!` };

    } catch (error: any) {
      console.error("Error joining business by code:", error);
      return { success: false, message: `Failed to join program: ${error.message || 'Unknown error'}` };
    }
  };
  
  const getBusinessById = async (businessId: string): Promise<Business | null> => {
    if (!businessId) return null;
    const businessDocRef = doc(db, 'businesses', businessId);
    try {
      const businessDocSnap = await getDoc(businessDocRef);
      if (businessDocSnap.exists()) {
        return { id: businessDocSnap.id, ...businessDocSnap.data() } as Business;
      }
      // Do not toast here, as it might be called in contexts where business not existing is not an error for the user.
      console.warn(`Business with ID ${businessId} not found.`);
      return null;
    } catch (error: any) {
      console.error(`Error fetching business ${businessId}:`, error);
      toast({ title: "Error", description: `Could not fetch business details: ${error.message || 'Unknown error'}`, variant: "destructive"});
      return null;
    }
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
      return usersList;
    } catch (error: any) {
      console.error("Error fetching all users from Firestore:", error);
      toast({
          title: "Error Fetching Users",
          description: error.message || "Could not load user data.",
          variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
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

