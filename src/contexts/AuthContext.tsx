
"use client";

import type { User as AuthUser } from 'firebase/auth';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, deleteUser as deleteFirebaseAuthUser } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, query, where, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User, MockPurchase, UserMembership } from '@/types/user';
import type { Business, Reward } from '@/types/business'; // Ensure Reward is imported
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  addMockPurchaseToUser: (userId: string, businessId: string, purchaseDetails: { item: string; amount: number; pointsEarned: number }) => Promise<boolean>;
  joinBusinessByCode: (businessCode: string) => Promise<{ success: boolean; message: string }>;
  getAllMockUsers: () => Promise<User[]>; 
  getBusinessById: (businessId: string) => Promise<Business | null>;
  redeemReward: (userId: string, businessId: string, reward: Reward, currentUserPointsForBusiness: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("AuthContext:EFFECT: Subscribing to onAuthStateChanged.");
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser: AuthUser | null) => {
      console.log(`AuthContext:EVENT: onAuthStateChanged triggered. Firebase UID: ${firebaseAuthUser?.uid || "null"}`);
      if (firebaseAuthUser) {
        const adminProfileRef = doc(db, 'admins', firebaseAuthUser.uid);
        try {
          const adminProfileSnap = await getDoc(adminProfileRef);
          if (adminProfileSnap.exists()) {
            console.log(`AuthContext:EVENT: Firebase user (UID: ${firebaseAuthUser.uid}) is an ADMIN. AuthContext will not set customer state.`);
            setUser(null);
            setIsAuthenticated(false);
          } else {
            console.log(`AuthContext:EVENT: Firebase user (UID: ${firebaseAuthUser.uid}) is NOT an admin. Checking 'users' collection...`);
            const userDocRef = doc(db, 'users', firebaseAuthUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              console.log(`AuthContext:EVENT: Customer profile FOUND for UID: ${firebaseAuthUser.uid}`);
              setUser({ id: firebaseAuthUser.uid, ...userDocSnap.data() } as User);
              setIsAuthenticated(true);
            } else {
              console.log(`AuthContext:EVENT: No customer profile found for UID: ${firebaseAuthUser.uid}. This user is not a customer.`);
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } catch (error) {
          console.error("AuthContext:EVENT: Error checking admin/user profile:", error);
          setUser(null);
          setIsAuthenticated(false);
          toast({ title: "Profile Check Error", description: "Could not verify user type.", variant: "destructive" });
        } finally {
          console.log("AuthContext:EVENT: Finished processing onAuthStateChanged for existing user/admin check. Setting loading to false.");
          setLoading(false);
        }
      } else {
        console.log("AuthContext:EVENT: No Firebase user (signed out). Clearing customer state.");
        setUser(null);
        setIsAuthenticated(false);
        console.log("AuthContext:EVENT: Finished processing onAuthStateChanged (no user). Setting loading to false.");
        setLoading(false);
      }
    });
    return () => {
      console.log("AuthContext:EFFECT: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, [toast]); // toast is a stable function

  const login = useCallback(async (email: string, pass: string) => {
    console.log("AuthContext:ACTION:login: Attempt for email:", email);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting user state and primary loading=false.
    } catch (error: any) {
      console.error("AuthContext:ACTION:login: Firebase signInWithEmailAndPassword failed:", error);
      let errorMessage = "Invalid email or password.";
       if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please try again.'; break;
          case 'auth/invalid-email': errorMessage = 'The email address format is not valid.'; break;
          case 'auth/too-many-requests': errorMessage = 'Access to this account has been temporarily disabled. Try again later.'; break;
          default: errorMessage = error.message || "An unexpected error occurred during login.";
        }
      }
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      setLoading(false); // Ensure loading is false if login itself fails
    }
  }, [toast]);

  const signup = useCallback(async (name: string, email: string, pass: string) => {
    console.log("AuthContext:ACTION:signup: Attempt for email:", email);
    setLoading(true);
    let fbAuthUser: AuthUser | null = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      fbAuthUser = userCredential.user;
      const newUserProfile: User = {
        id: fbAuthUser.uid,
        name,
        email: fbAuthUser.email || email,
        memberships: [],
      };
      await setDoc(doc(db, 'users', fbAuthUser.uid), newUserProfile);
      toast({ title: "Signup Successful!", description: "Welcome to ATRA!" });
      // onAuthStateChanged will handle setting state and setLoading(false).
    } catch (error: any) {
      console.error("AuthContext:ACTION:signup: FAILED:", error);
      let errorMessage = "Could not create account.";
       if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use': errorMessage = 'This email is already registered.'; break;
          case 'auth/weak-password': errorMessage = 'The password is too weak (at least 6 characters).'; break;
          case 'auth/invalid-email': errorMessage = 'The email address is not valid.'; break;
          default: errorMessage = error.message || "Auth error during signup.";
        }
      } else {
         errorMessage = error.message || "An unexpected error occurred during signup.";
      }
      toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
      if (fbAuthUser) { // If user was created in Auth but Firestore setup failed, delete Auth user
        try { await deleteFirebaseAuthUser(fbAuthUser); }
        catch (deleteError: any) { console.error("AuthContext:ACTION:signup:ROLLBACK: Failed to delete Firebase Auth user:", deleteError.message); }
      }
      setLoading(false); 
    }
  }, [toast]);

  const logout = useCallback(async () => {
    const currentCustomerEmail = user?.email;
    console.log("AuthContext:ACTION:logout: Attempt for customer:", currentCustomerEmail);
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: `Customer ${currentCustomerEmail || ''} logged out.` });
      // State will be cleared by onAuthStateChanged.
    } catch (error: any) {
      console.error("AuthContext:ACTION:logout: Failed:", error);
      toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive" });
    }
  }, [toast, user?.email]);

  const getBusinessById = useCallback(async (businessId: string): Promise<Business | null> => {
    if (!businessId) return null;
    const businessDocRef = doc(db, 'businesses', businessId);
    try {
      const businessDocSnap = await getDoc(businessDocRef);
      if (businessDocSnap.exists()) {
        return { id: businessDocSnap.id, ...businessDocSnap.data() } as Business;
      }
      return null;
    } catch (error: any) {
      toast({ title: "Error", description: `Could not fetch business details: ${error.message || 'Unknown error'}`, variant: "destructive"});
      return null;
    }
  }, [toast]);

  const addMockPurchaseToUser = useCallback(async (userId: string, businessId: string, purchaseDetails: { item: string; amount: number; pointsEarned: number }): Promise<boolean> => {
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
      } else { // User is not a member yet, but admin is adding a purchase (or user is logging past purchase for a new join)
        const businessDetails = await getBusinessById(businessId);
        if (!businessDetails) {
          toast({ title: "Error", description: "Business not found. Cannot add purchase to non-member or non-existent business.", variant: "destructive" });
          return false;
        }
        const newMembershipEntry: UserMembership = {
            businessId: businessId,
            businessName: businessDetails.name,
            pointsBalance: purchaseDetails.pointsEarned,
            purchases: [newPurchase].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
        updatedMemberships = [...(userData.memberships || []), newMembershipEntry];
      }
      await updateDoc(userDocRef, { memberships: updatedMemberships });
      // If the current user is the one being updated, refresh local state
      if (user && user.id === userId) {
         setUser(prevUser => prevUser ? ({ ...prevUser, memberships: [...updatedMemberships] }) : null);
      }
      return true;
    } catch (error: any) {
      toast({ title: "Error Adding Purchase", description: `Failed: ${error.message || 'Unknown error'}`, variant: "destructive" });
      return false;
    }
  }, [toast, user, getBusinessById]); // user dependency is for the local state update

  const joinBusinessByCode = useCallback(async (businessCode: string): Promise<{ success: boolean; message: string }> => {
    if (!user?.id) {
      return { success: false, message: "You must be logged in as a customer to join a program." };
    }
    const businessesRef = collection(db, "businesses");
    const q = query(businessesRef, where("joinCode", "==", businessCode.toUpperCase()));
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return { success: false, message: "Invalid business code." };
      
      const businessToJoinDoc = querySnapshot.docs[0];
      const businessToJoin = { id: businessToJoinDoc.id, ...businessToJoinDoc.data() } as Business;
      
      const userDocRef = doc(db, 'users', user.id);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) return { success: false, message: "User profile not found."};
      const currentUserData = userDocSnap.data() as User;

      const isAlreadyMember = currentUserData.memberships?.some(m => m.businessId === businessToJoin.id);
      if (isAlreadyMember) return { success: false, message: `You are already a member of ${businessToJoin.name}.` };

      const welcomeBonusPoints = 50;
      const newMembership: UserMembership = {
        businessId: businessToJoin.id,
        businessName: businessToJoin.name,
        pointsBalance: welcomeBonusPoints,
        purchases: [{ id: `wb-${Date.now()}`, item: "Welcome Bonus", amount: 0, date: new Date().toISOString(), pointsEarned: welcomeBonusPoints }],
      };
      
      await updateDoc(userDocRef, { 
        memberships: arrayUnion(newMembership) 
      });
      
      // Refresh local user state
      setUser(prevUser => prevUser ? ({ 
        ...prevUser, 
        memberships: [...(prevUser.memberships || []), newMembership] 
      }) : null);
      
      return { success: true, message: `Successfully joined ${businessToJoin.name} (+${welcomeBonusPoints} points)!` };
    } catch (error: any) {
      console.error("AuthContext:ACTION:joinBusinessByCode: FAILED", error);
      return { success: false, message: `Failed to join program: ${error.message || 'Unknown error'}` };
    }
  }, [user, toast]); // user dependency for user.id and local update
  
  const redeemReward = useCallback(async (userId: string, businessId: string, reward: Reward, currentUserPointsForBusiness: number): Promise<boolean> => {
    if (currentUserPointsForBusiness < reward.pointsCost) {
        toast({ title: "Insufficient Points", description: `You need ${reward.pointsCost} points to redeem ${reward.title}, but you only have ${currentUserPointsForBusiness}.`, variant: "destructive" });
        return false;
    }

    const userDocRef = doc(db, 'users', userId);
    try {
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
            toast({ title: "Error", description: "User not found.", variant: "destructive" });
            return false;
        }
        const userData = userDocSnap.data() as User;
        const membershipIndex = userData.memberships?.findIndex(m => m.businessId === businessId);

        if (membershipIndex === undefined || membershipIndex === -1 || !userData.memberships) {
            toast({ title: "Error", description: "Membership not found for this business.", variant: "destructive" });
            return false;
        }
        
        const updatedMembership = { ...userData.memberships[membershipIndex] };
        updatedMembership.pointsBalance -= reward.pointsCost;
        const redemptionPurchase: MockPurchase = {
            id: `rdm-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            item: `Redeemed: ${reward.title}`,
            amount: 0, // Redemptions don't usually have an associated monetary amount in this context
            date: new Date().toISOString(),
            pointsEarned: -reward.pointsCost, // Negative points for redemption
        };
        updatedMembership.purchases = [redemptionPurchase, ...(updatedMembership.purchases || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const updatedMemberships = [...userData.memberships];
        updatedMemberships[membershipIndex] = updatedMembership;

        await updateDoc(userDocRef, { memberships: updatedMemberships });

        // Update local state if it's the current user
        if (user && user.id === userId) {
            setUser(prev => prev ? { ...prev, memberships: updatedMemberships } : null);
        }
        
        toast({ title: "Reward Redeemed!", description: `You successfully redeemed ${reward.title}.` });
        return true;

    } catch (error: any) {
        console.error("Error redeeming reward:", error);
        toast({ title: "Redemption Failed", description: error.message || "Could not redeem reward.", variant: "destructive" });
        return false;
    }
  }, [toast, user]); // user for local state update


  const getAllMockUsers = useCallback(async (): Promise<User[]> => {
    try {
      const usersCollectionRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollectionRef);
      const usersList: User[] = [];
      querySnapshot.forEach((docSnap) => {
        usersList.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
      return usersList;
    } catch (error: any) {
      toast({ title: "Error Fetching Users", description: error.message || "Could not load user data.", variant: "destructive"});
      return [];
    }
  }, [toast]);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    signup,
    addMockPurchaseToUser,
    joinBusinessByCode,
    getAllMockUsers,
    getBusinessById,
    redeemReward
  }), [user, isAuthenticated, loading, login, logout, signup, addMockPurchaseToUser, joinBusinessByCode, getAllMockUsers, getBusinessById, redeemReward]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
