
"use client";

import type { AdminUser } from '@/types/admin';
import type { Business } from '@/types/business';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User as FirebaseAuthUser } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(true); // Start true to avoid flash of non-admin content on initial load
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log("AdminAuth: Subscribing to onAuthStateChanged.");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser: FirebaseAuthUser | null) => {
      setLoading(true); // Set loading true at the start of every auth state change
      console.log("AdminAuth: onAuthStateChanged callback fired. Firebase user:", firebaseAuthUser?.uid || "null");

      if (firebaseAuthUser) {
        console.log(`AdminAuth: Firebase user ${firebaseAuthUser.uid} found. Checking Firestore 'admins' collection.`);
        const adminProfileRef = doc(db, 'admins', firebaseAuthUser.uid);
        try {
          const adminProfileSnap = await getDoc(adminProfileRef);
          if (adminProfileSnap.exists()) {
            const adminProfileData = adminProfileSnap.data() as Omit<AdminUser, 'uid' | 'email'>;
            // CRITICAL: Ensure businessId exists on the admin profile
            if (adminProfileData.businessId) {
              console.log(`AdminAuth: Admin profile found for ${firebaseAuthUser.uid} with businessId ${adminProfileData.businessId}.`);
              setAdminUser({
                uid: firebaseAuthUser.uid,
                email: firebaseAuthUser.email || adminProfileData.email || '',
                businessId: adminProfileData.businessId,
              });
              setIsAdminAuthenticated(true);
              console.log(`AdminAuth: Admin state set for ${firebaseAuthUser.uid}. Authenticated: true.`);

              const currentPath = window.location.pathname;
              if (!currentPath.startsWith('/admin') && !['/login', '/signup'].includes(currentPath)) {
                console.log("AdminAuth: Redirecting to /admin/dashboard.");
                router.push('/admin/dashboard');
              }
            } else {
              // Admin profile exists but is incomplete (missing businessId)
              console.error(`AdminAuth: Admin profile for ${firebaseAuthUser.uid} is incomplete (missing businessId). Treating as unauthenticated admin.`);
              setAdminUser(null);
              setIsAdminAuthenticated(false);
              toast({ title: "Admin Profile Incomplete", description: "Your admin profile is missing critical information (Business ID). Please contact support.", variant: "destructive" });
            }
          } else {
            console.log(`AdminAuth: No admin profile found in Firestore for ${firebaseAuthUser.uid}. This user is not an app admin.`);
            setAdminUser(null);
            setIsAdminAuthenticated(false);
            toast({ title: "Access Denied", description: "This account is not registered as a business admin.", variant: "destructive" });
          }
        } catch (error) {
          console.error("AdminAuth: Error fetching admin profile from Firestore:", error);
          toast({ title: "Profile Error", description: "Could not fetch admin profile data.", variant: "destructive" });
          setAdminUser(null);
          setIsAdminAuthenticated(false);
        } finally {
          console.log("AdminAuth: Firestore profile check complete. Setting loading to false.");
          setLoading(false);
        }
      } else {
        console.log("AdminAuth: No Firebase user. Clearing admin state.");
        setAdminUser(null);
        setIsAdminAuthenticated(false);
        setLoading(false); // Ensure loading is false when no user
      }
    });
    return () => {
      console.log("AdminAuth: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, [router, toast]); // Removed adminUser from dependency array

  const signupBusiness = async (businessName: string, email: string, pass: string) => {
    console.log("AdminAuth: signupBusiness attempt for:", email);
    setLoading(true);
    let adminAuthUser: FirebaseAuthUser | null = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      adminAuthUser = userCredential.user;
      console.log("AdminAuth: Firebase Auth user created:", adminAuthUser.uid);

      let joinCode = generateJoinCode();
      let attempts = 0;
      let codeExists = true;
      const businessesCollectionRef = collection(db, 'businesses');

      while (codeExists && attempts < 10) {
        const q = query(businessesCollectionRef, where("joinCode", "==", joinCode));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          codeExists = false;
        } else {
          joinCode = generateJoinCode();
        }
        attempts++;
      }
      if (codeExists) throw new Error("Failed to generate a unique join code after several attempts.");
      console.log("AdminAuth: Unique join code generated:", joinCode);

      let businessId = '';
      try {
        console.log("AdminAuth: Attempting to create business document in Firestore.");
        const newBusinessRef = await addDoc(businessesCollectionRef, {
            name: businessName,
            description: `Welcome to ${businessName}'s loyalty program!`,
            joinCode: joinCode,
            rewards: [],
            ownerUid: adminAuthUser.uid,
            createdAt: serverTimestamp(),
        });
        businessId = newBusinessRef.id;
        await updateDoc(doc(db, 'businesses', businessId), { id: businessId }); // Add the ID to the doc itself
        console.log("AdminAuth: Business document created/updated in Firestore with ID:", businessId);
      } catch (firestoreError: any) {
        console.error("AdminAuth: Error creating business document:", firestoreError);
        toast({ title: "Business Creation Failed", description: `Could not create the business profile: ${firestoreError.message || 'Unknown Firestore error'}. The user account might have been created. Please contact support.`, variant: "destructive" });
        // Consider attempting to delete adminAuthUser here if business creation fails, though it's complex client-side
        throw firestoreError;
      }

      try {
        console.log("AdminAuth: Attempting to create admin profile document in Firestore for UID:", adminAuthUser.uid);
        const adminProfileRef = doc(db, 'admins', adminAuthUser.uid);
        await setDoc(adminProfileRef, {
            uid: adminAuthUser.uid,
            email: email, // Use the email from function parameter, ensures consistency
            businessId: businessId,
        });
        console.log("AdminAuth: Admin profile document created in Firestore.");
      } catch (firestoreError: any) {
        console.error("AdminAuth: Error creating admin profile document:", firestoreError);
        toast({ title: "Admin Profile Creation Failed", description: `Could not link the admin account to the business: ${firestoreError.message || 'Unknown Firestore error'}. The business might have been created. Contact support.`, variant: "destructive" });
        // Potentially cleanup business doc here, or leave for manual cleanup
        throw firestoreError;
      }

      toast({ title: "Business Registered!", description: `${businessName} is now part of ATRA.` });
      // onAuthStateChanged will handle setting the user and redirecting
      // setLoading(false) will be called by onAuthStateChanged eventually
    } catch (error: any) {
      console.error("AdminAuth: Business signup failed:", error);
      let errorMessage = "Could not register business.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already in use. Please use a different email or log in.';
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
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log("AdminAuth: signupBusiness finished. Setting loading to false.");
      setLoading(false); // Crucial: ensure loading is false after signup attempt
    }
  };

  const login = async (email: string, pass: string) => {
    console.log("AdminAuth: Login attempt started for email:", email);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      console.log("AdminAuth: Firebase signInWithEmailAndPassword successful for", email);
      // onAuthStateChanged will handle fetching admin data and setting state/redirecting.
      // setLoading(false) will be called by onAuthStateChanged.
    } catch (error: any) {
      console.error("AdminAuth: Firebase signInWithEmailAndPassword failed:", error);
      let errorMessage = "Invalid admin email or password.";
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
          case 'auth/too-many-requests':
             errorMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
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
      setLoading(false); // Explicitly set loading false here on login error because onAuthStateChanged might not proceed as expected
    }
  };

  const logout = async () => {
    const currentAdminEmail = adminUser?.email; // Capture before state is cleared
    console.log("AdminAuth: Logout attempt started for admin:", currentAdminEmail);
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will clear adminUser and isAdminAuthenticated
      console.log("AdminAuth: Firebase signOut successful. Pushing to /login.");
      router.push('/login');
      toast({ title: "Logged Out", description: `Admin ${currentAdminEmail || ''} logged out successfully.`});
    } catch (error: any) {
        console.error("AdminAuth: Admin logout failed:", error);
        toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive"});
    } finally {
        console.log("AdminAuth: Logout process finished. Setting loading to false.");
        setLoading(false); // Ensure loading is false after logout attempt
    }
  };

  const getManagedBusiness = async (): Promise<Business | null> => {
    console.log("AdminAuth: getManagedBusiness called.");
    if (!adminUser || !adminUser.businessId) {
      console.warn("AdminAuth: getManagedBusiness returning null - adminUser or businessId missing. Current adminUser:", adminUser);
      if (!loading && isAdminAuthenticated) { // Only toast if we were otherwise considered authenticated
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
        toast({ title: "Error", description: "Managed business data not found in the database.", variant: "destructive" });
        return null;
      }
    } catch (error: any) {
      console.error("AdminAuth: Error fetching managed business:", error);
      toast({ title: "Fetch Error", description: `Could not fetch business details: ${error.message || 'Unknown error'}.`, variant: "destructive" });
      return null;
    }
  };

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

    