
"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserTable } from '@/components/admin/UserTable';
import { useAuth as useCustomerAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/user';
import { Users, ShoppingCart, BarChart3, Building, KeyRound, Copy, Loader2, AlertTriangle, Gift, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Business } from '@/types/business';
import { ManageRewardsSection } from '@/components/admin/ManageRewardsSection';
import { PurchaseAppealsSection } from '@/components/admin/PurchaseAppealsSection'; // Import new component

type AdminDashboardView = "userManagement" | "rewardManagement" | "purchaseAppeals";

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
        setHasFetchedInitialData(true);
    }
  }, [adminUser?.uid, adminUser?.businessId, getManagedBusiness, getAllMockUsers, toast]);

  useEffect(() => {
    if (adminAuthLoading) return;
    if (!isAdminAuthenticated) {
      router.push('/login?redirect=/admin/dashboard');
      return;
    }
    if (isAdminAuthenticated && adminUser?.uid && adminUser?.businessId && !hasFetchedInitialData) {
      fetchAdminPageData();
    } else if (isAdminAuthenticated && adminUser && !adminUser.businessId && !hasFetchedInitialData) {
        setPageDataLoading(false);
        setHasFetchedInitialData(true);
    }
  }, [adminAuthLoading, isAdminAuthenticated, adminUser, router, fetchAdminPageData, hasFetchedInitialData]);

  const handleDataRefreshNeeded = useCallback(() => {
    setHasFetchedInitialData(false); // This will trigger fetchAdminPageData in the useEffect
  }, []);

  const totalPointsInBusiness = useMemo(() => users.reduce((total, user) => {
    const membership = user.memberships?.find(m => m.businessId === managedBusiness?.id);
    return total + (membership?.pointsBalance || 0);
  }, 0), [users, managedBusiness?.id]);

  const totalTransactionsInBusiness = useMemo(() => users.reduce((total, user) => {
    const membership = user.memberships?.find(m => m.businessId === managedBusiness?.id);
    // Count only 'approved' purchases or redemptions for transaction count
    const approvedPurchases = membership?.purchases?.filter(p => p.status === 'approved' || p.pointsEarned < 0).length || 0;
    return total + approvedPurchases;
  }, 0), [users, managedBusiness?.id]);


  const handleCopyJoinCode = () => {
    if (managedBusiness?.joinCode) {
      navigator.clipboard.writeText(managedBusiness.joinCode)
        .then(() => toast({ title: "Copied!", description: "Business join code copied to clipboard." }))
        .catch(() => toast({ title: "Error", description: "Could not copy join code.", variant: "destructive" }));
    }
  };

  const StatCard = ({ title, value, icon: Icon, onClick }: { title: string; value: string | number; icon: React.ElementType; onClick?: () => void }) => (
    <Card
        className={`bg-card shadow-md hover:shadow-xl transition-all duration-300 ease-in-out ${onClick ? 'cursor-pointer hover:border-primary hover:scale-[1.03] hover:ring-2 hover:ring-primary hover:ring-offset-1' : 'hover:shadow-lg'}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle> <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {managedBusiness?.name && <p className="text-xs text-muted-foreground/80"> in {managedBusiness.name} </p>}
      </CardContent>
    </Card>
  );

  const navigateToUserManagement = () => {
    setCurrentView("userManagement");
    const userTableElement = document.getElementById("user-management-section");
    userTableElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (adminAuthLoading) {
    return (
      <div className="w-full space-y-8 animate-pulse">
        <div className="text-left pb-4 border-b border-border"> <Skeleton className="h-8 w-1/2 mb-2" /> <Skeleton className="h-5 w-3/4" /> </div>
        <div className="flex flex-wrap gap-2 mb-6"> <Skeleton className="h-10 w-40" /> <Skeleton className="h-10 w-44" /> <Skeleton className="h-10 w-48" /> </div>
        <Card className="bg-card border-border shadow-lg"> <CardHeader> <Skeleton className="h-7 w-1/3 mb-1" /> <Skeleton className="h-4 w-2/3" /> </CardHeader> <CardContent className="flex items-center justify-between"> <Skeleton className="h-10 w-1/4" /> <Skeleton className="h-9 w-24" /> </CardContent> </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {[1,2,3].map(i => ( <Card key={i}> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <Skeleton className="h-5 w-2/5"/> <Skeleton className="h-4 w-4"/> </CardHeader> <CardContent> <Skeleton className="h-8 w-1/2 mb-1"/> <Skeleton className="h-3 w-3/5"/> </CardContent> </Card> ))} </div>
        <Card> <CardHeader> <Skeleton className="h-8 w-2/5 mb-1" /> <Skeleton className="h-4 w-3/5" /> </CardHeader> <CardContent> <Skeleton className="h-10 w-full mb-4" /> <Skeleton className="h-64 w-full" /> </CardContent> </Card>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,80px)-6rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }

  if (pageDataLoading || !hasFetchedInitialData) {
     return (
      <div className="w-full space-y-8 animate-pulse">
        <div className="text-left pb-4 border-b border-border"> <Skeleton className="h-8 w-1/2 mb-2" /> <Skeleton className="h-5 w-3/4" /> </div>
        <div className="flex flex-wrap gap-2 mb-6"> <Skeleton className="h-10 w-40" /> <Skeleton className="h-10 w-44" /> <Skeleton className="h-10 w-48" /> </div>
        {(adminUser?.businessId || managedBusiness) && <Card className="bg-card border-border shadow-lg"> <CardHeader> <Skeleton className="h-7 w-1/3 mb-1" /> <Skeleton className="h-4 w-2/3" /> </CardHeader> <CardContent className="flex items-center justify-between"> <Skeleton className="h-10 w-1/4" /> <Skeleton className="h-9 w-24" /> </CardContent> </Card>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {[1,2,3].map(i => ( <Card key={i}> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <Skeleton className="h-5 w-2/5"/> <Skeleton className="h-4 w-4"/> </CardHeader> <CardContent> <Skeleton className="h-8 w-1/2 mb-1"/> <Skeleton className="h-3 w-3/5"/> </CardContent> </Card> ))} </div>
        <Card> <CardHeader> <Skeleton className="h-8 w-2/5 mb-1" /> <Skeleton className="h-4 w-3/5" /> </CardHeader> <CardContent> <Skeleton className="h-10 w-full mb-4" /> <Skeleton className="h-64 w-full" /> </CardContent> </Card>
      </div>
    );
  }

  if (hasFetchedInitialData && !pageDataLoading && !managedBusiness) {
     return (
        <div className="w-full space-y-8 text-center py-10">
            <AlertTriangle className="h-20 w-20 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-destructive">Business Data Not Found</h2>
            <p className="text-muted-foreground">We could not load the details for your managed business (ID: {adminUser?.businessId || "Unknown"}).</p>
            <p className="text-muted-foreground">Ensure your admin account is correctly linked to a business.</p>
            <Button onClick={handleDataRefreshNeeded} className="mt-4">
                Try Reloading Data
            </Button>
        </div>
     );
  }

  if (hasFetchedInitialData && !pageDataLoading && managedBusiness && adminUser) {
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
          <Card className="bg-gradient-to-br from-primary via-primary/90 to-blue-700 text-primary-foreground shadow-xl rounded-xl p-6 hover:shadow-2xl transition-shadow duration-300 ease-in-out">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-xl sm:text-2xl flex items-center">
                  <KeyRound className="h-7 w-7 mr-3" /> Your Business Join Code
                </CardTitle>
                <Copy 
                  className="h-7 w-7 cursor-pointer hover:text-primary-foreground/80 transition-colors active:scale-90" 
                  onClick={handleCopyJoinCode}
                  aria-label="Copy join code"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleCopyJoinCode()}
                />
              </div>
              <CardDescription className="text-primary-foreground/80 pt-1">Share this code with customers to join your loyalty program.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-black/25 backdrop-blur-sm text-primary-foreground inline-block px-8 py-4 rounded-lg shadow-inner shadow-black/20">
                <p className="text-5xl sm:text-6xl font-bold tracking-wider">
                  {managedBusiness.joinCode}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Enrolled Users" value={users.length} icon={Users} onClick={navigateToUserManagement} />
            <StatCard title="Total Points Issued" value={totalPointsInBusiness} icon={BarChart3} onClick={navigateToUserManagement} />
            <StatCard title="Total Transactions" value={totalTransactionsInBusiness} icon={ShoppingCart} onClick={navigateToUserManagement} />
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
            <Button
                variant={currentView === "userManagement" ? "default" : "outline"}
                onClick={() => setCurrentView("userManagement")}
                className="flex-grow sm:flex-grow-0 transition-colors duration-200"
                aria-pressed={currentView === "userManagement"}
            >
                <Users className="mr-2 h-5 w-5" /> User Management
            </Button>
            <Button
                variant={currentView === "rewardManagement" ? "default" : "outline"}
                onClick={() => setCurrentView("rewardManagement")}
                 className="flex-grow sm:flex-grow-0 transition-colors duration-200"
                 aria-pressed={currentView === "rewardManagement"}
            >
                <Gift className="mr-2 h-5 w-5" /> Reward Management
            </Button>
            <Button
                variant={currentView === "purchaseAppeals" ? "default" : "outline"}
                onClick={() => setCurrentView("purchaseAppeals")}
                 className="flex-grow sm:flex-grow-0 transition-colors duration-200"
                 aria-pressed={currentView === "purchaseAppeals"}
            >
                <ListChecks className="mr-2 h-5 w-5" /> Purchase Appeals
            </Button>
        </div>

        <div id="user-management-section">
            {currentView === "userManagement" && (
                <Card className="shadow-lg bg-card">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl sm:text-3xl">User Management</CardTitle>
                    <CardDescription>View users, their purchase history, and manage their details.</CardDescription>
                  </CardHeader>
                  <CardContent> <UserTable users={users} onUserUpdate={handleDataRefreshNeeded} businessId={adminUser.businessId!} /> </CardContent>
                </Card>
            )}
        </div>

        {currentView === "rewardManagement" && (
            <ManageRewardsSection
                business={managedBusiness}
                onRewardChange={handleDataRefreshNeeded}
            />
        )}

        {currentView === "purchaseAppeals" && (
            <PurchaseAppealsSection businessId={managedBusiness.id} />
        )}

      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,80px)-6rem)]">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Preparing dashboard...</p>
    </div>
  );
}
