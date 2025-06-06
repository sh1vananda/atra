
"use client";

import type { AdminUser } from '@/types/admin';
import type { Business } from '@/types/business';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Helper function to generate a unique join code
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser) => {
      setLoading(true);
      if (firebaseAuthUser) {
        const adminProfileRef = doc(db, 'admins', firebaseAuthUser.uid);
        try {
          const adminProfileSnap = await getDoc(adminProfileRef);
          if (adminProfileSnap.exists()) {
            const adminProfileData = adminProfileSnap.data() as Omit<AdminUser, 'uid' | 'email'>; // Assuming email is from auth
            setAdminUser({
              uid: firebaseAuthUser.uid,
              email: firebaseAuthUser.email || '', // Email from auth user object for consistency
              businessId: adminProfileData.businessId,
            });
            setIsAdminAuthenticated(true);
            const currentPath = window.location.pathname;
            if (!currentPath.startsWith('/admin') && !['/login', '/signup'].includes(currentPath)) {
               router.push('/admin/dashboard');
            }
          } else {
            // If an admin was previously logged in but their Firestore doc is gone, log them out.
            if (adminUser && adminUser.uid === firebaseAuthUser.uid) {
              // This case might indicate an issue or cleanup, sign them out of admin context
              setAdminUser(null);
              setIsAdminAuthenticated(false);
              // Consider signing out from Firebase Auth as well if this state is unexpected
              // await signOut(auth); 
              // router.push('/login');
            }
          }
        } catch (error) {
          console.error("Error fetching admin profile:", error);
          toast({ title: "Error", description: "Could not fetch admin profile.", variant: "destructive" });
          // Potentially sign out if profile is expected but not found due to error
          setAdminUser(null);
          setIsAdminAuthenticated(false);
        }
      } else {
        setAdminUser(null);
        setIsAdminAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, adminUser]); // Added adminUser to dependency array

  const signupBusiness = async (businessName: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const adminAuthUser = userCredential.user;

      // 1. Generate unique join code
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

      // 2. Create Business Document
      const newBusinessRef = await addDoc(businessesCollectionRef, {
        name: businessName,
        description: `Welcome to ${businessName}'s loyalty program!`,
        joinCode: joinCode,
        rewards: [], // Initialize with empty rewards
        ownerUid: adminAuthUser.uid,
        createdAt: serverTimestamp(),
        // id: '', // ID will be set in the next step
      });
      const businessId = newBusinessRef.id;

      // 3. Update Business Document with its own ID
      await updateDoc(doc(db, 'businesses', businessId), { id: businessId });


      // 4. Create Admin Profile Document
      const adminProfileRef = doc(db, 'admins', adminAuthUser.uid);
      await setDoc(adminProfileRef, {
        uid: adminAuthUser.uid,
        email: email, // Use the email from function parameter for consistency with rules
        businessId: businessId,
      });

      toast({ title: "Business Registered!", description: `${businessName} is now part of ATRA.` });
      // setAdminUser({ uid: adminAuthUser.uid, email: adminAuthUser.email || '', businessId });
      // setIsAdminAuthenticated(true);
      // onAuthStateChanged will handle setting the user and redirecting
      router.push('/admin/dashboard');

    } catch (error: any) {
      console.error("Business signup failed:", error);
      let errorMessage = "Could not register business.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already in use. Please use a different email.';
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
      setLoading(false);
    }
  };


  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle fetching admin data and setting state/redirecting.
      // If onAuthStateChanged doesn't find an admin profile, it will clear the user state.
    } catch (error: any) {
      console.error("Admin login failed:", error);
      let errorMessage = "Invalid admin email or password.";
       if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // More recent Firebase SDK versions
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
      setLoading(false); 
    }
    // setLoading(false) will be called by onAuthStateChanged eventually if successful,
    // or needs to be called here on error.
  };

  const logout = async () => {
    const currentAdminEmail = adminUser?.email; // Capture before clearing
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will clear adminUser and isAdminAuthenticated
      router.push('/login');
      toast({ title: "Logged Out", description: `Admin ${currentAdminEmail || ''} logged out successfully.`});
    } catch (error: any) {
        console.error("Admin logout failed:", error);
        toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive"});
    } finally {
        setLoading(false);
    }
  };

  const getManagedBusiness = async (): Promise<Business | null> => {
    if (adminUser && adminUser.businessId) {
      setLoading(true);
      const businessDocRef = doc(db, 'businesses', adminUser.businessId);
      try {
        const businessDocSnap = await getDoc(businessDocRef);
        if (businessDocSnap.exists()) {
          return { id: businessDocSnap.id, ...businessDocSnap.data() } as Business;
        } else {
          toast({ title: "Error", description: "Managed business not found.", variant: "destructive" });
          return null;
        }
      } catch (error) {
        console.error("Error fetching managed business:", error);
        toast({ title: "Error", description: "Could not fetch business details.", variant: "destructive" });
        return null;
      } finally {
        setLoading(false);
      }
    }
    return null;
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

