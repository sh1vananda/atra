
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserTable } from '@/components/admin/UserTable';
import { useAuth as useCustomerAuth } from '@/contexts/AuthContext'; 
import type { User } from '@/types/user'; 
import { Users, ShoppingCart, BarChart3, Building, KeyRound, Copy, Loader2, AlertTriangle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Business } from '@/types/business';
import { ManageRewardsSection } from '@/components/admin/ManageRewardsSection';

type AdminDashboardView = "userManagement" | "rewardManagement";

export default function AdminDashboardPage() {
  const { isAdminAuthenticated, loading: adminAuthLoading, adminUser, getManagedBusiness } = useAdminAuth();
  const { getAllMockUsers } = useCustomerAuth(); 
  const router = useRouter();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [pageDataLoading, setPageDataLoading] = useState(true); 
  const [managedBusiness, setManagedBusiness] = useState<Business | null>(null);
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);
  const [currentView, setCurrentView] = useState<AdminDashboardView>("userManagement");

  const fetchAdminPageData = useCallback(async () => {
    if (!adminUser?.uid || !adminUser?.businessId) {
      setPageDataLoading(false);
      // setHasFetchedInitialData(true) here could prevent re-fetch if adminUser details populate slightly later.
      // Better to let the main useEffect handle hasFetchedInitialData based on adminUser validity.
      return;
    }
    
    setPageDataLoading(true);
    try {
      const businessDetails = await getManagedBusiness();
      setManagedBusiness(businessDetails); 

      if (businessDetails) {
        const allUsersFromDb = await getAllMockUsers();
        const enrolledUsers = allUsersFromDb.filter(user =>
          user.memberships?.some(m => m.businessId === businessDetails.id)
        );
        setUsers(enrolledUsers);
      } else {
        setUsers([]); 
      }
    } catch (error) {
        toast({
            title: "Data Fetch Error",
            description: "Could not load all necessary data for the dashboard.",
            variant: "destructive"
        });
        setManagedBusiness(null); 
        setUsers([]); 
    } finally {
        setPageDataLoading(false);
        // Set hasFetchedInitialData to true here to signify this fetch cycle is complete.
        setHasFetchedInitialData(true);
    }
  }, [adminUser?.uid, adminUser?.businessId, getManagedBusiness, getAllMockUsers, toast, setHasFetchedInitialData]);


  useEffect(() => {
    if (adminAuthLoading) {
      return; // Wait for auth context to finish loading
    }

    if (!isAdminAuthenticated) {
      router.push('/login?redirect=/admin/dashboard');
      return;
    }

    // If authenticated, adminUser is present with necessary details, and data hasn't been fetched yet
    if (isAdminAuthenticated && adminUser?.uid && adminUser?.businessId && !hasFetchedInitialData) {
      fetchAdminPageData();
    } else if (isAdminAuthenticated && adminUser && !adminUser.businessId && !hasFetchedInitialData) {
        // Admin authenticated but profile incomplete (no businessId)
        setPageDataLoading(false); 
        setHasFetchedInitialData(true); // Mark as "attempted" to show appropriate message
    }
    // If hasFetchedInitialData is true, we don't re-fetch unless explicitly asked (e.g., by handleUserTableUpdate)

  }, [adminAuthLoading, isAdminAuthenticated, adminUser, router, fetchAdminPageData, hasFetchedInitialData]);


  const handleUserTableUpdate = useCallback(() => {
    setHasFetchedInitialData(false); // This will cause the main useEffect to re-trigger fetchAdminPageData
  }, []);
  
  const handleRewardChange = useCallback(() => {
    setHasFetchedInitialData(false); // Re-fetch business data (which includes rewards)
  }, []);


  const totalPointsInBusiness = users.reduce((total, user) => {
    const membership = user.memberships?.find(m => m.businessId === managedBusiness?.id);
    return total + (membership?.pointsBalance || 0);
  }, 0);

  const totalTransactionsInBusiness = users.reduce((total, user) => {
    const membership = user.memberships?.find(m => m.businessId === managedBusiness?.id);
    return total + (membership?.purchases?.length || 0);
  }, 0);

  const handleCopyJoinCode = () => {
    if (managedBusiness?.joinCode) {
      navigator.clipboard.writeText(managedBusiness.joinCode)
        .then(() => toast({ title: "Copied!", description: "Business join code copied to clipboard." }))
        .catch(() => toast({ title: "Error", description: "Could not copy join code.", variant: "destructive" }));
    }
  };

  // Render 1: Auth context is still determining auth status
  if (adminAuthLoading) {
    return (
      <div className="w-full space-y-8 animate-pulse">
        <div className="text-left pb-4 border-b border-border"> <Skeleton className="h-8 w-1/2 mb-2" /> <Skeleton className="h-5 w-3/4" /> </div>
        <div className="flex space-x-2 mb-6"> <Skeleton className="h-10 w-40" /> <Skeleton className="h-10 w-44" /> </div>
        <Card className="bg-accent/10 border-accent"> <CardHeader> <Skeleton className="h-7 w-1/3 mb-1" /> <Skeleton className="h-4 w-2/3" /> </CardHeader> <CardContent className="flex items-center justify-between"> <Skeleton className="h-10 w-1/4" /> <Skeleton className="h-9 w-24" /> </CardContent> </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {[1,2,3].map(i => ( <Card key={i}> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <Skeleton className="h-5 w-2/5"/> <Skeleton className="h-4 w-4"/> </CardHeader> <CardContent> <Skeleton className="h-8 w-1/2 mb-1"/> <Skeleton className="h-3 w-3/5"/> </CardContent> </Card> ))} </div>
        <Card> <CardHeader> <Skeleton className="h-8 w-2/5 mb-1" /> <Skeleton className="h-4 w-3/5" /> </CardHeader> <CardContent> <Skeleton className="h-10 w-full mb-4" /> <Skeleton className="h-64 w-full" /> </CardContent> </Card>
      </div>
    );
  }
  
  // Render 2: Auth context loaded, but user is NOT authenticated admin (redirect is handled by useEffect)
  if (!isAdminAuthenticated) { 
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,80px)-6rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }

  // Render 3: Authenticated, but page-specific data is still loading OR initial fetch hasn't completed for the first time
  // (and hasFetchedInitialData is false, meaning a fetch is pending or in progress)
  if (pageDataLoading || !hasFetchedInitialData) { 
     return (
      <div className="w-full space-y-8 animate-pulse">
        <div className="text-left pb-4 border-b border-border"> <Skeleton className="h-8 w-1/2 mb-2" /> <Skeleton className="h-5 w-3/4" /> </div>
        <div className="flex space-x-2 mb-6"> <Skeleton className="h-10 w-40" /> <Skeleton className="h-10 w-44" /> </div>
        {(adminUser?.businessId || managedBusiness) && <Card className="bg-accent/10 border-accent"> <CardHeader> <Skeleton className="h-7 w-1/3 mb-1" /> <Skeleton className="h-4 w-2/3" /> </CardHeader> <CardContent className="flex items-center justify-between"> <Skeleton className="h-10 w-1/4" /> <Skeleton className="h-9 w-24" /> </CardContent> </Card>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {[1,2,3].map(i => ( <Card key={i}> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <Skeleton className="h-5 w-2/5"/> <Skeleton className="h-4 w-4"/> </CardHeader> <CardContent> <Skeleton className="h-8 w-1/2 mb-1"/> <Skeleton className="h-3 w-3/5"/> </CardContent> </Card> ))} </div>
        <Card> <CardHeader> <Skeleton className="h-8 w-2/5 mb-1" /> <Skeleton className="h-4 w-3/5" /> </CardHeader> <CardContent> <Skeleton className="h-10 w-full mb-4" /> <Skeleton className="h-64 w-full" /> </CardContent> </Card>
      </div>
    );
  }
  
  // Render 4: Authenticated, data fetch attempted (hasFetchedInitialData true), pageDataLoading false, but managedBusiness is NULL.
  // This implies admin is authenticated but their businessId might be wrong or business doc is missing.
  if (hasFetchedInitialData && !pageDataLoading && !managedBusiness) {
     return (
        <div className="w-full space-y-8 text-center py-10">
            <AlertTriangle className="h-20 w-20 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-destructive">Business Data Not Found</h2>
            <p className="text-muted-foreground">We could not load the details for your managed business (ID: {adminUser?.businessId || "Unknown"}).</p>
            <p className="text-muted-foreground">Ensure your admin account is correctly linked to a business.</p>
            <Button onClick={() => { 
                setHasFetchedInitialData(false); // Reset flag to allow main useEffect to re-trigger fetch
            }} className="mt-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin hidden" /> 
                Try Reloading Data
            </Button>
        </div>
     );
  }

  // Render 5: Normal dashboard content (all checks passed, data loaded, managedBusiness exists)
  if (hasFetchedInitialData && !pageDataLoading && managedBusiness) {
    return (
      <div className="w-full space-y-8 sm:space-y-10">
        <div className="text-left pb-4 border-b border-border">
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-1 flex items-center">
             <Building className="inline-block h-8 w-8 mr-3 align-text-bottom" />
             {managedBusiness.name}
          </h1>
          <p className="text-lg text-muted-foreground">Welcome, {adminUser?.email || "Admin"}. Manage your business loyalty program.</p>
        </div>

        {managedBusiness.joinCode && (
          <Card className="bg-accent/10 border-accent shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl sm:text-2xl flex items-center text-accent"> <KeyRound className="h-6 w-6 mr-2" /> Your Business Join Code </CardTitle>
              <CardDescription className="text-accent/80"> Share this code with customers to join your loyalty program.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-3xl font-bold text-accent tracking-wider bg-accent/20 px-4 py-2 rounded-md self-start sm:self-center"> {managedBusiness.joinCode} </p>
              <Button variant="outline" size="sm" onClick={handleCopyJoinCode} className="text-accent border-accent hover:bg-accent/20 self-stretch sm:self-auto"> <Copy className="mr-2 h-4 w-4" /> Copy Code </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card shadow hover:shadow-lg transition-shadow"> 
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> 
              <CardTitle className="text-sm font-medium">Enrolled Users</CardTitle> <Users className="h-4 w-4 text-muted-foreground" /> 
            </CardHeader> 
            <CardContent> <div className="text-2xl font-bold">{users.length}</div> <p className="text-xs text-muted-foreground"> Users in {managedBusiness.name} </p> </CardContent> 
          </Card>
          <Card className="bg-card shadow hover:shadow-lg transition-shadow"> 
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> 
              <CardTitle className="text-sm font-medium">Total Points Issued</CardTitle> <BarChart3 className="h-4 w-4 text-muted-foreground" /> 
            </CardHeader> 
            <CardContent> <div className="text-2xl font-bold">{totalPointsInBusiness}</div> <p className="text-xs text-muted-foreground"> Within {managedBusiness.name} </p> </CardContent> 
          </Card>
          <Card className="bg-card shadow hover:shadow-lg transition-shadow"> 
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> 
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle> <ShoppingCart className="h-4 w-4 text-muted-foreground" /> 
            </CardHeader> 
            <CardContent> <div className="text-2xl font-bold">{totalTransactionsInBusiness}</div> <p className="text-xs text-muted-foreground"> Recorded for {managedBusiness.name} </p> </CardContent> 
          </Card>
        </div>
        
        {/* View Toggle Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
            <Button 
                variant={currentView === "userManagement" ? "default" : "outline"} 
                onClick={() => setCurrentView("userManagement")}
                className="flex-grow sm:flex-grow-0"
            >
                <Users className="mr-2 h-5 w-5" /> User Management
            </Button>
            <Button 
                variant={currentView === "rewardManagement" ? "default" : "outline"} 
                onClick={() => setCurrentView("rewardManagement")}
                 className="flex-grow sm:flex-grow-0"
            >
                <Gift className="mr-2 h-5 w-5" /> Reward Management
            </Button>
        </div>

        {/* Conditional Content Based on View */}
        {currentView === "userManagement" && (
            <Card className="shadow-lg bg-card">
              <CardHeader> 
                <CardTitle className="font-headline text-2xl sm:text-3xl">User Management</CardTitle> 
                <CardDescription>View users, their purchase history, and add new purchases.</CardDescription> 
              </CardHeader>
              <CardContent> <UserTable users={users} onUserUpdate={handleUserTableUpdate} businessId={adminUser!.businessId!} /> </CardContent>
            </Card>
        )}

        {currentView === "rewardManagement" && (
            <ManageRewardsSection 
                business={managedBusiness} 
                onRewardChange={handleRewardChange} 
            />
        )}

      </div>
    );
  }

  // Fallback if none of the above conditions are met (should ideally not be reached)
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,80px)-6rem)]">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Preparing dashboard...</p>
    </div>
  );
}
