
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserTable } from '@/components/admin/UserTable';
import { useAuth as useCustomerAuth } from '@/contexts/AuthContext'; 
import type { User } from '@/types/user'; 
import { Users, ShoppingCart, BarChart3, Building, KeyRound, Copy, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Business } from '@/types/business';

export default function AdminDashboardPage() {
  const { isAdminAuthenticated, loading: adminAuthLoading, adminUser, getManagedBusiness } = useAdminAuth();
  const { getAllMockUsers } = useCustomerAuth(); 
  const router = useRouter();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [pageDataLoading, setPageDataLoading] = useState(true); 
  const [managedBusiness, setManagedBusiness] = useState<Business | null>(null);
  const [hasFetchedData, setHasFetchedData] = useState(false); // New flag

  // Simplified data fetching function
  const fetchAdminPageData = useCallback(async () => {
    if (!adminUser?.uid || !adminUser?.businessId) {
      console.log("AdminDashboard: fetchAdminPageData - Aborting, adminUser or critical details missing.");
      setPageDataLoading(false);
      setHasFetchedData(true); // Mark as attempted
      return;
    }

    console.log("AdminDashboard: fetchAdminPageData - Starting for adminUID:", adminUser.uid, "businessId:", adminUser.businessId);
    setPageDataLoading(true);
    
    try {
      const businessDetails = await getManagedBusiness();
      setManagedBusiness(businessDetails); 
      console.log("AdminDashboard: fetchAdminPageData - Business details fetched (could be null):", businessDetails);

      if (businessDetails) {
        const allUsersFromDb = await getAllMockUsers();
        const enrolledUsers = allUsersFromDb.filter(user =>
          user.memberships?.some(m => m.businessId === businessDetails.id)
        );
        setUsers(enrolledUsers);
        console.log(`AdminDashboard: fetchAdminPageData - Found ${enrolledUsers.length} enrolled users.`);
      } else {
        setUsers([]); 
      }
    } catch (error) {
        console.error("AdminDashboard: fetchAdminPageData - Error fetching data:", error);
        toast({
            title: "Data Fetch Error",
            description: "Could not load all necessary data for the dashboard.",
            variant: "destructive"
        });
        setManagedBusiness(null); 
        setUsers([]); 
    } finally {
        console.log("AdminDashboard: fetchAdminPageData - Finished. Setting pageDataLoading to false.");
        setPageDataLoading(false);
        setHasFetchedData(true); // Mark as completed/attempted
    }
  }, [adminUser?.uid, adminUser?.businessId, getManagedBusiness, getAllMockUsers, toast]);


  // Effect to handle authentication and trigger initial data fetch
  useEffect(() => {
    console.log(`AdminDashboard:EFFECT[Auth&InitialFetch]: adminAuthLoading: ${adminAuthLoading}, isAdminAuthenticated: ${isAdminAuthenticated}, adminUser UID: ${adminUser?.uid}, hasFetchedData: ${hasFetchedData}`);
    
    if (adminAuthLoading) {
      console.log("AdminDashboard:EFFECT[Auth&InitialFetch]: Auth context is loading. Waiting...");
      return; // Wait for auth context to finish loading
    }

    if (!isAdminAuthenticated) {
      console.log("AdminDashboard:EFFECT[Auth&InitialFetch]: Not authenticated, redirecting to /login.");
      router.push('/login?redirect=/admin/dashboard');
      return;
    }

    // If authenticated and adminUser is present with necessary details, and data hasn't been fetched yet
    if (isAdminAuthenticated && adminUser?.uid && adminUser?.businessId && !hasFetchedData) {
      console.log("AdminDashboard:EFFECT[Auth&InitialFetch]: Authenticated, adminUser valid, and data not yet fetched. Calling fetchAdminPageData.");
      fetchAdminPageData();
    } else if (isAdminAuthenticated && adminUser && !adminUser.businessId) {
        console.warn("AdminDashboard:EFFECT[Auth&InitialFetch]: Authenticated but adminUser is missing businessId. Cannot fetch data.");
        setPageDataLoading(false); // Stop loading visuals for page data
        setHasFetchedData(true); // Consider this an attempt, though it will fail to fetch business data
    }

  }, [adminAuthLoading, isAdminAuthenticated, adminUser, router, fetchAdminPageData, hasFetchedData]);


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

  const handleUserTableUpdate = useCallback(() => {
    console.log("AdminDashboard: UserTable onUserUpdate -> Triggering data re-fetch by resetting hasFetchedData.");
    setHasFetchedData(false); // This will cause the main useEffect to re-trigger fetchAdminPageData
  }, []);

  // Render 1: Auth context is still determining auth status
  if (adminAuthLoading) {
    console.log("AdminDashboard:RENDER: SKELETON (Auth context loading).");
    return (
      <div className="w-full space-y-8 animate-pulse">
        <div className="text-left pb-4 border-b border-border"> <Skeleton className="h-8 w-1/2 mb-2" /> <Skeleton className="h-5 w-3/4" /> </div>
        <Card className="bg-accent/10 border-accent"> <CardHeader> <Skeleton className="h-7 w-1/3 mb-1" /> <Skeleton className="h-4 w-2/3" /> </CardHeader> <CardContent className="flex items-center justify-between"> <Skeleton className="h-10 w-1/4" /> <Skeleton className="h-9 w-24" /> </CardContent> </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {[1,2,3].map(i => ( <Card key={i}> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <Skeleton className="h-5 w-2/5"/> <Skeleton className="h-4 w-4"/> </CardHeader> <CardContent> <Skeleton className="h-8 w-1/2 mb-1"/> <Skeleton className="h-3 w-3/5"/> </CardContent> </Card> ))} </div>
        <Card> <CardHeader> <Skeleton className="h-8 w-2/5 mb-1" /> <Skeleton className="h-4 w-3/5" /> </CardHeader> <CardContent> <Skeleton className="h-10 w-full mb-4" /> <Skeleton className="h-64 w-full" /> </CardContent> </Card>
      </div>
    );
  }
  
  // Render 2: Auth context loaded, but user is NOT authenticated admin (redirect is handled by useEffect)
  if (!adminAuthLoading && !isAdminAuthenticated) { 
    console.log("AdminDashboard:RENDER: NOT authenticated (redirecting via useEffect).");
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }

  // Render 3: Authenticated, but page-specific data is still loading (initial fetch or re-fetch)
  if (isAdminAuthenticated && pageDataLoading) { 
     console.log("AdminDashboard:RENDER: SKELETON (Page data loading). AdminUser UID:", adminUser?.uid);
     return (
      <div className="w-full space-y-8 animate-pulse">
        <div className="text-left pb-4 border-b border-border"> <Skeleton className="h-8 w-1/2 mb-2" /> <Skeleton className="h-5 w-3/4" /> </div>
        {adminUser?.businessId && <Card className="bg-accent/10 border-accent"> <CardHeader> <Skeleton className="h-7 w-1/3 mb-1" /> <Skeleton className="h-4 w-2/3" /> </CardHeader> <CardContent className="flex items-center justify-between"> <Skeleton className="h-10 w-1/4" /> <Skeleton className="h-9 w-24" /> </CardContent> </Card>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {[1,2,3].map(i => ( <Card key={i}> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <Skeleton className="h-5 w-2/5"/> <Skeleton className="h-4 w-4"/> </CardHeader> <CardContent> <Skeleton className="h-8 w-1/2 mb-1"/> <Skeleton className="h-3 w-3/5"/> </CardContent> </Card> ))} </div>
        <Card> <CardHeader> <Skeleton className="h-8 w-2/5 mb-1" /> <Skeleton className="h-4 w-3/5" /> </CardHeader> <CardContent> <Skeleton className="h-10 w-full mb-4" /> <Skeleton className="h-64 w-full" /> </CardContent> </Card>
      </div>
    );
  }
  
  // Render 4: Authenticated, data fetch attempted (hasFetchedData is true), pageDataLoading is false, but managedBusiness is NULL.
  // This implies an issue fetching business details or adminUser.businessId was missing.
  if (isAdminAuthenticated && hasFetchedData && !pageDataLoading && !managedBusiness) {
     console.log("AdminDashboard:RENDER: ERROR (Managed business is null after data load attempt). AdminUser Business ID:", adminUser?.businessId);
     return (
        <div className="w-full space-y-8 text-center py-10">
            <AlertTriangle className="h-20 w-20 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-destructive">Business Data Not Found</h2>
            <p className="text-muted-foreground">We could not load the details for your managed business (Admin Business ID: {adminUser?.businessId || "Unknown"}).</p>
            <p className="text-muted-foreground">This may be due to a temporary issue, incorrect data configuration, or your admin profile lacking a valid business ID.</p>
            <Button onClick={() => { 
                console.log("AdminDashboard: Retry fetchAdminPageData clicked by resetting hasFetchedData."); 
                setHasFetchedData(false); // This will re-trigger the main useEffect to call fetchAdminPageData
            }} className="mt-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin hidden" /> 
                Try Reloading Data
            </Button>
        </div>
     );
  }

  // Render 5: Normal dashboard content (all checks passed, data loaded, managedBusiness exists)
  if (isAdminAuthenticated && hasFetchedData && !pageDataLoading && managedBusiness) {
    console.log("AdminDashboard:RENDER: NORMAL dashboard content. AdminUser UID:", adminUser?.uid, "ManagedBusiness Name:", managedBusiness.name);
    return (
      <div className="w-full space-y-8">
        <div className="text-left pb-4 border-b border-border">
          <h1 className="text-3xl font-headline font-bold text-primary mb-1 flex items-center">
             <Building className="inline-block h-8 w-8 mr-3 align-text-bottom" />
             {managedBusiness.name}
          </h1>
          <p className="text-lg text-muted-foreground">Welcome, {adminUser?.email || "Admin"}. Manage users and activity for {managedBusiness.name}.</p>
        </div>

        {managedBusiness.joinCode && (
          <Card className="bg-accent/10 border-accent shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center text-accent"> <KeyRound className="h-6 w-6 mr-2" /> Your Business Join Code </CardTitle>
              <CardDescription className="text-accent/80"> Share this code with customers to join your loyalty program.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-3xl font-bold text-accent tracking-wider bg-accent/20 px-4 py-2 rounded-md"> {managedBusiness.joinCode} </p>
              <Button variant="outline" size="sm" onClick={handleCopyJoinCode} className="text-accent border-accent hover:bg-accent/20"> <Copy className="mr-2 h-4 w-4" /> Copy Code </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card"> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <CardTitle className="text-sm font-medium">Enrolled Users</CardTitle> <Users className="h-4 w-4 text-muted-foreground" /> </CardHeader> <CardContent> <div className="text-2xl font-bold">{users.length}</div> <p className="text-xs text-muted-foreground"> Users in {managedBusiness.name} </p> </CardContent> </Card>
          <Card className="bg-card"> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <CardTitle className="text-sm font-medium">Total Points Issued</CardTitle> <BarChart3 className="h-4 w-4 text-muted-foreground" /> </CardHeader> <CardContent> <div className="text-2xl font-bold">{totalPointsInBusiness}</div> <p className="text-xs text-muted-foreground"> Within {managedBusiness.name} </p> </CardContent> </Card>
          <Card className="bg-card"> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <CardTitle className="text-sm font-medium">Total Transactions</CardTitle> <ShoppingCart className="h-4 w-4 text-muted-foreground" /> </CardHeader> <CardContent> <div className="text-2xl font-bold">{totalTransactionsInBusiness}</div> <p className="text-xs text-muted-foreground"> Recorded for {managedBusiness.name} </p> </CardContent> </Card>
        </div>

        <Card className="shadow-lg bg-card">
          <CardHeader> <CardTitle className="font-headline text-2xl">User Management for {managedBusiness.name}</CardTitle> <CardDescription>View users, their purchase history, and add new purchases.</CardDescription> </CardHeader>
          <CardContent> <UserTable users={users} onUserUpdate={handleUserTableUpdate} businessId={adminUser!.businessId!} /> </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback if none of the above conditions are met (should ideally not be reached if logic is sound)
  console.warn("AdminDashboard:RENDER: Fallback - no suitable render condition met. This indicates a potential logic flaw in conditional rendering. States:", {adminAuthLoading, isAdminAuthenticated, pageDataLoading, hasFetchedData, managedBusinessExists: !!managedBusiness});
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Preparing dashboard...</p>
    </div>
  );
}
    
