
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
  loading: boolean; // Renamed from adminAuthLoading for clarity within this context
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  signupBusiness: (businessName: string, email: string, pass: string) => Promise<void>;
  getManagedBusiness: () => Promise<Business | null>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // True by default for initial auth check
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log("AdminAuth:EFFECT: Subscribing to onAuthStateChanged.");
    setLoading(true); // Ensure loading is true when subscription starts or re-evaluates
    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser: FirebaseAuthUser | null) => {
      console.log("AdminAuth:EVENT: onAuthStateChanged triggered. Firebase user UID:", firebaseAuthUser?.uid || "null");
      
      if (firebaseAuthUser) {
        const adminProfileRef = doc(db, 'admins', firebaseAuthUser.uid);
        console.log(`AdminAuth:EVENT: Firebase user exists (UID: ${firebaseAuthUser.uid}). Checking Firestore 'admins' collection...`);
        try {
          const adminProfileSnap = await getDoc(adminProfileRef);
          if (adminProfileSnap.exists()) {
            const adminProfileData = adminProfileSnap.data();
            console.log(`AdminAuth:EVENT: Admin profile FOUND for UID: ${firebaseAuthUser.uid}`, adminProfileData);
            if (adminProfileData.businessId && typeof adminProfileData.businessId === 'string') {
              console.log(`AdminAuth:EVENT: Admin profile HAS businessId: ${adminProfileData.businessId}. Setting admin state.`);
              setAdminUser({
                uid: firebaseAuthUser.uid,
                email: firebaseAuthUser.email || adminProfileData.email || '', // Prefer fresh email from auth user
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
            // Optional: toast if a user somehow authenticated via Firebase but has no admin doc.
            // This could happen if signup failed midway.
          }
        } catch (error) {
          console.error("AdminAuth:EVENT: Error fetching admin profile from Firestore:", error);
          setAdminUser(null);
          setIsAdminAuthenticated(false);
          toast({ title: "Profile Error", description: "Could not fetch admin profile data. Please try again.", variant: "destructive" });
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
  }, [toast]); // router and toast are stable dependencies

  const signupBusiness = async (businessName: string, email: string, pass: string) => {
    console.log("AdminAuth:ACTION: signupBusiness attempt for email:", email);
    setLoading(true);
    let adminAuthUser: FirebaseAuthUser | null = null;
    let newBusinessId: string | null = null;
    let adminProfileCreated = false;

    try {
      console.log("AdminAuth:ACTION:signupBusiness: Creating Firebase Auth user...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      adminAuthUser = userCredential.user;
      console.log("AdminAuth:ACTION:signupBusiness: Firebase Auth user created:", adminAuthUser.uid);

      console.log("AdminAuth:ACTION:signupBusiness: Creating business document in Firestore...");
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
      console.log("AdminAuth:ACTION:signupBusiness: Unique join code generated:", joinCode);
      
      const businessData = {
        name: businessName,
        description: `Welcome to ${businessName}'s loyalty program!`,
        joinCode: joinCode,
        rewards: [], // Initialize with empty rewards
        ownerUid: adminAuthUser.uid,
        createdAt: serverTimestamp(),
      };
      const newBusinessRef = await addDoc(businessesCollectionRef, businessData);
      newBusinessId = newBusinessRef.id;
      await updateDoc(doc(db, 'businesses', newBusinessId), { id: newBusinessId });
      console.log("AdminAuth:ACTION:signupBusiness: Business document created/updated in Firestore with ID:", newBusinessId);

      console.log("AdminAuth:ACTION:signupBusiness: Creating admin profile document in Firestore...");
      const adminProfileData = {
        uid: adminAuthUser.uid,
        email: email, 
        businessId: newBusinessId,
      };
      await setDoc(doc(db, 'admins', adminAuthUser.uid), adminProfileData);
      adminProfileCreated = true;
      console.log("AdminAuth:ACTION:signupBusiness: Admin profile document created in Firestore for UID:", adminAuthUser.uid);

      toast({ title: "Business Registered!", description: `${businessName} is now part of ATRA. You will be logged in shortly.` });
      // onAuthStateChanged will handle setting the user, isAdminAuthenticated.
      // No explicit redirect here; let the UI components react to auth state changes.
      // router.push('/admin/dashboard'); // Removed
      console.log("AdminAuth:ACTION:signupBusiness: Signup fully successful.");

    } catch (error: any) {
      console.error("AdminAuth:ACTION:signupBusiness: FAILED:", error);
      let errorMessage = "Could not register business.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use': errorMessage = 'This email is already in use. Please use a different email or log in.'; break;
          case 'auth/weak-password': errorMessage = 'The password is too weak. Please choose a stronger password.'; break;
          case 'auth/invalid-email': errorMessage = 'The email address is not valid.'; break;
          default: errorMessage = error.message || "An unexpected error occurred during signup's Auth phase.";
        }
      } else if (error.message) {
        errorMessage = error.message;
        if (adminAuthUser && !newBusinessId) {
          errorMessage = `Auth user created, but failed to create business document: ${error.message}`;
        } else if (adminAuthUser && newBusinessId && !adminProfileCreated) {
          errorMessage = `Auth user and business doc created, but failed to create admin profile: ${error.message}`;
        }
      }
      toast({ title: "Registration Failed", description: errorMessage, variant: "destructive" });

      if (adminAuthUser) {
        if (newBusinessId && !adminProfileCreated) {
          console.log("AdminAuth:ACTION:signupBusiness:ROLLBACK: Attempting to delete business document (ID:", newBusinessId, ") due to admin profile creation failure.");
          try {
            await deleteDoc(doc(db, 'businesses', newBusinessId));
            console.log("AdminAuth:ACTION:signupBusiness:ROLLBACK: Business document deleted successfully.");
          } catch (deleteBusinessError: any) {
            console.error("AdminAuth:ACTION:signupBusiness:ROLLBACK: Failed to delete business document:", deleteBusinessError.message);
            toast({ title: "Cleanup Issue", description: `Business doc for ${businessName} might be orphaned. Error: ${deleteBusinessError.message}`, variant: "destructive", duration: 7000 });
          }
        }
        console.log("AdminAuth:ACTION:signupBusiness:ROLLBACK: Attempting to delete Firebase Auth user (UID:", adminAuthUser.uid, ") due to overall signup failure.");
        try {
          await deleteUser(adminAuthUser);
          console.log("AdminAuth:ACTION:signupBusiness:ROLLBACK: Firebase Auth user deleted successfully.");
        } catch (deleteAuthError: any) {
          console.error("AdminAuth:ACTION:signupBusiness:ROLLBACK: Failed to delete Firebase Auth user. Manual deletion might be needed in Firebase console.", deleteAuthError.message);
          toast({ title: "Partial Signup Cleanup Issue", description: `An account was partially created for ${email}. If you see this email in Firebase Auth console, please delete it manually. Error: ${deleteAuthError.message}`, variant: "destructive", duration: 10000 });
        }
      }
    } finally {
      console.log("AdminAuth:ACTION:signupBusiness: Finished. Setting loading to false.");
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    console.log("AdminAuth:ACTION:login: Attempt for email:", email);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      console.log("AdminAuth:ACTION:login: Firebase signInWithEmailAndPassword successful for", email);
      // onAuthStateChanged will handle fetching admin data and setting further state.
      // No explicit redirect here. Let UI components react.
      // router.push('/admin/dashboard'); // Removed
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
          case 'auth/too-many-requests': errorMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. You can reset your password or try again later.'; break;
          default: errorMessage = error.message || "An unexpected error occurred during login.";
        }
      }
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      setLoading(false); // Explicitly set loading false on login failure
    }
    // setLoading(false) will be handled by onAuthStateChanged after successful login or by catch block on failure
  };

  const logout = async () => {
    const currentAdminEmail = adminUser?.email;
    console.log("AdminAuth:ACTION:logout: Attempt for admin:", currentAdminEmail);
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will clear adminUser and isAdminAuthenticated, and set loading to false.
      console.log("AdminAuth:ACTION:logout: Firebase signOut successful. Redirecting to /login via UI reaction.");
      router.push('/login'); // Explicit redirect on logout is fine
      toast({ title: "Logged Out", description: `Admin ${currentAdminEmail || ''} logged out successfully.`});
    } catch (error: any) {
      console.error("AdminAuth:ACTION:logout: Failed:", error);
      toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive"});
    } finally {
      console.log("AdminAuth:ACTION:logout: Finished.");
      // setLoading(false) will be handled by onAuthStateChanged
    }
  };

  const getManagedBusiness = useCallback(async (): Promise<Business | null> => {
    console.log("AdminAuth:ACTION:getManagedBusiness called. Current loading state (context):", loading, "isAdminAuthenticated:", isAdminAuthenticated, "AdminUser Exists:", !!adminUser);
    if (!adminUser || !adminUser.businessId) {
      console.warn("AdminAuth:ACTION:getManagedBusiness: Returning null - adminUser or businessId missing.");
      if (!loading && isAdminAuthenticated) {
         toast({ title: "Data Error", description: "Admin user details incomplete or business ID missing.", variant: "destructive" });
      }
      return null;
    }
    
    console.log(`AdminAuth:ACTION:getManagedBusiness: Fetching business details for businessId: ${adminUser.businessId}`);
    const businessDocRef = doc(db, 'businesses', adminUser.businessId);
    try {
      const businessDocSnap = await getDoc(businessDocRef);
      if (businessDocSnap.exists()) {
        console.log("AdminAuth:ACTION:getManagedBusiness: Managed business data FOUND:", businessDocSnap.id);
        return { id: businessDocSnap.id, ...businessDocSnap.data() } as Business;
      } else {
        console.warn("AdminAuth:ACTION:getManagedBusiness: Managed business data NOT FOUND in Firestore for ID:", adminUser.businessId);
        toast({ title: "Error", description: "Managed business data not found. The business may have been deleted or there's an issue with your admin profile.", variant: "destructive" });
        return null;
      }
    } catch (error: any) {
      console.error("AdminAuth:ACTION:getManagedBusiness: Error fetching managed business:", error);
      toast({ title: "Fetch Error", description: `Could not fetch business details: ${error.message || 'Unknown error'}.`, variant: "destructive" });
      return null;
    }
  }, [adminUser, toast, loading, isAdminAuthenticated]); // Added loading, isAdminAuthenticated dependencies

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
