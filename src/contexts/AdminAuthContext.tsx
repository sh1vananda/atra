
"use client";

import type { AdminUser } from '@/types/admin';
import type { Business } from '@/types/business';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
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
        const adminProfileSnap = await getDoc(adminProfileRef);

        if (adminProfileSnap.exists()) {
          const adminProfileData = adminProfileSnap.data() as Omit<AdminUser, 'uid' | 'email'>;
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
          if (adminUser && adminUser.uid === firebaseAuthUser.uid) {
            setAdminUser(null);
            setIsAdminAuthenticated(false);
          }
        }
      } else {
        setAdminUser(null);
        setIsAdminAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, adminUser]);

  const signupBusiness = async (businessName: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const adminAuthUser = userCredential.user;

      let joinCode = generateJoinCode();
      let attempts = 0;
      let codeExists = true;
      const businessesCollectionRef = collection(db, 'businesses'); // Define once

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
      if (codeExists) throw new Error("Failed to generate a unique join code.");


      const newBusinessRef = await addDoc(businessesCollectionRef, {
        name: businessName,
        description: `Welcome to ${businessName}'s loyalty program!`,
        joinCode: joinCode,
        rewards: [],
        ownerUid: adminAuthUser.uid,
        createdAt: serverTimestamp(),
        id: '', // Will be updated post-creation
      });
      const businessId = newBusinessRef.id;
      await setDoc(doc(db, 'businesses', businessId), { id: businessId }, { merge: true });

      const adminProfileRef = doc(db, 'admins', adminAuthUser.uid);
      // Use the 'email' parameter from the function input for the Firestore document
      // This ensures the email string used for auth is the one being stored and checked by rules.
      await setDoc(adminProfileRef, {
        uid: adminAuthUser.uid,
        email: email, // Changed from adminAuthUser.email to email (function parameter)
        businessId: businessId,
      });

      toast({ title: "Business Registered!", description: `${businessName} is now part of ATRA.` });
      setAdminUser({ uid: adminAuthUser.uid, email: adminAuthUser.email || '', businessId });
      setIsAdminAuthenticated(true);
      router.push('/admin/dashboard');

    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Could not register business.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };


  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting adminUser if valid admin and redirecting.
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid admin email or password.",
        variant: "destructive",
      });
      setLoading(false); // Ensure loading is false on error
    }
    // setLoading(false) will be called by onAuthStateChanged eventually
  };

  const logout = async () => {
    const currentAdminEmail = adminUser?.email;
    setLoading(true);
    try {
      await signOut(auth);
      setAdminUser(null);
      setIsAdminAuthenticated(false);
      router.push('/login');
      toast({ title: "Logged Out", description: `Admin ${currentAdminEmail || ''} logged out successfully.`});
    } catch (error: any) {
        toast({ title: "Logout Failed", description: error.message, variant: "destructive"});
    } finally {
        setLoading(false);
    }
  };

  const getManagedBusiness = async (): Promise<Business | null> => {
    if (adminUser && adminUser.businessId) {
      const businessDocRef = doc(db, 'businesses', adminUser.businessId);
      const businessDocSnap = await getDoc(businessDocRef);
      if (businessDocSnap.exists()) {
        return { id: businessDocSnap.id, ...businessDocSnap.data() } as Business;
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
