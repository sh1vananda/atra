
"use client";

import type { AdminUser } from '@/types/admin';
import type { Business, Reward } from '@/types/business';
import type { PurchaseAppeal } from '@/types/appeal';
import type { User, UserMembership, MockPurchase } from '@/types/user';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User as FirebaseAuthUser, deleteUser as deleteFirebaseAuthUser } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc, writeBatch, orderBy } from 'firebase/firestore';
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
  getPendingPurchaseAppeals: (businessId: string) => Promise<PurchaseAppeal[]>;
  approvePurchaseAppeal: (appealId: string, pointsToAward: number, itemDetails: {item: string, amount: number, userId: string, businessId: string}) => Promise<boolean>;
  rejectPurchaseAppeal: (appealId: string, rejectionReason: string, itemDetails: {item: string, amount: number, userId: string, businessId: string}) => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser: FirebaseAuthUser | null) => {
      if (firebaseAuthUser) {
        const adminProfileRef = doc(db, 'admins', firebaseAuthUser.uid);
        try {
          const adminProfileSnap = await getDoc(adminProfileRef);
          if (adminProfileSnap.exists()) {
            const adminProfileData = adminProfileSnap.data() as Omit<AdminUser, 'uid'>;
            if (adminProfileData.businessId && typeof adminProfileData.businessId === 'string') {
              setAdminUser({
                uid: firebaseAuthUser.uid,
                email: firebaseAuthUser.email || '',
                businessId: adminProfileData.businessId,
              });
              setIsAdminAuthenticated(true);
            } else {
              setAdminUser(null);
              setIsAdminAuthenticated(false);
            }
          } else {
            setAdminUser(null);
            setIsAdminAuthenticated(false);
          }
        } catch (error) {
          console.error("AdminAuthContext onAuthStateChanged error:", error);
          setAdminUser(null);
          setIsAdminAuthenticated(false);
          toast({ title: "Profile Error", description: "Could not fetch admin profile.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      } else {
        setAdminUser(null);
        setIsAdminAuthenticated(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [toast]);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;

      const adminDocRef = doc(db, 'admins', fbUser.uid);
      const adminDocSnap = await getDoc(adminDocRef);
      if (!adminDocSnap.exists()) {
        await signOut(auth);
        toast({
          title: "Login Mismatch",
          description: "This account is not registered as a business admin. Please use the Customer login or register your business.",
          variant: "destructive",
        });
        setAdminUser(null);
        setIsAdminAuthenticated(false);
        setLoading(false);
        return;
      }
      // If successful and it's an admin, onAuthStateChanged will set adminUser & isAdminAuthenticated.
      // setLoading(false) will be handled by onAuthStateChanged.
    } catch (error: any) {
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
      setLoading(false);
    }
  }, [toast]);

  const signupBusiness = useCallback(async (businessName: string, email: string, pass: string): Promise<{success: boolean; message?: string}> => {
    setLoading(true);
    let fbAdminAuthUser: FirebaseAuthUser | null = null;
    let newBusinessId: string | null = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      fbAdminAuthUser = userCredential.user;

      let joinCode = generateJoinCode();
      let attempts = 0;
      const businessesColRef = collection(db, 'businesses');
      while (attempts < 10) {
        const q = query(businessesColRef, where("joinCode", "==", joinCode));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) break;
        joinCode = generateJoinCode();
        attempts++;
      }
      if (attempts >= 10) throw new Error("Failed to generate a unique join code.");

      const businessDocRef = await addDoc(businessesColRef, {
        name: businessName,
        description: `Welcome to ${businessName}'s loyalty program!`,
        joinCode: joinCode,
        rewards: [],
        ownerUid: fbAdminAuthUser.uid,
        createdAt: serverTimestamp(),
      });
      newBusinessId = businessDocRef.id;
      await updateDoc(doc(db, 'businesses', newBusinessId), { id: newBusinessId });

      await setDoc(doc(db, 'admins', fbAdminAuthUser.uid), {
        email: fbAdminAuthUser.email || email,
        businessId: newBusinessId,
      });

      toast({ title: "Business Registered!", description: `${businessName} is now part of ATRA.`, variant: "default" });
      // onAuthStateChanged will set adminUser and loading state
      return { success: true };
    } catch (error: any) {
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

      if (fbAdminAuthUser) {
        if (newBusinessId) {
          try { await deleteDoc(doc(db, 'businesses', newBusinessId)); }
          catch (e) { /* Silently ignore */ }
        }
        try { await deleteFirebaseAuthUser(fbAdminAuthUser); }
        catch (e) { /* Silently ignore */ }
      }
      setLoading(false);
      return { success: false, message: errorMessage };
    }
  }, [toast]);

  const logout = useCallback(async () => {
    const currentAdminEmail = adminUser?.email;
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: `Admin ${currentAdminEmail || ''} logged out successfully.`});
    } catch (error: any) {
      toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive"});
    }
  }, [toast, adminUser?.email]);

  const getManagedBusiness = useCallback(async (): Promise<Business | null> => {
    if (!adminUser?.businessId) {
      return null;
    }
    const businessDocRef = doc(db, 'businesses', adminUser.businessId);
    try {
      const businessDocSnap = await getDoc(businessDocRef);
      if (businessDocSnap.exists()) {
        return { id: businessDocSnap.id, ...businessDocSnap.data() } as Business;
      }
      toast({ title: "Error", description: "Managed business data not found.", variant: "destructive" });
      return null;
    } catch (error: any) {
      toast({ title: "Fetch Error", description: `Could not fetch business details: ${error.message || 'Unknown error'}.`, variant: "destructive" });
      return null;
    }
  }, [adminUser?.businessId, toast]);

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
        const newRewardId = doc(collection(db, 'rewards_placeholder_ids')).id;
        const newReward: Reward = {
            id: newRewardId,
            title: rewardData.title,
            description: rewardData.description,
            pointsCost: rewardData.pointsCost,
            category: rewardData.category,
            icon: rewardData.icon || '',
        };
        const updatedRewards = [...(businessData.rewards || []), newReward];
        await updateDoc(businessDocRef, { rewards: updatedRewards });
        toast({ title: "Reward Added", description: `${newReward.title} has been added.`, variant: "default"});
        return true;
    } catch (error: any) {
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
        updatedRewardsList[rewardIndex] = {
            ...updatedReward,
            icon: updatedReward.icon || '',
        };

        await updateDoc(businessDocRef, { rewards: updatedRewardsList });
        toast({ title: "Reward Updated", description: `${updatedReward.title} has been updated.`, variant: "default"});
        return true;
    } catch (error: any) {
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
        toast({ title: "Error Deleting Reward", description: error.message || "Could not delete reward.", variant: "destructive" });
        return false;
    }
  }, [toast]);

  const getPendingPurchaseAppeals = useCallback(async (businessId: string): Promise<PurchaseAppeal[]> => {
    if (!businessId) return [];
    try {
      const appealsRef = collection(db, 'purchaseAppeals');
      const q = query(appealsRef, where("businessId", "==", businessId), where("status", "==", "pending"), orderBy("submittedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const appeals: PurchaseAppeal[] = [];
      querySnapshot.forEach((docSnap) => {
        appeals.push({ id: docSnap.id, ...docSnap.data() } as PurchaseAppeal);
      });
      return appeals;
    } catch (error: any) {
      toast({ title: "Error Fetching Appeals", description: "Could not load purchase appeals. Ensure Firestore indexes are configured if prompted in console.", variant: "destructive" });
      return [];
    }
  }, [toast]);

  const approvePurchaseAppeal = useCallback(async (appealId: string, pointsToAward: number, itemDetails: {item: string, amount: number, userId: string, businessId: string}): Promise<boolean> => {
    if (!adminUser?.uid) {
        toast({title: "Authentication Error", description: "Admin not authenticated.", variant: "destructive"});
        return false;
    }
    const batch = writeBatch(db);
    const appealDocRef = doc(db, 'purchaseAppeals', appealId);
    const userDocRef = doc(db, 'users', itemDetails.userId);

    try {
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
             batch.update(appealDocRef, {
                status: 'approved',
                reviewedAt: serverTimestamp(),
                adminReviewedBy: adminUser.uid,
                pointsAwarded: pointsToAward,
                notes: `User ${itemDetails.userId} profile missing. No points awarded.`
            });
            await batch.commit();
            toast({title: "Appeal Approved (User Not Found)", description: `Appeal marked as approved. User profile missing.`, variant: "default"});
            return true;
        }
        const userData = userDocSnap.data() as User;
        const membershipIndex = userData.memberships?.findIndex(m => m.businessId === itemDetails.businessId);

        if (membershipIndex === undefined || membershipIndex === -1 || !userData.memberships) {
             batch.update(appealDocRef, {
                status: 'approved',
                reviewedAt: serverTimestamp(),
                adminReviewedBy: adminUser.uid,
                pointsAwarded: 0,
                notes: "User membership not found at time of approval."
            });
            await batch.commit();
            toast({title: "Appeal Approved (Membership Error)", description: "User membership not found. Appeal approved, 0 points awarded.", variant: "default"});
            return true;
        }

        const updatedMembership = { ...userData.memberships[membershipIndex] };
        updatedMembership.pointsBalance = (updatedMembership.pointsBalance || 0) + pointsToAward;

        const newPurchaseEntry: MockPurchase = {
            id: `appeal-${appealId}`,
            item: itemDetails.item,
            amount: itemDetails.amount,
            date: new Date().toISOString(),
            pointsEarned: pointsToAward,
            status: 'approved',
            appealId: appealId,
        };
        updatedMembership.purchases = [newPurchaseEntry, ...(updatedMembership.purchases || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const updatedMemberships = [...userData.memberships];
        updatedMemberships[membershipIndex] = updatedMembership;

        batch.update(appealDocRef, {
            status: 'approved',
            reviewedAt: serverTimestamp(),
            adminReviewedBy: adminUser.uid,
            pointsAwarded: pointsToAward
        });
        batch.update(userDocRef, { memberships: updatedMemberships });

        await batch.commit();
        toast({title: "Appeal Approved", description: `${pointsToAward} points awarded to the user.`, variant: "default"});
        return true;
    } catch (error: any) {
        toast({title: "Error Approving Appeal", description: error.message || "Could not approve appeal.", variant: "destructive"});
        return false;
    }
  }, [toast, adminUser?.uid]);

  const rejectPurchaseAppeal = useCallback(async (appealId: string, rejectionReason: string, itemDetails: {item: string, amount: number, userId: string, businessId: string}): Promise<boolean> => {
    if (!adminUser?.uid) {
        toast({title: "Authentication Error", description: "Admin not authenticated.", variant: "destructive"});
        return false;
    }
    const batch = writeBatch(db);
    const appealDocRef = doc(db, 'purchaseAppeals', appealId);
    const userDocRef = doc(db, 'users', itemDetails.userId);

    try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User;
            const membershipIndex = userData.memberships?.findIndex(m => m.businessId === itemDetails.businessId);

            if (membershipIndex !== undefined && membershipIndex !== -1 && userData.memberships) {
                const updatedMembership = { ...userData.memberships[membershipIndex] };
                const rejectedPurchaseEntry: MockPurchase = {
                    id: `appeal-${appealId}-rejected`,
                    item: `Appeal Rejected: ${itemDetails.item}`,
                    amount: itemDetails.amount,
                    date: new Date().toISOString(),
                    pointsEarned: 0, // No points earned or deducted for rejected appeal itself
                    status: 'rejected',
                    appealId: appealId,
                };
                // Add a record of the rejection to the user's purchase history for transparency
                updatedMembership.purchases = [rejectedPurchaseEntry, ...(updatedMembership.purchases || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const updatedMemberships = [...userData.memberships];
                updatedMemberships[membershipIndex] = updatedMembership;
                batch.update(userDocRef, { memberships: updatedMemberships });
            }
        }

        batch.update(appealDocRef, {
            status: 'rejected',
            rejectionReason: rejectionReason,
            reviewedAt: serverTimestamp(),
            adminReviewedBy: adminUser.uid
        });

        await batch.commit();
        toast({title: "Appeal Rejected", description: "The purchase appeal has been rejected.", variant: "default"});
        return true;
    } catch (error: any) {
        toast({title: "Error Rejecting Appeal", description: error.message || "Could not reject appeal.", variant: "destructive"});
        return false;
    }
  }, [toast, adminUser?.uid]);


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
    getPendingPurchaseAppeals,
    approvePurchaseAppeal,
    rejectPurchaseAppeal,
  }), [adminUser, isAdminAuthenticated, loading, login, logout, signupBusiness, getManagedBusiness, addRewardToBusiness, updateRewardInBusiness, deleteRewardFromBusiness, getPendingPurchaseAppeals, approvePurchaseAppeal, rejectPurchaseAppeal]);

  return <AdminAuthContext.Provider value={contextValue}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return context;
};

