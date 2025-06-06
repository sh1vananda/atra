
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserTable } from '@/components/admin/UserTable';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/user'; 
import { Users, ShoppingCart, BarChart3, Building, KeyRound, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Business } from '@/types/business';

export default function AdminDashboardPage() {
  const { isAdminAuthenticated, loading: adminLoading, adminUser, getManagedBusiness } = useAdminAuth();
  const { getAllMockUsers } = useAuth(); // This now fetches from Firestore
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [managedBusiness, setManagedBusiness] = useState<Business | null>(null);

  const fetchUsersAndBusiness = useCallback(async () => {
    setLoadingUsers(true);
    const business = getManagedBusiness();
    setManagedBusiness(business || null);

    if (business) {
      const allUsersFromDb = await getAllMockUsers();
      const enrolledUsers = allUsersFromDb.filter(user =>
        user.memberships?.some(m => m.businessId === business.id)
      );
      setUsers(enrolledUsers);
    } else {
      setUsers([]);
    }
    setLoadingUsers(false);
  }, [getManagedBusiness, getAllMockUsers]);


  useEffect(() => {
    if (!adminLoading && !isAdminAuthenticated) {
      router.push('/admin/login');
    }
  }, [adminLoading, isAdminAuthenticated, router]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchUsersAndBusiness();
    }
  }, [isAdminAuthenticated, fetchUsersAndBusiness]);

  const totalPointsInBusiness = users.reduce((total, user) => {
    const membership = user.memberships?.find(m => m.businessId === adminUser?.businessId);
    return total + (membership?.pointsBalance || 0);
  }, 0);

  const totalTransactionsInBusiness = users.reduce((total, user) => {
    const membership = user.memberships?.find(m => m.businessId === adminUser?.businessId);
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
          console.error("Failed to copy join code: ", err);
          toast({
            title: "Error",
            description: "Could not copy join code.",
            variant: "destructive",
          });
        });
    }
  };

  if (adminLoading || !isAdminAuthenticated || !adminUser) {
    return (
      <div className="w-full space-y-8">
        <div className="text-left pb-4 border-b border-border">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-5 w-3/4" />
        </div>
        <Card className="bg-card">
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

  return (
    <div className="w-full space-y-8">
      <div className="text-left pb-4 border-b border-border">
        <h1 className="text-3xl font-headline font-bold text-primary mb-1 flex items-center">
           <Building className="inline-block h-8 w-8 mr-3 align-text-bottom" />
           {managedBusiness?.name || adminUser?.businessName || 'Admin Dashboard'}
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
              Share this code with your customers so they can join your loyalty program on Loyalty Leap.
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
            {loadingUsers ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{users.length}</div>}
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
             {loadingUsers ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalPointsInBusiness}</div>}
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
            {loadingUsers ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalTransactionsInBusiness}</div>}
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
          {loadingUsers ? (
             <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
          ) : (
            <UserTable users={users} onUserUpdate={fetchUsersAndBusiness} businessId={adminUser?.businessId || ""} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
