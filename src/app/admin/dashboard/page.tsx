
"use client";

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserTable } from '@/components/admin/UserTable';
import { getAllMockUsers } from '@/contexts/AuthContext'; // We'll get users from here
import type { User } from '@/types/user';
import { Users, ShoppingCart } from 'lucide-react';

export default function AdminDashboardPage() {
  const { isAdminAuthenticated, loading: adminLoading, adminUser } = useAdminAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdminAuthenticated) {
      router.push('/admin/login');
    }
  }, [adminLoading, isAdminAuthenticated, router]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      setLoadingUsers(true);
      // Simulate fetching users
      setTimeout(() => {
        setUsers(getAllMockUsers());
        setLoadingUsers(false);
      }, 500);
    }
  }, [isAdminAuthenticated]);

  const totalPointsAcrossUsers = users.reduce((total, user) => 
    total + (user.mockPurchases?.reduce((sum, p) => sum + p.pointsEarned, 0) || 0), 0
  );

  const totalPurchases = users.reduce((total, user) => 
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15 .35-.35a2.5 2.5 0 0 1 0-3.54l2.82-2.82a2.5 2.5 0 0 1 3.54 0l.35.35M12 9l-.35.35a2.5 2.5 0 0 1 0 3.54l-2.82 2.82a2.5 2.5 0 0 1-3.54 0L5 15.35"/></svg>
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
            {loadingUsers ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalPurchases}</div>}
            <p className="text-xs text-muted-foreground">
              Mock purchase records
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">User Management</CardTitle>
          <CardDescription>View and manage your loyalty program users and their (mock) purchase history.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
             <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
          ) : (
            <UserTable users={users} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
