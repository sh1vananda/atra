
"use client";

import type { AdminUser } from '@/types/admin';
import type { Business, Reward } from '@/types/business';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User as FirebaseAuthUser, deleteUser as deleteFirebaseAuthUser } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const generateJoinCode = (length = 6): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  signupBusiness: (businessName: string, email: string, pass: string) => Promise<{success: boolean; message?: string}>;
  getManagedBusiness: () => Promise<Business | null>;
  addRewardToBusiness: (businessId: string, rewardData: Omit<Reward, 'id'>) => Promise<boolean>;
  updateRewardInBusiness: (businessId: string, updatedReward: Reward) => Promise<boolean>;
  deleteRewardFromBusiness: (businessId: string, rewardId: string) => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("AdminAuthContext:EFFECT: Subscribing to onAuthStateChanged.");
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser: FirebaseAuthUser | null) => {
      console.log(`AdminAuthContext:EVENT: onAuthStateChanged triggered. Firebase UID: ${firebaseAuthUser?.uid || "null"}`);
      if (firebaseAuthUser) {
        const adminProfileRef = doc(db, 'admins', firebaseAuthUser.uid);
        try {
          const adminProfileSnap = await getDoc(adminProfileRef);
          if (adminProfileSnap.exists()) {
            const adminProfileData = adminProfileSnap.data() as Omit<AdminUser, 'uid'>;
            if (adminProfileData.businessId && typeof adminProfileData.businessId === 'string') {
              console.log(`AdminAuthContext:EVENT: Admin profile FOUND for UID: ${firebaseAuthUser.uid} with businessId: ${adminProfileData.businessId}`);
              setAdminUser({
                uid: firebaseAuthUser.uid,
                email: firebaseAuthUser.email || '', // Ensure email is always a string
                businessId: adminProfileData.businessId,
              });
              setIsAdminAuthenticated(true);
            } else {
              console.warn(`AdminAuthContext:EVENT: Admin profile for ${firebaseAuthUser.uid} MISSING or has invalid businessId. Clearing admin state.`);
              setAdminUser(null);
              setIsAdminAuthenticated(false);
            }
          } else {
            console.log(`AdminAuthContext:EVENT: No admin profile found for UID: ${firebaseAuthUser.uid}. This user is NOT an app admin.`);
            setAdminUser(null);
            setIsAdminAuthenticated(false);
          }
        } catch (error) {
          console.error("AdminAuthContext:EVENT: Error fetching admin profile:", error);
          setAdminUser(null);
          setIsAdminAuthenticated(false);
          toast({ title: "Profile Error", description: "Could not fetch admin profile data.", variant: "destructive" });
        } finally {
          console.log("AdminAuthContext:EVENT: Finished processing onAuthStateChanged for existing user. Setting loading to false.");
          setLoading(false);
        }
      } else {
        console.log("AdminAuthContext:EVENT: No Firebase user (signed out). Clearing admin state.");
        setAdminUser(null);
        setIsAdminAuthenticated(false);
        console.log("AdminAuthContext:EVENT: Finished processing onAuthStateChanged (no user). Setting loading to false.");
        setLoading(false);
      }
    });
    return () => {
      console.log("AdminAuthContext:EFFECT: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, [toast]); // toast is a stable function from useToast, safe dependency

  const login = useCallback(async (email: string, pass: string) => {
    console.log("AdminAuthContext:ACTION:login: Attempt for email:", email);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      console.log(`AdminAuthContext:ACTION:login: Firebase signInWithEmailAndPassword successful for ${email}. onAuthStateChanged will handle state.`);
      // onAuthStateChanged will set loading to false after processing
    } catch (error: any) {
      console.error("AdminAuthContext:ACTION:login: Firebase signInWithEmailAndPassword failed:", error);
      let errorMessage = "Invalid admin email or password.";
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

  const signupBusiness = useCallback(async (businessName: string, email: string, pass: string): Promise<{success: boolean; message?: string}> => {
    console.log("AdminAuthContext:ACTION:signupBusiness attempt for email:", email);
    setLoading(true);
    let fbAdminAuthUser: FirebaseAuthUser | null = null;
    let newBusinessId: string | null = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      fbAdminAuthUser = userCredential.user;

      let joinCode = generateJoinCode();
      let attempts = 0;
      const businessesColRef = collection(db, 'businesses');
      while (attempts < 10) { // Prevent infinite loop if code generation is flawed
        const q = query(businessesColRef, where("joinCode", "==", joinCode));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) break;
        joinCode = generateJoinCode();
        attempts++;
      }
      if (attempts >= 10) throw new Error("Failed to generate a unique join code after multiple attempts.");

      const businessDocRef = await addDoc(businessesColRef, {
        name: businessName,
        description: `Welcome to ${businessName}'s loyalty program!`,
        joinCode: joinCode,
        rewards: [], 
        ownerUid: fbAdminAuthUser.uid,
        createdAt: serverTimestamp(),
        // id: businessDocRef.id // This is done in the next step
      });
      newBusinessId = businessDocRef.id;
      // Set the document ID as a field within the document
      await updateDoc(doc(db, 'businesses', newBusinessId), { id: newBusinessId });

      // Create admin profile linking to this business
      await setDoc(doc(db, 'admins', fbAdminAuthUser.uid), {
        email: fbAdminAuthUser.email || email, // Ensure email is always a string
        businessId: newBusinessId,
      });
      
      toast({ title: "Business Registered!", description: `${businessName} is now part of ATRA.` });
      // onAuthStateChanged will set loading to false.
      return { success: true };
    } catch (error: any) {
      console.error("AdminAuthContext:ACTION:signupBusiness: FAILED:", error);
      let errorMessage = "Could not register business.";
       if (error.code) { 
        switch (error.code) {
          case 'auth/email-already-in-use': errorMessage = 'This email is already in use.'; break;
          case 'auth/weak-password': errorMessage = 'Password is too weak (min 6 chars).'; break;
          case 'auth/invalid-email': errorMessage = 'The email address is not valid.'; break;
          default: errorMessage = error.message || "Auth error during signup.";
        }
      } else { 
         errorMessage = error.message || "Unexpected error during registration.";
      }
      toast({ title: "Registration Failed", description: errorMessage, variant: "destructive" });

      // Rollback: Delete created Firebase Auth user and business document if they exist
      if (fbAdminAuthUser) {
        if (newBusinessId) {
          try { await deleteDoc(doc(db, 'businesses', newBusinessId)); }
          catch (e) { console.error("AdminAuthContext:ROLLBACK: Failed to delete business doc:", e); }
        }
        try { await deleteFirebaseAuthUser(fbAdminAuthUser); } // Delete the Firebase Auth user
        catch (e) { console.error("AdminAuthContext:ROLLBACK: Failed to delete Auth user:", e); }
      }
      setLoading(false);
      return { success: false, message: errorMessage };
    }
  }, [toast]);

  const logout = useCallback(async () => {
    const currentAdminEmail = adminUser?.email;
    console.log("AdminAuthContext:ACTION:logout: Attempt for admin:", currentAdminEmail);
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: `Admin ${currentAdminEmail || ''} logged out successfully.`});
      // State will be cleared by onAuthStateChanged, which also sets loading = false.
    } catch (error: any) {
      console.error("AdminAuthContext:ACTION:logout: Failed:", error);
      toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive"});
    }
  }, [toast, adminUser?.email]);

  const getManagedBusiness = useCallback(async (): Promise<Business | null> => {
    console.log(`AdminAuthContext:ACTION:getManagedBusiness called. adminUser:`, adminUser);
    if (!adminUser?.businessId) {
      console.warn("AdminAuthContext:getManagedBusiness: No businessId found on adminUser or adminUser is null.");
      // Avoid toasting here if it's just part of an initial load sequence where adminUser might not be set yet.
      // Toasting can be done by the component if the final state is problematic.
      return null;
    }
    console.log(`AdminAuthContext:ACTION:getManagedBusiness: Fetching business: ${adminUser.businessId}`);
    const businessDocRef = doc(db, 'businesses', adminUser.businessId);
    try {
      const businessDocSnap = await getDoc(businessDocRef);
      if (businessDocSnap.exists()) {
        console.log(`AdminAuthContext:ACTION:getManagedBusiness: Business data FOUND: ${adminUser.businessId}`);
        return { id: businessDocSnap.id, ...businessDocSnap.data() } as Business;
      }
      console.warn(`AdminAuthContext:ACTION:getManagedBusiness: Business document ${adminUser.businessId} does not exist.`);
      toast({ title: "Error", description: "Managed business data not found in database.", variant: "destructive" });
      return null;
    } catch (error: any) {
      console.error(`AdminAuthContext:ACTION:getManagedBusiness: Error fetching business ${adminUser.businessId}:`, error);
      toast({ title: "Fetch Error", description: `Could not fetch business details: ${error.message || 'Unknown error'}.`, variant: "destructive" });
      return null;
    }
  }, [adminUser?.businessId, adminUser?.uid, toast]); // Depend on specific parts of adminUser

  const addRewardToBusiness = useCallback(async (businessId: string, rewardData: Omit<Reward, 'id'>): Promise<boolean> => {
    if (!businessId) {
        toast({ title: "Error", description: "Business ID is missing.", variant: "destructive" });
        return false;
    }
    const businessDocRef = doc(db, 'businesses', businessId);
    try {
        const businessSnap = await getDoc(businessDocRef);
        if (!businessSnap.exists()) {
            toast({ title: "Error", description: "Business not found.", variant: "destructive" });
            return false;
        }
        const businessData = businessSnap.data() as Business;
        // Generate a unique ID for the new reward
        const newRewardId = doc(collection(db, '_placeholder_ids_')).id; 
        const newReward: Reward = {
            id: newRewardId, // Assign the generated ID
            ...rewardData
        };
        const updatedRewards = [...(businessData.rewards || []), newReward];
        await updateDoc(businessDocRef, { rewards: updatedRewards });
        toast({ title: "Reward Added", description: `${rewardData.title} has been added successfully.`});
        return true;
    } catch (error: any) {
        console.error("Error adding reward:", error);
        toast({ title: "Error Adding Reward", description: error.message || "Could not add reward.", variant: "destructive" });
        return false;
    }
  }, [toast]);

  const updateRewardInBusiness = useCallback(async (businessId: string, updatedReward: Reward): Promise<boolean> => {
    if (!businessId || !updatedReward.id) {
        toast({ title: "Error", description: "Business ID or Reward ID is missing for update.", variant: "destructive" });
        return false;
    }
    const businessDocRef = doc(db, 'businesses', businessId);
    try {
        const businessSnap = await getDoc(businessDocRef);
        if (!businessSnap.exists()) {
            toast({ title: "Error", description: "Business not found.", variant: "destructive" });
            return false;
        }
        const businessData = businessSnap.data() as Business;
        const rewardIndex = (businessData.rewards || []).findIndex(r => r.id === updatedReward.id);
        if (rewardIndex === -1) {
            toast({ title: "Error", description: "Reward not found to update.", variant: "destructive" });
            return false;
        }
        const updatedRewardsList = [...(businessData.rewards || [])];
        updatedRewardsList[rewardIndex] = updatedReward;
        
        await updateDoc(businessDocRef, { rewards: updatedRewardsList });
        toast({ title: "Reward Updated", description: `${updatedReward.title} has been updated successfully.`});
        return true;
    } catch (error: any) {
        console.error("Error updating reward:", error);
        toast({ title: "Error Updating Reward", description: error.message || "Could not update reward.", variant: "destructive" });
        return false;
    }
  }, [toast]);

  const deleteRewardFromBusiness = useCallback(async (businessId: string, rewardId: string): Promise<boolean> => {
    if (!businessId || !rewardId) {
        toast({ title: "Error", description: "Business ID or Reward ID is missing for deletion.", variant: "destructive" });
        return false;
    }
    const businessDocRef = doc(db, 'businesses', businessId);
    try {
        const businessSnap = await getDoc(businessDocRef);
        if (!businessSnap.exists()) {
            toast({ title: "Error", description: "Business not found.", variant: "destructive" });
            return false;
        }
        const businessData = businessSnap.data() as Business;
        const updatedRewardsList = (businessData.rewards || []).filter(r => r.id !== rewardId);
        
        await updateDoc(businessDocRef, { rewards: updatedRewardsList });
        toast({ title: "Reward Deleted", description: `The reward has been deleted successfully.`});
        return true;
    } catch (error: any) {
        console.error("Error deleting reward:", error);
        toast({ title: "Error Deleting Reward", description: error.message || "Could not delete reward.", variant: "destructive" });
        return false;
    }
  }, [toast]);


  const contextValue = useMemo(() => ({
    adminUser,
    isAdminAuthenticated,
    loading,
    login,
    logout,
    signupBusiness,
    getManagedBusiness,
    addRewardToBusiness,
    updateRewardInBusiness,
    deleteRewardFromBusiness,
  }), [adminUser, isAdminAuthenticated, loading, login, logout, signupBusiness, getManagedBusiness, addRewardToBusiness, updateRewardInBusiness, deleteRewardFromBusiness]);

  return <AdminAuthContext.Provider value={contextValue}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return context;
};
