
"use client";

import type { AdminUser } from '@/types/admin';
import type { Business } from '@/types/business';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log("AdminAuth: Subscribing to onAuthStateChanged.");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser: FirebaseAuthUser | null) => {
      console.log("AdminAuth: onAuthStateChanged triggered. Firebase user UID:", firebaseAuthUser?.uid || "null");
      setLoading(true);

      if (firebaseAuthUser) {
        const adminProfileRef = doc(db, 'admins', firebaseAuthUser.uid);
        try {
          console.log(`AdminAuth: Attempting to fetch admin profile for UID: ${firebaseAuthUser.uid}`);
          const adminProfileSnap = await getDoc(adminProfileRef);

          if (adminProfileSnap.exists()) {
            const adminProfileData = adminProfileSnap.data();
            if (adminProfileData.businessId) {
              console.log(`AdminAuth: Admin profile found for ${firebaseAuthUser.uid} with businessId ${adminProfileData.businessId}.`);
              setAdminUser({
                uid: firebaseAuthUser.uid,
                email: firebaseAuthUser.email || adminProfileData.email || '',
                businessId: adminProfileData.businessId,
              });
              setIsAdminAuthenticated(true);
              console.log("AdminAuth: Admin state SET. Authenticated: true.");
              // Potential redirect logic could go here, after loading is false and auth is confirmed
              // For now, let pages handle redirects based on auth state.
            } else {
              console.warn(`AdminAuth: Admin profile for ${firebaseAuthUser.uid} exists but is MISSING businessId.`);
              setAdminUser(null);
              setIsAdminAuthenticated(false);
              toast({ title: "Admin Profile Incomplete", description: "Your admin profile is missing critical information (Business ID). Please contact support.", variant: "destructive" });
            }
          } else {
            console.log(`AdminAuth: No admin profile found in Firestore for ${firebaseAuthUser.uid}. This user is NOT an app admin.`);
            setAdminUser(null);
            setIsAdminAuthenticated(false);
            // It's possible a user authenticated with Firebase but isn't an admin for *this app*.
            // We shouldn't automatically sign them out here if they just tried to log into the wrong portal.
            // The UI should prevent access to admin areas.
          }
        } catch (error) {
          console.error("AdminAuth: Error fetching admin profile from Firestore:", error);
          setAdminUser(null);
          setIsAdminAuthenticated(false);
          toast({ title: "Profile Error", description: "Could not fetch admin profile data. Please try again.", variant: "destructive" });
        } finally {
          console.log("AdminAuth: Firestore profile check complete for onAuthStateChanged. Setting loading to false.");
          setLoading(false);
        }
      } else {
        console.log("AdminAuth: No Firebase user (signed out). Clearing admin state.");
        setAdminUser(null);
        setIsAdminAuthenticated(false);
        setLoading(false);
      }
    });
    return () => {
      console.log("AdminAuth: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, [router, toast]); // router, toast are stable.

  const signupBusiness = async (businessName: string, email: string, pass: string) => {
    console.log("AdminAuth: signupBusiness attempt for email:", email);
    setLoading(true);
    let adminAuthUser: FirebaseAuthUser | null = null;
    let newBusinessId: string | null = null;

    try {
      // Step 1: Create Firebase Auth user
      console.log("AdminAuth: Creating Firebase Auth user...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      adminAuthUser = userCredential.user;
      console.log("AdminAuth: Firebase Auth user created:", adminAuthUser.uid);

      // Step 2: Create Business Document in Firestore
      console.log("AdminAuth: Creating business document in Firestore...");
      let joinCode = generateJoinCode();
      let attempts = 0;
      let codeExists = true;
      const businessesCollectionRef = collection(db, 'businesses');
      while (codeExists && attempts < 10) {
        const q = query(businessesCollectionRef, where("joinCode", "==", joinCode));
        const querySnapshot = await getDocs(q);
        codeExists = !querySnapshot.empty;
        if (codeExists) joinCode = generateJoinCode();
        attempts++;
      }
      if (codeExists) throw new Error("Failed to generate a unique join code after several attempts.");
      console.log("AdminAuth: Unique join code generated:", joinCode);
      
      const businessData = {
        name: businessName,
        description: `Welcome to ${businessName}'s loyalty program!`,
        joinCode: joinCode,
        rewards: [],
        ownerUid: adminAuthUser.uid,
        createdAt: serverTimestamp(),
      };
      const newBusinessRef = await addDoc(businessesCollectionRef, businessData);
      newBusinessId = newBusinessRef.id;
      await updateDoc(doc(db, 'businesses', newBusinessId), { id: newBusinessId });
      console.log("AdminAuth: Business document created/updated in Firestore with ID:", newBusinessId);

      // Step 3: Create Admin Profile Document in Firestore
      console.log("AdminAuth: Creating admin profile document in Firestore...");
      const adminProfileData = {
        uid: adminAuthUser.uid,
        email: email, 
        businessId: newBusinessId,
      };
      await setDoc(doc(db, 'admins', adminAuthUser.uid), adminProfileData);
      console.log("AdminAuth: Admin profile document created in Firestore for UID:", adminAuthUser.uid);

      toast({ title: "Business Registered!", description: `${businessName} is now part of ATRA. You will be logged in.` });
      // onAuthStateChanged will handle setting the user, isAdminAuthenticated.
      // The page might redirect based on isAdminAuthenticated and loading state.
      router.push('/admin/dashboard'); // Explicit redirect after successful signup

    } catch (error: any) {
      console.error("AdminAuth: Business signup FAILED:", error);
      let errorMessage = "Could not register business.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use': errorMessage = 'This email is already in use. Please use a different email or log in.'; break;
          case 'auth/weak-password': errorMessage = 'The password is too weak. Please choose a stronger password.'; break;
          case 'auth/invalid-email': errorMessage = 'The email address is not valid.'; break;
          default: errorMessage = error.message || "An unexpected error occurred during signup's Auth phase.";
        }
      } else if (error.message) {
        errorMessage = error.message; // For custom errors or Firestore errors
      }
      toast({ title: "Registration Failed", description: errorMessage, variant: "destructive" });

      // Rollback efforts
      if (adminAuthUser) {
        console.log("AdminAuth: Attempting to roll back Firebase Auth user creation for UID:", adminAuthUser.uid);
        try {
          await deleteUser(adminAuthUser);
          console.log("AdminAuth: Firebase Auth user deleted successfully during rollback.");
        } catch (deleteAuthError: any) {
          console.error("AdminAuth: Failed to delete Firebase Auth user during rollback:", deleteAuthError.message);
          toast({ title: "Cleanup Issue", description: `Failed to cleanup partially created Auth account: ${deleteAuthError.message}. Please contact support.`, variant: "destructive" });
        }
      }
      if (newBusinessId) {
         console.log("AdminAuth: Attempting to roll back business document creation for ID:", newBusinessId);
         try {
            await deleteDoc(doc(db, 'businesses', newBusinessId));
            console.log("AdminAuth: Business document deleted successfully during rollback.");
         } catch (deleteBusinessError: any) {
            console.error("AdminAuth: Failed to delete business document during rollback:", deleteBusinessError.message);
         }
      }
    } finally {
      console.log("AdminAuth: signupBusiness finished.");
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    console.log("AdminAuth: Login attempt started for email:", email);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      console.log("AdminAuth: Firebase signInWithEmailAndPassword successful for", email);
      // onAuthStateChanged will handle fetching admin data, setting state.
      // It will also set loading to false.
      // A redirect can happen here if desired, or let onAuthStateChanged handle it via page logic
      router.push('/admin/dashboard'); 
    } catch (error: any) {
      console.error("AdminAuth: Firebase signInWithEmailAndPassword failed:", error);
      let errorMessage = "Invalid admin email or password.";
       if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please try again.'; break;
          case 'auth/invalid-email': errorMessage = 'The email address format is not valid.'; break;
          case 'auth/too-many-requests': errorMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. Try again later.'; break;
          default: errorMessage = error.message || "An unexpected error occurred during login.";
        }
      }
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      setLoading(false); 
    }
  };

  const logout = async () => {
    const currentAdminEmail = adminUser?.email;
    console.log("AdminAuth: Logout attempt started for admin:", currentAdminEmail);
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will clear adminUser and isAdminAuthenticated, and set loading to false.
      console.log("AdminAuth: Firebase signOut successful. Pushing to /login.");
      router.push('/login'); 
      toast({ title: "Logged Out", description: `Admin ${currentAdminEmail || ''} logged out successfully.`});
    } catch (error: any) {
        console.error("AdminAuth: Admin logout failed:", error);
        toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive"});
        setLoading(false); // Ensure loading is false on logout error
    }
    // No finally setLoading(false) here; onAuthStateChanged handles it for success.
  };

  const getManagedBusiness = useCallback(async (): Promise<Business | null> => {
    console.log("AdminAuth: getManagedBusiness called. Current adminUser:", adminUser);
    if (!adminUser || !adminUser.businessId) {
      console.warn("AdminAuth: getManagedBusiness returning null - adminUser or businessId missing.");
      // Avoid toasting if still loading or not authenticated, as this might be a normal state.
      if (!loading && isAdminAuthenticated) { 
         toast({ title: "Data Error", description: "Admin user details incomplete or business ID missing.", variant: "destructive" });
      }
      return null;
    }
    
    console.log(`AdminAuth: Fetching business details for businessId: ${adminUser.businessId}`);
    const businessDocRef = doc(db, 'businesses', adminUser.businessId);
    try {
      const businessDocSnap = await getDoc(businessDocRef);
      if (businessDocSnap.exists()) {
        console.log("AdminAuth: Managed business data found:", businessDocSnap.id);
        return { id: businessDocSnap.id, ...businessDocSnap.data() } as Business;
      } else {
        console.warn("AdminAuth: Managed business data not found in Firestore for ID:", adminUser.businessId);
        toast({ title: "Error", description: "Managed business data not found in the database. The business may have been deleted.", variant: "destructive" });
        return null;
      }
    } catch (error: any) {
      console.error("AdminAuth: Error fetching managed business:", error);
      toast({ title: "Fetch Error", description: `Could not fetch business details: ${error.message || 'Unknown error'}.`, variant: "destructive" });
      return null;
    }
  }, [adminUser, toast, loading, isAdminAuthenticated]);

  return (
    <AdminAuthContext.Provider value={{ adminUser, isAdminAuthenticated, loading, login, logout, signupBusiness, getManagedBusiness }}>
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

