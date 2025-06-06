
"use client";

import type { User as AuthUser } from 'firebase/auth';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, deleteUser as deleteFirebaseAuthUser } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, query, where, arrayUnion } from 'firebase/firestore';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User, MockPurchase, UserMembership } from '@/types/user';
import type { Business, Reward } from '@/types/business';
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
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser: AuthUser | null) => {
      if (firebaseAuthUser) {
        const adminProfileRef = doc(db, 'admins', firebaseAuthUser.uid);
        try {
          const adminProfileSnap = await getDoc(adminProfileRef);
          if (adminProfileSnap.exists()) {
            // This Firebase user is an admin, clear customer state
            setUser(null);
            setIsAuthenticated(false);
          } else {
            // Not an admin, check if they are a regular user
            const userDocRef = doc(db, 'users', firebaseAuthUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setUser({ id: firebaseAuthUser.uid, ...userDocSnap.data() } as User);
              setIsAuthenticated(true);
            } else {
              // No customer profile found for this Firebase user
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } catch (error) {
          setUser(null);
          setIsAuthenticated(false);
          toast({ title: "Profile Check Error", description: "Could not verify user type.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      } else {
        // No Firebase user (signed out)
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [toast]); // toast is stable

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting user state and primary loading=false.
    } catch (error: any) {
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
      setLoading(false); 
    }
  }, [toast]);

  const signup = useCallback(async (name: string, email: string, pass: string) => {
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
      toast({ title: "Signup Successful!", description: "Welcome to ATRA!", variant: "default" });
    } catch (error: any) {
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
      if (fbAuthUser) { 
        try { await deleteFirebaseAuthUser(fbAuthUser); }
        catch (deleteError: any) { /* empty */ }
      }
      setLoading(false); 
    }
  }, [toast]);

  const logout = useCallback(async () => {
    const currentCustomerEmail = user?.email;
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: `Customer ${currentCustomerEmail || ''} logged out.` });
    } catch (error: any) {
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
      } else { 
        const businessDetails = await getBusinessById(businessId);
        if (!businessDetails) {
          toast({ title: "Error", description: "Business not found. Cannot add purchase.", variant: "destructive" });
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
      if (user && user.id === userId) {
         setUser(prevUser => prevUser ? ({ ...prevUser, memberships: [...updatedMemberships] }) : null);
      }
      return true;
    } catch (error: any) {
      toast({ title: "Error Adding Purchase", description: `Failed: ${error.message || 'Unknown error'}`, variant: "destructive" });
      return false;
    }
  }, [toast, user, getBusinessById]);

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
      
      setUser(prevUser => prevUser ? ({ 
        ...prevUser, 
        memberships: [...(prevUser.memberships || []), newMembership] 
      }) : null);
      
      return { success: true, message: `Successfully joined ${businessToJoin.name} (+${welcomeBonusPoints} points)!` };
    } catch (error: any) {
      return { success: false, message: `Failed to join program: ${error.message || 'Unknown error'}` };
    }
  }, [user, toast]);
  
  const redeemReward = useCallback(async (userId: string, businessId: string, reward: Reward, currentUserPointsForBusiness: number): Promise<boolean> => {
    if (currentUserPointsForBusiness < reward.pointsCost) {
        toast({ title: "Insufficient Points", description: `You need ${reward.pointsCost} points, but only have ${currentUserPointsForBusiness}.`, variant: "destructive" });
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
        updatedMembership.pointsBalance = (updatedMembership.pointsBalance || 0) - reward.pointsCost;
        const redemptionPurchase: MockPurchase = {
            id: `rdm-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            item: `Redeemed: ${reward.title}`,
            amount: 0,
            date: new Date().toISOString(),
            pointsEarned: -reward.pointsCost,
        };
        updatedMembership.purchases = [redemptionPurchase, ...(updatedMembership.purchases || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const updatedMemberships = [...userData.memberships];
        updatedMemberships[membershipIndex] = updatedMembership;

        await updateDoc(userDocRef, { memberships: updatedMemberships });

        if (user && user.id === userId) {
            setUser(prev => prev ? { ...prev, memberships: updatedMemberships } : null);
        }
        
        // Success toast is handled by RewardCard to include the CheckCircle icon
        return true;

    } catch (error: any) {
        toast({ title: "Redemption Failed", description: error.message || "Could not redeem reward.", variant: "destructive" });
        return false;
    }
  }, [toast, user]);


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
