
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Mail, ShieldCheck, LogOut, Briefcase, Star, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserMembership } from '@/types/user';
import Link from 'next/link';

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
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
  }
  
  const totalPointsAcrossAllBusinesses = user.memberships?.reduce((sum, m) => sum + m.pointsBalance, 0) || 0;

  return (
    <div className="w-full space-y-10 sm:space-y-12">
      <div className="text-center border-b border-border pb-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-2">Your Profile</h1>
        <p className="text-lg text-muted-foreground">Manage your account details and loyalty memberships.</p>
      </div>

      <Card className="shadow-xl max-w-2xl mx-auto bg-card">
        <CardHeader className="items-center text-center border-b pb-6">
          <Avatar className="h-28 w-28 text-4xl mb-4 ring-4 ring-primary/20 shadow-md">
            <AvatarImage src={`https://placehold.co/120x120.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar"/>
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="font-headline text-3xl">{user.name}</CardTitle>
          <CardDescription className="text-base flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4"/> {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-md shadow-sm">
            <UserIcon className="h-5 w-5 text-primary" />
            <p><span className="font-medium">Member ID:</span> {user.id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-md shadow-sm">
            <Star className="h-5 w-5 text-primary" />
            <p><span className="font-medium">Total Points (All Programs):</span> {totalPointsAcrossAllBusinesses}</p>
          </div>
           <div className="flex items-center space-x-3 p-3 bg-green-100 dark:bg-green-900/30 border border-green-500/30 dark:border-green-700/50 rounded-md shadow-sm">
            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-700 dark:text-green-300 font-medium">You are a verified member.</p>
          </div>

          <div>
            <h3 className="text-xl font-headline text-primary mb-4">Your Memberships:</h3>
            {user.memberships && user.memberships.length > 0 ? (
              <ul className="space-y-4">
                {user.memberships.map((membership: UserMembership) => (
                  <li key={membership.businessId} className="p-4 border rounded-lg bg-background shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out hover:border-primary/50">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-7 w-7 text-primary" />
                        <span className="font-semibold text-lg text-foreground">{membership.businessName}</span>
                      </div>
                      <span className="text-lg font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">{membership.pointsBalance} PTS</span>
                    </div>
                     <Button asChild variant="link" size="sm" className="mt-2 p-0 h-auto text-primary hover:text-primary/80 transition-colors">
                       <Link href={`/rewards?businessId=${membership.businessId}`}>View Rewards <ExternalLink className="ml-1.5 h-3.5 w-3.5"/></Link>
                     </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
                <Info className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-lg">You are not yet enrolled in any loyalty programs.</p>
                <Button asChild className="mt-4">
                    <Link href="/loyalty">Join a Program</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t mt-2 pt-6">
          <Button onClick={logout} variant="destructive" className="w-full text-base py-3">
            <LogOut className="mr-2 h-5 w-5" /> Log Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
