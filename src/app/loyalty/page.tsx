
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label'; // Added import
import { Input } from '@/components/ui/input'; // Added import for completeness
import { QrCode, Edit3, Star, Briefcase, User, Info } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserMembership } from '@/types/user';

function LoyaltyBusinessCard({ membership, userId }: { membership: UserMembership, userId: string }) {
  const pointsToNextReward = 500; // This can be dynamic per business later
  const progress = Math.min((membership.pointsBalance / pointsToNextReward) * 100, 100);
  const pointsNeededForNext = Math.max(0, pointsToNextReward - membership.pointsBalance);

  return (
    <Card className="shadow-lg w-full bg-card transform hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            {membership.businessName}
          </CardTitle>
          <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
        </div>
        <CardDescription>Your loyalty status with {membership.businessName}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-5xl font-bold text-primary">{membership.pointsBalance}</p>
          <p className="text-muted-foreground">Points</p>
        </div>
        
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progress to next reward</span>
            <span>{membership.pointsBalance} / {pointsToNextReward}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
            <div
              className="bg-accent h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
           <p className="text-xs text-muted-foreground mt-1 text-center">
             {pointsNeededForNext > 0 ? `You are ${pointsNeededForNext} points away from your next reward!` : "You've reached the next reward tier!"}
           </p>
        </div>

        <div className="aspect-[16/10] w-full max-w-md mx-auto bg-gradient-to-br from-primary to-blue-700 rounded-xl shadow-2xl p-6 flex flex-col justify-between text-primary-foreground">
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold font-headline">{membership.businessName} Card</h3>
              <Star className="h-10 w-10 text-yellow-300 fill-yellow-300 opacity-50" />
            </div>
            <p className="text-sm opacity-80">Member ID: {userId.slice(-6).toUpperCase()} (for {membership.businessName})</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{membership.pointsBalance} PTS</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function LoyaltyPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/loyalty');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="w-full space-y-8">
        <div className="text-left mb-6 pb-4 border-b">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-5 w-3/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="shadow-lg w-full">
              <CardHeader>
                <Skeleton className="h-8 w-3/5 mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <Skeleton className="h-12 w-24 mx-auto mb-1" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-3 w-1/2 mx-auto mt-1" />
                </div>
                <Skeleton className="aspect-[16/10] w-full max-w-md mx-auto rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const memberships = user.memberships || [];

  return (
    <div className="w-full space-y-12">
      <div className="text-left pb-4 border-b border-border">
        <h1 className="text-3xl font-headline font-bold text-primary mb-1 flex items-center">
          <User className="inline-block h-8 w-8 mr-3 align-text-bottom" /> 
          Welcome back, {user.name}!
        </h1>
        <p className="text-lg text-muted-foreground">Here are your loyalty cards. Track your points and progress with each business.</p>
      </div>

      {memberships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {memberships.map((membership) => (
            <LoyaltyBusinessCard key={membership.businessId} membership={membership} userId={user.id} />
          ))}
        </div>
      ) : (
        <Card className="shadow-lg text-center py-12 bg-card">
          <CardHeader>
            <Info className="h-12 w-12 mx-auto text-primary mb-3" />
            <CardTitle className="font-headline text-2xl">No Loyalty Programs Joined Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg mb-4">Explore businesses and join their loyalty programs to start earning rewards!</CardDescription>
            <Button variant="default">Find Businesses (Coming Soon)</Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-12 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Earn More Points</CardTitle>
          <CardDescription>Use your universal QR code at checkout or enter a purchase code manually (feature coming soon for specific businesses).</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4 p-6 border rounded-lg bg-background text-center">
            <QrCode className="h-16 w-16 mx-auto text-primary" />
            <h3 className="text-xl font-semibold">Your Universal QR Code</h3>
            <p className="text-muted-foreground">Present this QR code at any participating business to identify yourself.</p>
            <div className="bg-white p-2 rounded-md inline-block shadow-md">
              <Image src={`https://placehold.co/150x150.png?text=${user.id.slice(-6).toUpperCase()}`} alt="QR Code Placeholder" width={150} height={150} data-ai-hint="QR code user" />
            </div>
            <Button className="w-full mt-2" variant="outline">
              Show My QR Code
            </Button>
          </div>
          <div className="space-y-4 p-6 border rounded-lg bg-background">
            <Edit3 className="h-12 w-12 mx-auto text-primary md:mx-0" />
            <h3 className="text-xl font-semibold">Enter Code Manually</h3>
            <p className="text-muted-foreground text-sm mb-2">Functionality to enter codes for specific businesses is under development.</p>
            <div className="space-y-2">
              <Label htmlFor="manual-code">Enter your purchase code:</Label>
              <Input id="manual-code" placeholder="e.g., XYZ123ABC" disabled />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90" disabled>Submit Code</Button>
            <p className="text-xs text-muted-foreground text-center">Code can be found on your receipt.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
