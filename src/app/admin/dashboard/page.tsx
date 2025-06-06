
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserTable } from '@/components/admin/UserTable';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/user'; // UserMembership is part of User
import { Users, ShoppingCart, BarChart3, Building } from 'lucide-react';

export default function AdminDashboardPage() {
  const { isAdminAuthenticated, loading: adminLoading, adminUser, getManagedBusiness } = useAdminAuth();
  const { getAllMockUsers } = useAuth(); // Assuming AuthContext provides all users
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [managedBusinessName, setManagedBusinessName] = useState<string | null>(null);

  const fetchUsersAndBusiness = useCallback(() => {
    setLoadingUsers(true);
    const business = getManagedBusiness(); // This now comes from AdminAuthContext
    setManagedBusinessName(business ? business.name : "Your Business");

    if (business) {
      // Filter users who are members of the admin's specific business
      const allUsers = getAllMockUsers();
      const enrolledUsers = allUsers.filter(user => 
        user.memberships?.some(m => m.businessId === business.id)
      );
      setUsers(enrolledUsers);
    } else {
      setUsers([]); // No business context means no users to show for this admin
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

  // Calculate stats specific to the managed business
  const totalPointsInBusiness = users.reduce((total, user) => {
    const membership = user.memberships?.find(m => m.businessId === adminUser?.businessId);
    return total + (membership?.pointsBalance || 0);
  }, 0);

  const totalTransactionsInBusiness = users.reduce((total, user) => {
    const membership = user.memberships?.find(m => m.businessId === adminUser?.businessId);
    return total + (membership?.purchases?.length || 0);
  }, 0);


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
           {managedBusinessName || adminUser?.businessName || 'Admin Dashboard'}
        </h1>
        <p className="text-lg text-muted-foreground">Welcome, {adminUser?.email}. Manage users and activity for your business.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingUsers ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{users.length}</div>}
            <p className="text-xs text-muted-foreground">
              Users enrolled in {managedBusinessName}
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
              Within {managedBusinessName}
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
              Recorded for {managedBusinessName}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">User Management for {managedBusinessName}</CardTitle>
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
