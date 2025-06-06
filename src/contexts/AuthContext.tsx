
"use client";

import type { User as AuthUser } from 'firebase/auth'; // Firebase Auth user type
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, deleteUser as deleteFirebaseAuthUser } from 'firebase/auth'; // Renamed deleteUser to avoid conflict
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
// import { useRouter } from 'next/navigation'; // Not used directly for redirection here
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

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
  const [loading, setLoading] = useState(true); // Start true for initial auth check
  // const router = useRouter(); // Not used directly for redirection here
  const { toast } = useToast();

  useEffect(() => {
    console.log("AuthContext:EFFECT: Subscribing to onAuthStateChanged.");
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log("AuthContext:EVENT: onAuthStateChanged triggered. Firebase user UID:", fbUser?.uid || "null");
      if (fbUser) {
        const adminProfileRef = doc(db, 'admins', fbUser.uid);
        let isLikelyAdmin = false;
        try {
          const adminProfileSnap = await getDoc(adminProfileRef);
          if (adminProfileSnap.exists()) {
            console.log("AuthContext:EVENT: Firebase user (UID:", fbUser.uid, ") has an admin profile. This user will NOT be treated as a customer in this context.");
            isLikelyAdmin = true;
            setUser(null);
            setFirebaseUser(fbUser);
            setIsAuthenticated(false); 
          }
        } catch (error) {
           console.error("AuthContext:EVENT: Error checking for admin profile:", error);
        }
        
        if (!isLikelyAdmin) {
          console.log("AuthContext:EVENT: Firebase user (UID:", fbUser.uid, ") is NOT an admin. Checking 'users' collection...");
          setFirebaseUser(fbUser);
          const userDocRef = doc(db, 'users', fbUser.uid);
          try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              console.log("AuthContext:EVENT: User profile FOUND for UID:", fbUser.uid);
              setUser({ id: fbUser.uid, ...userDocSnap.data() } as User);
              setIsAuthenticated(true);
            } else {
              console.log("AuthContext:EVENT: No user profile found for UID:", fbUser.uid);
              setUser(null); 
              setIsAuthenticated(false);
            }
          } catch (error) {
            console.error("AuthContext:EVENT: Error fetching user profile from Firestore:", error);
            setUser(null); 
            setIsAuthenticated(false);
            toast({ title: "Error", description: "Could not fetch user profile.", variant: "destructive" });
          }
        }
      } else {
        console.log("AuthContext:EVENT: No Firebase user (signed out). Clearing customer state.");
        setFirebaseUser(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      console.log("AuthContext:EVENT: Finished processing. Setting loading to false.");
      setLoading(false);
    });

    return () => {
      console.log("AuthContext:EFFECT: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, [toast]);

  const login = useCallback(async (email: string, pass: string) => {
    console.log("AuthContext:ACTION:login: Attempt for email:", email);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
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
          default: errorMessage = error.message || "An unexpected error occurred during login.";
        }
      }
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      setLoading(false); 
    }
  }, [toast]);

  const signup = useCallback(async (name: string, email: string, pass: string) => {
    console.log("AuthContext:ACTION:signup: Attempt for email:", email);
    setLoading(true);
    let fbAuthUser: AuthUser | null = null; // Renamed to avoid conflict with state variable
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      fbAuthUser = userCredential.user;
      console.log("AuthContext:ACTION:signup: Firebase Auth user created:", fbAuthUser.uid);
      const newUserProfile: User = {
        id: fbAuthUser.uid,
        name,
        email: fbAuthUser.email || email,
        memberships: [],
      };
      await setDoc(doc(db, 'users', fbAuthUser.uid), newUserProfile);
      console.log("AuthContext:ACTION:signup: User profile document created in Firestore for UID:", fbAuthUser.uid);
      toast({ title: "Signup Successful!", description: "Welcome to ATRA!"});
    } catch (error: any) {
      console.error("AuthContext:ACTION:signup: FAILED:", error);
      let errorMessage = "Could not create account.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use': errorMessage = 'This email is already registered.'; break;
          case 'auth/weak-password': errorMessage = 'The password is too weak.'; break;
          case 'auth/invalid-email': errorMessage = 'The email address is not valid.'; break;
          default: errorMessage = error.message || "Auth error during signup.";
        }
      } else {
        errorMessage = error.message || "An unexpected error occurred during signup.";
      }
      toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });

      if (fbAuthUser) {
        console.log("AuthContext:ACTION:signup:ROLLBACK: Attempting to delete Firebase Auth user (UID:", fbAuthUser.uid, ")");
        try {
          await deleteFirebaseAuthUser(fbAuthUser); 
          console.log("AuthContext:ACTION:signup:ROLLBACK: Firebase Auth user deleted successfully.");
        } catch (deleteAuthError: any) {
          console.error("AuthContext:ACTION:signup:ROLLBACK: Failed to delete Firebase Auth user:", deleteAuthError.message);
          toast({ title: "Partial Signup Cleanup Issue", description: `Account for ${email} partially created. Error: ${deleteAuthError.message}`, variant: "destructive", duration: 7000 });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async () => {
    const currentCustomerEmail = user?.email;
    console.log("AuthContext:ACTION:logout: Attempt for customer:", currentCustomerEmail);
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: `Customer ${currentCustomerEmail || ''} logged out successfully.`});
    } catch (error: any)      {
      console.error("AuthContext:ACTION:logout: Failed:", error);
      toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive" });
      setLoading(false); 
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
      console.warn(`AuthContext:WARN: Business with ID ${businessId} not found.`);
      return null;
    } catch (error: any) {
      console.error(`AuthContext:ERROR: Fetching business ${businessId}:`, error);
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

      if (user && user.id === userId) {
         setUser(prevUser => prevUser ? ({ ...prevUser, memberships: [...updatedMemberships] }) : null);
      }
      toast({ title: "Purchase Added", description: `Purchase recorded for user.`, variant: "default" });
      return true;

    } catch (error: any) {
      console.error("AuthContext:ACTION:addMockPurchaseToUser: Error adding purchase:", error);
      toast({ title: "Error Adding Purchase", description: `Failed: ${error.message || 'Unknown error'}`, variant: "destructive" });
      return false;
    }
  }, [toast, user, getBusinessById]); 

  const joinBusinessByCode = useCallback(async (businessCode: string): Promise<{ success: boolean; message: string }> => {
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
      const isAlreadyMember = user.memberships?.some(m => m.businessId === businessToJoin.id);
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
      
      const updatedMemberships = [...(user.memberships || []), newMembership];
      await updateDoc(userDocRef, { memberships: updatedMemberships });
      
      setUser(prevUser => prevUser ? ({ ...prevUser, memberships: [...updatedMemberships] }) : null);
      
      return { success: true, message: `Successfully joined ${businessToJoin.name} (+${welcomeBonusPoints} points)!` };

    } catch (error: any) {
      console.error("AuthContext:ACTION:joinBusinessByCode: Error:", error);
      return { success: false, message: `Failed to join program: ${error.message || 'Unknown error'}` };
    }
  }, [firebaseUser, user, toast]); 
  
  const getAllMockUsers = useCallback(async (): Promise<User[]> => {
    console.log("AuthContext:ACTION:getAllMockUsers: Fetching all users.");
    try {
      const usersCollectionRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollectionRef);
      const usersList: User[] = [];
      querySnapshot.forEach((docSnap) => {
        usersList.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
      console.log(`AuthContext:ACTION:getAllMockUsers: Fetched ${usersList.length} users.`);
      return usersList;
    } catch (error: any) {
      console.error("AuthContext:ACTION:getAllMockUsers: Error fetching all users:", error);
      toast({
          title: "Error Fetching Users",
          description: error.message || "Could not load user data.",
          variant: "destructive",
      });
      return [];
    } finally {
      console.log("AuthContext:ACTION:getAllMockUsers: Finished.");
    }
  }, [toast]);

  const contextValue = useMemo(() => ({
    user,
    firebaseUser,
    isAuthenticated,
    loading,
    login,
    logout,
    signup,
    addMockPurchaseToUser,
    joinBusinessByCode,
    getAllMockUsers,
    getBusinessById
  }), [user, firebaseUser, isAuthenticated, loading, login, logout, signup, addMockPurchaseToUser, joinBusinessByCode, getAllMockUsers, getBusinessById]);


  return (
    <AuthContext.Provider value={contextValue}>
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
