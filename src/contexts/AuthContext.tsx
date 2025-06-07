
"use client";

import type { User as AuthUser } from 'firebase/auth';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, deleteUser as deleteFirebaseAuthUser } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, query, where, arrayUnion, addDoc, serverTimestamp } from 'firebase/firestore';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User, MockPurchase, UserMembership } from '@/types/user';
import type { Business, Reward } from '@/types/business';
import type { PurchaseAppeal } from '@/types/appeal';
import { useToast } from '@/hooks/use-toast';

interface SubmitAppealData {
  businessId: string;
  businessName: string;
  item: string;
  amount: number;
  pointsExpected: number;
  appealReason: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  submitPurchaseAppeal: (appealData: SubmitAppealData) => Promise<boolean>;
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
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false); // Admin user, not a customer
          } else {
            const userDocRef = doc(db, 'users', firebaseAuthUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setUser({ id: firebaseAuthUser.uid, ...userDocSnap.data() } as User);
              setIsAuthenticated(true);
            } else {
              // User exists in Firebase Auth but not in 'users' collection (edge case, e.g., partial signup)
              setUser(null);
              setIsAuthenticated(false);
            }
            setLoading(false);
          }
        } catch (error) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          toast({ title: "Profile Check Error", description: "Could not verify user type during auth state change.", variant: "destructive" });
        }
      } else {
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
      // onAuthStateChanged will handle setting user and loading states
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
      setLoading(false); // Ensure loading is false on login failure
    }
    // No setLoading(false) here on success, onAuthStateChanged handles it
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
      toast({ title: "Signup Successful!", description: "Welcome to Keeva!", variant: "default" });
      // onAuthStateChanged will set user and loading state
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
        catch (deleteError: any) { /* Silently ignore delete error */ }
      }
      setLoading(false); // Ensure loading is false on signup failure
    }
    // No setLoading(false) here on success, onAuthStateChanged handles it
  }, [toast]);

  const logout = useCallback(async () => {
    const currentCustomerEmail = user?.email;
    try {
      await signOut(auth);
      // onAuthStateChanged will set user to null and loading to false
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

  const submitPurchaseAppeal = useCallback(async (appealData: SubmitAppealData): Promise<boolean> => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be logged in to submit an appeal.", variant: "destructive" });
      return false;
    }
    const appealsCollectionRef = collection(db, 'purchaseAppeals');
    try {
      const newAppealPayload: Omit<PurchaseAppeal, 'id' | 'submittedAt' | 'reviewedAt' | 'adminReviewedBy' | 'rejectionReason'> = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email || '',
        businessId: appealData.businessId,
        businessName: appealData.businessName,
        item: appealData.item,
        amount: appealData.amount,
        pointsExpected: appealData.pointsExpected,
        appealReason: appealData.appealReason,
        status: 'pending',
      };
      await addDoc(appealsCollectionRef, {
        ...newAppealPayload,
        submittedAt: serverTimestamp(),
      });
      return true;
    } catch (error: any) {
      toast({ title: "Appeal Submission Failed", description: error.message || "Could not submit your appeal.", variant: "destructive" });
      return false;
    }
  }, [user, toast]);

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
      const userDocSnap = await getDoc(userDocRef); // Re-fetch user fresh to avoid race conditions
      if (!userDocSnap.exists()) return { success: false, message: "User profile not found."};
      const currentUserData = userDocSnap.data() as User;

      const isAlreadyMember = currentUserData.memberships?.some(m => m.businessId === businessToJoin.id);
      if (isAlreadyMember) return { success: false, message: `You are already a member of ${businessToJoin.name}.` };

      const welcomeBonusPoints = 50;
      const newMembership: UserMembership = {
        businessId: businessToJoin.id,
        businessName: businessToJoin.name,
        pointsBalance: welcomeBonusPoints,
        purchases: [{
          id: `wb-${Date.now()}`,
          item: "Welcome Bonus",
          amount: 0,
          date: new Date().toISOString(),
          pointsEarned: welcomeBonusPoints,
          status: 'approved'
        }],
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
        const userDocSnap = await getDoc(userDocRef); // Fetch fresh user data
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
            status: 'approved',
        };
        updatedMembership.purchases = [redemptionPurchase, ...(updatedMembership.purchases || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const updatedMemberships = [...userData.memberships];
        updatedMemberships[membershipIndex] = updatedMembership;

        await updateDoc(userDocRef, { memberships: updatedMemberships });

        setUser(prev => prev && prev.id === userId ? { ...prev, memberships: updatedMemberships } : prev);

        return true;
    } catch (error: any) {
        toast({ title: "Redemption Failed", description: error.message || "Could not redeem reward.", variant: "destructive" });
        return false;
    }
  }, [toast]);


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
    submitPurchaseAppeal,
    joinBusinessByCode,
    getAllMockUsers,
    getBusinessById,
    redeemReward
  }), [user, isAuthenticated, loading, login, logout, signup, submitPurchaseAppeal, joinBusinessByCode, getAllMockUsers, getBusinessById, redeemReward]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
