
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserTable } from '@/components/admin/UserTable';
import { useAuth } from '@/contexts/AuthContext'; // For getAllMockUsers
import type { User } from '@/types/user';
import { Users, ShoppingCart, BarChart3 } from 'lucide-react'; // Added BarChart3 for points

export default function AdminDashboardPage() {
  const { isAdminAuthenticated, loading: adminLoading, adminUser } = useAdminAuth();
  const { getAllMockUsers } = useAuth(); // Get the function from AuthContext
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = useCallback(() => {
    setLoadingUsers(true);
    // Simulate fetching users
    setTimeout(() => {
      setUsers(getAllMockUsers()); // Use the function from AuthContext
      setLoadingUsers(false);
    }, 100); // Short delay for refresh indication
  }, [getAllMockUsers]);


  useEffect(() => {
    if (!adminLoading && !isAdminAuthenticated) {
      router.push('/admin/login');
    }
  }, [adminLoading, isAdminAuthenticated, router]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchUsers();
    }
  }, [isAdminAuthenticated, fetchUsers]);

  const totalPointsAcrossUsers = users.reduce((total, user) => 
    total + (user.mockPurchases?.reduce((sum, p) => sum + p.pointsEarned, 0) || 0), 0
  );

  const totalPurchasesCount = users.reduce((total, user) => 
    total + (user.mockPurchases?.length || 0), 0
  );

  if (adminLoading || !isAdminAuthenticated) {
    return (
      <div className="space-y-8">
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

  return (
    <div className="space-y-8">
      <div className="text-left">
        <h1 className="text-3xl font-headline font-bold text-primary mb-1">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground">Welcome, {adminUser?.businessName || 'Admin'}. Manage your users and view activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingUsers ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{users.length}</div>}
            <p className="text-xs text-muted-foreground">
              Number of registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points Issued (Mock)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loadingUsers ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalPointsAcrossUsers}</div>}
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions (Mock)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingUsers ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalPurchasesCount}</div>}
            <p className="text-xs text-muted-foreground">
              Mock purchase records
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">User Management</CardTitle>
          <CardDescription>View users, their (mock) purchase history, and add new purchases.</CardDescription>
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
            <UserTable users={users} onUserUpdate={fetchUsers} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
