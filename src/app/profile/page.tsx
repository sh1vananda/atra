
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Mail, ShieldCheck, LogOut, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <Card className="shadow-lg max-w-lg mx-auto">
          <CardHeader className="items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-8 w-1/2 mx-auto mb-1" />
            <Skeleton className="h-5 w-2/3 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-8 w-full" />
            </div>
             <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  const totalPoints = user.mockPurchases?.reduce((sum, p) => sum + p.pointsEarned, 0) || 0;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Your Profile</h1>
        <p className="text-lg text-muted-foreground">Manage your account details and preferences.</p>
      </div>

      <Card className="shadow-lg max-w-lg mx-auto">
        <CardHeader className="items-center text-center border-b pb-6">
          <Avatar className="h-24 w-24 text-3xl mb-4 ring-4 ring-primary/20">
            <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="font-headline text-2xl">{user.name}</CardTitle>
          <CardDescription className="text-base">{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-md">
            <UserIcon className="h-5 w-5 text-primary" />
            <p><span className="font-medium">Member ID:</span> {user.id}</p>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-md">
            <Mail className="h-5 w-5 text-primary" />
            <p><span className="font-medium">Email:</span> {user.email}</p>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-md">
            <Gift className="h-5 w-5 text-primary" />
            <p><span className="font-medium">Total Points (Mock):</span> {totalPoints}</p>
          </div>
           <div className="flex items-center space-x-3 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md">
            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-700 dark:text-green-300">You are a verified member.</p>
          </div>
          <Button onClick={logout} variant="destructive" className="w-full mt-4">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
