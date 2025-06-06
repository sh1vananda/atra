
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Mail, ShieldCheck, LogOut, Briefcase, Star, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserMembership } from '@/types/user';

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
      <div className="w-full space-y-8">
        <div className="text-center border-b border-border pb-6 mb-8">
          <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <Card className="shadow-lg max-w-lg mx-auto bg-card">
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
  
  const totalPointsAcrossAllBusinesses = user.memberships?.reduce((sum, m) => sum + m.pointsBalance, 0) || 0;

  return (
    <div className="w-full space-y-8">
      <div className="text-center border-b border-border pb-6 mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Your Profile</h1>
        <p className="text-lg text-muted-foreground">Manage your account details and loyalty memberships.</p>
      </div>

      <Card className="shadow-lg max-w-2xl mx-auto bg-card">
        <CardHeader className="items-center text-center border-b pb-6">
          <Avatar className="h-24 w-24 text-3xl mb-4 ring-4 ring-primary/20">
            <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar"/>
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="font-headline text-2xl">{user.name}</CardTitle>
          <CardDescription className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground"/> {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-md">
            <UserIcon className="h-5 w-5 text-primary" />
            <p><span className="font-medium">Member ID:</span> {user.id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-md">
            <Star className="h-5 w-5 text-primary" />
            <p><span className="font-medium">Total Points (All Programs):</span> {totalPointsAcrossAllBusinesses}</p>
          </div>
           <div className="flex items-center space-x-3 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md">
            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-700 dark:text-green-300">You are a verified member.</p>
          </div>

          <div>
            <h3 className="text-xl font-headline text-primary mb-3">Your Memberships:</h3>
            {user.memberships && user.memberships.length > 0 ? (
              <ul className="space-y-3">
                {user.memberships.map((membership: UserMembership) => (
                  <li key={membership.businessId} className="p-4 border rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-6 w-6 text-primary" />
                        <span className="font-semibold text-lg">{membership.businessName}</span>
                      </div>
                      <span className="text-lg font-bold text-accent">{membership.pointsBalance} PTS</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 border rounded-lg bg-background">
                <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">You are not yet enrolled in any loyalty programs.</p>
              </div>
            )}
          </div>

          <Button onClick={logout} variant="destructive" className="w-full mt-6 text-base py-3">
            <LogOut className="mr-2 h-5 w-5" /> Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
