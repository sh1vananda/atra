
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseAdminAuthUser) => {
      if (firebaseAdminAuthUser) {
        // Check if this user is in our 'admins' collection
        const adminProfileRef = doc(db, 'admins', firebaseAdminAuthUser.uid);
        const adminProfileSnap = await getDoc(adminProfileRef);

        if (adminProfileSnap.exists()) {
          const adminProfileData = adminProfileSnap.data() as Omit<AdminUser, 'uid' | 'email'>; // email from auth
          setAdminUser({
            uid: firebaseAdminAuthUser.uid,
            email: firebaseAdminAuthUser.email || '',
            businessId: adminProfileData.businessId,
          });
          setIsAdminAuthenticated(true);
        } else {
          // This auth user is not a registered admin in our system
          // Potentially sign them out or handle as an error
          await signOut(auth); // Ensure non-admins are logged out
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
  }, []);

  const signupBusiness = async (businessName: string, email: string, pass: string) => {
    setLoading(true);
    try {
      // 1. Create Firebase Auth user for the admin
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const adminAuthUser = userCredential.user;

      // 2. Generate a unique join code (ensure it's actually unique)
      let joinCode = generateJoinCode();
      let attempts = 0;
      let codeExists = true;
      while (codeExists && attempts < 10) {
        const q = query(collection(db, "businesses"), where("joinCode", "==", joinCode));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          codeExists = false;
        } else {
          joinCode = generateJoinCode(); // Regenerate if exists
        }
        attempts++;
      }
      if (codeExists) throw new Error("Failed to generate a unique join code.");


      // 3. Create the business document in Firestore
      const businessCollectionRef = collection(db, 'businesses');
      const newBusinessRef = await addDoc(businessCollectionRef, {
        name: businessName,
        description: `Welcome to ${businessName}'s loyalty program!`, // Default description
        joinCode: joinCode,
        rewards: [], // Start with no rewards
        ownerUid: adminAuthUser.uid,
        createdAt: serverTimestamp(),
      });
      const businessId = newBusinessRef.id;
      // Update business doc with its own ID for convenience
      await setDoc(doc(db, 'businesses', businessId), { id: businessId }, { merge: true });


      // 4. Create the admin user profile in Firestore
      const adminProfileRef = doc(db, 'admins', adminAuthUser.uid);
      await setDoc(adminProfileRef, {
        uid: adminAuthUser.uid,
        email: adminAuthUser.email,
        businessId: businessId,
      });
      
      // Auth state change will pick up the new admin
      toast({ title: "Business Registered!", description: `${businessName} is now part of Loyalty Leap.` });
      router.push('/admin/dashboard');

    } catch (error: any) {
      console.error("Business signup failed:", error);
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
      // onAuthStateChanged will handle setting adminUser if valid admin
      // It will also push to dashboard if admin is valid
      // If not a valid admin, onAuthStateChanged will clear user and auth status
      // router.push('/admin/dashboard'); // This push is now handled by onAuthStateChanged logic effectively
    } catch (error: any) {
      console.error("Admin login failed:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid admin email or password.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push('/login'); // Redirect to general login page
    } catch (error: any) {
        console.error("Admin logout failed:", error);
        toast({ title: "Logout Failed", description: error.message, variant: "destructive"});
    } finally {
        setAdminUser(null);
        setIsAdminAuthenticated(false);
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
