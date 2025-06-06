
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Edit3, Star } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoyaltyPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/loyalty');
    }
  }, [loading, isAuthenticated, router]);

  const currentPoints = user?.mockPurchases?.reduce((sum, p) => sum + p.pointsEarned, 0) || 0;
  const pointsToNextReward = 500; // This can be dynamic later
  const progress = Math.min((currentPoints / pointsToNextReward) * 100, 100); // Cap progress at 100%
  const pointsNeededForNext = Math.max(0, pointsToNextReward - currentPoints);

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="space-y-8">
        <Card className="shadow-lg">
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
         <Card>
          <CardHeader>
            <Skeleton className="h-7 w-2/5 mb-1" />
            <Skeleton className="h-4 w-3/5" />
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-60 rounded-lg" />
            <Skeleton className="h-60 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
            Your Loyalty Status
          </CardTitle>
          <CardDescription>Track your points and progress towards new rewards.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-primary">{currentPoints}</p>
            <p className="text-muted-foreground">Points</p>
          </div>
          
          <div>
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progress to next reward tier</span>
              <span>{currentPoints} / {pointsToNextReward}</span>
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
                <h3 className="text-xl font-semibold font-headline">Loyalty Leap Card</h3>
                <Star className="h-10 w-10 text-yellow-300 fill-yellow-300 opacity-50" />
              </div>
              <p className="text-sm opacity-80">Member ID: {user.id}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{currentPoints} PTS</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Earn More Points</CardTitle>
          <CardDescription>Use QR code at checkout or enter a code manually.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4 p-6 border rounded-lg bg-secondary/30 text-center">
            <QrCode className="h-16 w-16 mx-auto text-primary" />
            <h3 className="text-xl font-semibold">Scan QR Code</h3>
            <p className="text-muted-foreground">Present this QR code at checkout to earn points.</p>
            <div className="bg-white p-2 rounded-md inline-block shadow-md">
              <Image src={`https://placehold.co/150x150.png?text=${user.id.slice(-6)}`} alt="QR Code Placeholder" width={150} height={150} data-ai-hint="QR code user" />
            </div>
            <Button className="w-full mt-2" variant="outline">
              Show My QR Code
            </Button>
          </div>
          <div className="space-y-4 p-6 border rounded-lg bg-secondary/30">
            <Edit3 className="h-12 w-12 mx-auto text-primary md:mx-0" />
            <h3 className="text-xl font-semibold">Enter Code Manually</h3>
            <div className="space-y-2">
              <Label htmlFor="manual-code">Enter your purchase code:</Label>
              <Input id="manual-code" placeholder="e.g., XYZ123ABC" />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90">Submit Code</Button>
            <p className="text-xs text-muted-foreground text-center">Code can be found on your receipt.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
