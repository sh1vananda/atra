
"use client";

import type { AdminUser } from '@/types/admin';
import type { Business } from '@/types/business';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User as FirebaseAuthUser, deleteUser } from 'firebase/auth';
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
  logout: () => void;
  signupBusiness: (businessName: string, email: string, pass: string) => Promise<void>;
  getManagedBusiness: () => Promise<Business | null>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // adminAuthLoading
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log("AdminAuth:EFFECT: Subscribing to onAuthStateChanged.");
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser: FirebaseAuthUser | null) => {
      console.log("AdminAuth:EVENT: onAuthStateChanged triggered. Firebase user UID:", firebaseAuthUser?.uid || "null");
      if (firebaseAuthUser) {
        const adminProfileRef = doc(db, 'admins', firebaseAuthUser.uid);
        console.log(`AdminAuth:EVENT: Firebase user exists (UID: ${firebaseAuthUser.uid}). Checking Firestore 'admins' collection...`);
        try {
          const adminProfileSnap = await getDoc(adminProfileRef);
          if (adminProfileSnap.exists()) {
            const adminProfileData = adminProfileSnap.data() as Omit<AdminUser, 'uid'> & { uid?: string, businessId?: string, email?: string };
            console.log(`AdminAuth:EVENT: Admin profile FOUND for UID: ${firebaseAuthUser.uid}`, adminProfileData);

            if (adminProfileData.businessId && typeof adminProfileData.businessId === 'string') {
              console.log(`AdminAuth:EVENT: Admin profile HAS businessId: ${adminProfileData.businessId}. Setting admin state.`);
              setAdminUser({
                uid: firebaseAuthUser.uid,
                email: firebaseAuthUser.email || adminProfileData.email || '',
                businessId: adminProfileData.businessId,
              });
              setIsAdminAuthenticated(true);
            } else {
              console.warn(`AdminAuth:EVENT: Admin profile for ${firebaseAuthUser.uid} MISSING or has invalid businessId. Clearing admin state.`);
              setAdminUser(null);
              setIsAdminAuthenticated(false);
              toast({ title: "Admin Profile Incomplete", description: "Your admin profile is missing critical information (Business ID). Please contact support.", variant: "destructive" });
            }
          } else {
            console.log(`AdminAuth:EVENT: No admin profile found in Firestore for ${firebaseAuthUser.uid}. This user is NOT an app admin. Clearing admin state.`);
            setAdminUser(null);
            setIsAdminAuthenticated(false);
          }
        } catch (error) {
          console.error("AdminAuth:EVENT: Error fetching admin profile from Firestore:", error);
          setAdminUser(null);
          setIsAdminAuthenticated(false);
          toast({ title: "Profile Error", description: "Could not fetch admin profile data.", variant: "destructive" });
        } finally {
          console.log("AdminAuth:EVENT: Firestore profile check complete. Setting loading to false.");
          setLoading(false);
        }
      } else {
        console.log("AdminAuth:EVENT: No Firebase user (signed out). Clearing admin state and setting loading to false.");
        setAdminUser(null);
        setIsAdminAuthenticated(false);
        setLoading(false);
      }
    });
    return () => {
      console.log("AdminAuth:EFFECT: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, [toast]);

  const login = useCallback(async (email: string, pass: string) => {
    console.log("AdminAuth:ACTION:login: Attempt for email:", email);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      console.log("AdminAuth:ACTION:login: Firebase signInWithEmailAndPassword successful for", email);
      // onAuthStateChanged will handle setting user state and loading. UI will handle redirect.
    } catch (error: any) {
      console.error("AdminAuth:ACTION:login: Firebase signInWithEmailAndPassword failed:", error);
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
      setAdminUser(null);
      setIsAdminAuthenticated(false);
    } finally {
        setLoading(false); // Ensure loading is false after attempt
    }
  }, [toast]);

  const signupBusiness = useCallback(async (businessName: string, email: string, pass: string) => {
    console.log("AdminAuth:ACTION:signupBusiness attempt for email:", email);
    setLoading(true);
    let adminAuthUser: FirebaseAuthUser | null = null;
    let newBusinessRefId: string | null = null;

    try {
      console.log("AdminAuth:ACTION:signupBusiness: Creating Firebase Auth user...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      adminAuthUser = userCredential.user;
      console.log("AdminAuth:ACTION:signupBusiness: Firebase Auth user created:", adminAuthUser.uid);

      let joinCode = generateJoinCode();
      let attempts = 0;
      let codeExists = true;
      const businessesCollectionRef = collection(db, 'businesses');
      while (codeExists && attempts < 10) {
        const q = query(businessesCollectionRef, where("joinCode", "==", joinCode));
        const querySnapshot = await getDocs(q);
        codeExists = !querySnapshot.empty;
        if (codeExists) { 
            console.log(`AdminAuth:ACTION:signupBusiness: Join code ${joinCode} exists, generating new one.`);
            joinCode = generateJoinCode(); 
        }
        attempts++;
      }
      if (codeExists) throw new Error("Failed to generate a unique join code after 10 attempts.");
      console.log(`AdminAuth:ACTION:signupBusiness: Unique join code generated: ${joinCode}`);
      
      const businessData = {
        name: businessName,
        description: `Welcome to ${businessName}'s loyalty program!`,
        joinCode: joinCode,
        rewards: [],
        ownerUid: adminAuthUser.uid,
        createdAt: serverTimestamp(),
        id: '' 
      };
      const tempNewBusinessRef = await addDoc(businessesCollectionRef, businessData);
      newBusinessRefId = tempNewBusinessRef.id;
      await updateDoc(doc(db, 'businesses', newBusinessRefId), { id: newBusinessRefId });
      console.log("AdminAuth:ACTION:signupBusiness: Business document created:", newBusinessRefId);

      const adminProfileData = {
        email: email, // Storing email here as well
        businessId: newBusinessRefId,
      };
      await setDoc(doc(db, 'admins', adminAuthUser.uid), adminProfileData);
      console.log("AdminAuth:ACTION:signupBusiness: Admin profile document created for UID:", adminAuthUser.uid);
      
      toast({ title: "Business Registered!", description: `${businessName} is now part of ATRA.` });
      console.log("AdminAuth:ACTION:signupBusiness: Signup fully successful.");
      // onAuthStateChanged will handle setting the admin state. UI handles redirect.
    } catch (error: any) {
      console.error("AdminAuth:ACTION:signupBusiness: FAILED:", error);
      let errorMessage = "Could not register business.";
       if (error.code) { 
        switch (error.code) {
          case 'auth/email-already-in-use': errorMessage = 'This email is already in use by another account.'; break;
          case 'auth/weak-password': errorMessage = 'The password is too weak. Please use at least 6 characters.'; break;
          case 'auth/invalid-email': errorMessage = 'The email address is not valid.'; break;
          default: errorMessage = error.message || "An authentication error occurred during signup.";
        }
      } else { 
         errorMessage = error.message || "An unexpected error occurred during registration.";
      }
      toast({ title: "Registration Failed", description: errorMessage, variant: "destructive" });

      if (adminAuthUser) {
        if (newBusinessRefId) {
          console.log("AdminAuth:ROLLBACK: Deleting business doc:", newBusinessRefId);
          try { await deleteDoc(doc(db, 'businesses', newBusinessRefId)); } 
          catch (e) { console.error("AdminAuth:ROLLBACK: Failed to delete business doc:", e); }
        }
        console.log("AdminAuth:ROLLBACK: Deleting Auth user:", adminAuthUser.uid);
        try { await deleteUser(adminAuthUser); } 
        catch (e) { 
          console.error("AdminAuth:ROLLBACK: Failed to delete Auth user:", e);
          toast({ title: "Account Cleanup Issue", description: `The user account for ${email} might still exist. Error: ${ (e as Error).message }`, variant: "destructive", duration: 10000 });
        }
      }
    } finally {
      console.log("AdminAuth:ACTION:signupBusiness: Finished.");
      setLoading(false); 
    }
  }, [toast]);

  const logout = useCallback(async () => {
    const currentAdminEmail = adminUser?.email;
    console.log("AdminAuth:ACTION:logout: Attempt for admin:", currentAdminEmail);
    setLoading(true);
    try {
      await signOut(auth);
      console.log("AdminAuth:ACTION:logout: Firebase signOut successful.");
      toast({ title: "Logged Out", description: `Admin ${currentAdminEmail || ''} logged out.`});
    } catch (error: any) {
      console.error("AdminAuth:ACTION:logout: Failed:", error);
      toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive"});
    } finally {
      // onAuthStateChanged will clear user state and set loading to false.
    }
  }, [toast, adminUser?.email]);

  const getManagedBusiness = useCallback(async (): Promise<Business | null> => {
    const currentAdminUid = adminUser?.uid;
    const currentBusinessId = adminUser?.businessId;

    // This check is now more critical because dependencies for this useCallback are minimal.
    if (!currentAdminUid || !currentBusinessId) {
      console.warn("AdminAuth:getManagedBusiness: Aborting - adminUser UID or businessId missing. AdminUser:", adminUser);
      // Avoid toasting if context itself is still loading or user isn't meant to be authenticated yet.
      // The calling component (AdminDashboardPage) should handle UI for missing business data.
      return null;
    }
    
    console.log(`AdminAuth:getManagedBusiness: Fetching business: ${currentBusinessId} for admin UID: ${currentAdminUid}`);
    const businessDocRef = doc(db, 'businesses', currentBusinessId);
    try {
      const businessDocSnap = await getDoc(businessDocRef);
      if (businessDocSnap.exists()) {
        console.log("AdminAuth:getManagedBusiness: Business data FOUND:", businessDocSnap.id);
        return { id: businessDocSnap.id, ...businessDocSnap.data() } as Business;
      } else {
        console.warn("AdminAuth:getManagedBusiness: Business data NOT FOUND for ID:", currentBusinessId);
        // Toasting here might be too frequent if called in a loop. Let dashboard handle UI.
        return null;
      }
    } catch (error: any) {
      console.error("AdminAuth:getManagedBusiness: Error fetching business:", error);
      toast({ title: "Fetch Error", description: `Could not fetch business details: ${error.message || 'Unknown error'}.`, variant: "destructive" });
      return null;
    }
  }, [adminUser?.uid, adminUser?.businessId, toast]);


  const contextValue = useMemo(() => ({
    adminUser,
    isAdminAuthenticated,
    loading,
    login,
    logout,
    signupBusiness,
    getManagedBusiness
  }), [adminUser, isAdminAuthenticated, loading, login, logout, signupBusiness, getManagedBusiness]);

  return (
    <AdminAuthContext.Provider value={contextValue}>
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
    
