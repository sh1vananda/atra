
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserTable } from '@/components/admin/UserTable';
import { useAuth as useCustomerAuth } from '@/contexts/AuthContext'; 
import type { User } from '@/types/user'; 
import { Users, ShoppingCart, BarChart3, Building, KeyRound, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Business } from '@/types/business';

export default function AdminDashboardPage() {
  const { isAdminAuthenticated, loading: adminLoading, adminUser, getManagedBusiness } = useAdminAuth();
  const { getAllMockUsers } = useCustomerAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingPageData, setLoadingPageData] = useState(true); // Combined loading for business and users
  const [managedBusiness, setManagedBusiness] = useState<Business | null>(null);

  const fetchAdminPageData = useCallback(async () => {
    if (!isAdminAuthenticated || !adminUser) {
      // This case should ideally be handled by a redirect if not loading
      if (!adminLoading) router.push('/login');
      return;
    }
    
    setLoadingPageData(true);
    console.log("AdminDashboard: Fetching admin page data...");

    const businessDetails = await getManagedBusiness();
    setManagedBusiness(businessDetails);

    if (businessDetails) {
      console.log("AdminDashboard: Business details fetched, now fetching users for businessId:", businessDetails.id);
      const allUsersFromDb = await getAllMockUsers();
      const enrolledUsers = allUsersFromDb.filter(user =>
        user.memberships?.some(m => m.businessId === businessDetails.id)
      );
      setUsers(enrolledUsers);
      console.log(`AdminDashboard: Found ${enrolledUsers.length} enrolled users.`);
    } else {
      console.log("AdminDashboard: No business details found, clearing users.");
      setUsers([]);
      if (!adminLoading) { // If not initial auth loading, and business is null, it's an issue
        toast({
            title: "Business Data Missing",
            description: "Could not load data for your managed business. Please try again or contact support.",
            variant: "destructive"
        });
      }
    }
    setLoadingPageData(false);
    console.log("AdminDashboard: Finished fetching admin page data.");

  }, [isAdminAuthenticated, adminUser, getManagedBusiness, getAllMockUsers, router, adminLoading, toast]);


  useEffect(() => {
    // Effect for initial auth check and redirect
    if (!adminLoading && !isAdminAuthenticated) {
      console.log("AdminDashboard: Not authenticated and not loading, redirecting to /login.");
      router.push('/login');
    }
  }, [adminLoading, isAdminAuthenticated, router]);

  useEffect(() => {
    // Effect to fetch data once authenticated and adminUser is available
    if (isAdminAuthenticated && adminUser) {
      console.log("AdminDashboard: Authenticated and adminUser present, calling fetchAdminPageData.");
      fetchAdminPageData();
    }
  }, [isAdminAuthenticated, adminUser, fetchAdminPageData]);


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
        .then(() => {
          toast({
            title: "Copied!",
            description: "Business join code copied to clipboard.",
          });
        })
        .catch(err => {
          toast({
            title: "Error",
            description: "Could not copy join code.",
            variant: "destructive",
          });
        });
    }
  };

  if (adminLoading || loadingPageData || !adminUser || !managedBusiness && isAdminAuthenticated) { // Show skeleton if initial auth is loading, or page data is loading, or if adminUser is null, or if authenticated but managedBusiness is still null (during its fetch)
    return (
      <div className="w-full space-y-8 animate-pulse">
        <div className="text-left pb-4 border-b border-border">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-5 w-3/4" />
        </div>
         {/* Join Code Skeleton */}
        <Card className="bg-accent/10 border-accent">
          <CardHeader>
             <Skeleton className="h-7 w-1/3 mb-1" />
             <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-9 w-24" />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-5 w-2/5"/>
                        <Skeleton className="h-4 w-4"/>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-1/2 mb-1"/>
                        <Skeleton className="h-3 w-3/5"/>
                    </CardContent>
                </Card>
            ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-2/5 mb-1" />
            <Skeleton className="h-4 w-3/5" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!isAdminAuthenticated && !adminLoading) {
    // This case should be handled by redirect in useEffect, but as a fallback:
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }
  
  if (!managedBusiness && isAdminAuthenticated && !loadingPageData && !adminLoading) {
     return (
        <div className="w-full space-y-8 text-center py-10">
            <Building className="h-20 w-20 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-destructive">Business Data Not Found</h2>
            <p className="text-muted-foreground">We could not load the details for your managed business.</p>
            <p className="text-muted-foreground">This might be a temporary issue or your admin account may not be correctly linked to a business.</p>
            <Button onClick={() => fetchAdminPageData()} className="mt-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Try Reloading Data
            </Button>
        </div>
     )
  }


  return (
    <div className="w-full space-y-8">
      <div className="text-left pb-4 border-b border-border">
        <h1 className="text-3xl font-headline font-bold text-primary mb-1 flex items-center">
           <Building className="inline-block h-8 w-8 mr-3 align-text-bottom" />
           {managedBusiness?.name || 'Your Business'}
        </h1>
        <p className="text-lg text-muted-foreground">Welcome, {adminUser?.email}. Manage users and activity for {managedBusiness?.name || 'your business'}.</p>
      </div>

      {managedBusiness?.joinCode && (
        <Card className="bg-accent/10 border-accent shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center text-accent">
              <KeyRound className="h-6 w-6 mr-2" />
              Your Business Join Code
            </CardTitle>
            <CardDescription className="text-accent/80">
              Share this code with your customers so they can join your loyalty program on ATRA.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-3xl font-bold text-accent tracking-wider bg-accent/20 px-4 py-2 rounded-md">
              {managedBusiness.joinCode}
            </p>
            <Button variant="outline" size="sm" onClick={handleCopyJoinCode} className="text-accent border-accent hover:bg-accent/20">
              <Copy className="mr-2 h-4 w-4" /> Copy Code
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Users enrolled in {managedBusiness?.name || 'your business'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points Issued</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{totalPointsInBusiness}</div>
            <p className="text-xs text-muted-foreground">
              Within {managedBusiness?.name || 'your business'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactionsInBusiness}</div>
            <p className="text-xs text-muted-foreground">
              Recorded for {managedBusiness?.name || 'your business'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">User Management for {managedBusiness?.name || 'your business'}</CardTitle>
          <CardDescription>View users, their purchase history, and add new purchases for your business.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserTable users={users} onUserUpdate={fetchAdminPageData} businessId={adminUser?.businessId || ""} />
        </CardContent>
      </Card>
    </div>
  );
}

