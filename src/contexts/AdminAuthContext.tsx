
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
            email: firebaseAuthUser.email || '',
            businessId: adminProfileData.businessId,
          });
          setIsAdminAuthenticated(true);
          // Only redirect if they are on a page that *isn't* already an admin page
          // or the login page (to prevent redirect loops)
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/admin') && currentPath !== '/login' && currentPath !== '/signup') {
             router.push('/admin/dashboard');
          }
        } else {
          // This auth user exists but is not in 'admins' collection.
          // If they are on an admin route, they should be signed out from this context.
          // If they are elsewhere, this onAuthStateChanged might be for the customer context.
          // This logic helps ensure only "admins" collection users are treated as admin here.
          if (adminUser && adminUser.uid === firebaseAuthUser.uid) { // Check if it's the same user we thought was admin
            setAdminUser(null);
            setIsAdminAuthenticated(false);
            // No automatic signOut(auth) here as it might interfere with customer sessions.
            // Route protection in AdminLayout/pages should handle unauthorized access.
          }
        }
      } else {
        setAdminUser(null);
        setIsAdminAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, adminUser]); // Added router and adminUser to dependency array

  const signupBusiness = async (businessName: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const adminAuthUser = userCredential.user;

      let joinCode = generateJoinCode();
      let attempts = 0;
      let codeExists = true;
      while (codeExists && attempts < 10) {
        const q = query(collection(db, "businesses"), where("joinCode", "==", joinCode));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          codeExists = false;
        } else {
          joinCode = generateJoinCode(); 
        }
        attempts++;
      }
      if (codeExists) throw new Error("Failed to generate a unique join code.");


      const businessCollectionRef = collection(db, 'businesses');
      const newBusinessRef = await addDoc(businessCollectionRef, {
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
      await setDoc(adminProfileRef, {
        uid: adminAuthUser.uid,
        email: adminAuthUser.email,
        businessId: businessId,
      });
      
      toast({ title: "Business Registered!", description: `${businessName} is now part of ATRA.` });
      // onAuthStateChanged will handle setting the admin user and redirecting
      // Setting admin user explicitly here for immediate UI update before onAuthStateChanged potentially fires
      setAdminUser({ uid: adminAuthUser.uid, email: adminAuthUser.email || '', businessId });
      setIsAdminAuthenticated(true);
      router.push('/admin/dashboard');

    } catch (error: any) {
      // console.error("Business signup failed:", error);
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
      // router.push('/admin/dashboard'); // Let onAuthStateChanged handle redirection logic
    } catch (error: any) {
      // console.error("Admin login failed:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid admin email or password.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const logout = async () => {
    const currentAdminEmail = adminUser?.email;
    setLoading(true);
    try {
      await signOut(auth);
      // Clear local state immediately
      setAdminUser(null);
      setIsAdminAuthenticated(false);
      router.push('/login'); 
      toast({ title: "Logged Out", description: `Admin ${currentAdminEmail || ''} logged out successfully.`});
    } catch (error: any) {
        // console.error("Admin logout failed:", error);
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
