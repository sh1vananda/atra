
"use client";

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Star, Briefcase, User, KeyRound, Loader2, ShoppingBag, FileText } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserMembership } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { AddPastPurchaseDialog } from '@/components/loyalty/AddPastPurchaseDialog'; // Now for appeals

function LoyaltyBusinessCard({ membership, userId }: { membership: UserMembership, userId: string }) {
  const pointsToNextReward = 500; // This can be dynamic per business later
  const progress = Math.min((membership.pointsBalance / pointsToNextReward) * 100, 100);
  const pointsNeededForNext = Math.max(0, pointsToNextReward - membership.pointsBalance);

  return (
    <Card className="shadow-lg w-full bg-card transform hover:shadow-xl transition-shadow duration-300 ease-in-out hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-xl sm:text-2xl flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            {membership.businessName}
          </CardTitle>
          <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
        </div>
        <CardDescription>Your loyalty status with {membership.businessName}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-4xl sm:text-5xl font-bold text-primary">{membership.pointsBalance}</p>
          <p className="text-muted-foreground">Points</p>
        </div>
        
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progress to next reward</span>
            <span>{membership.pointsBalance} / {pointsToNextReward}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 sm:h-4 overflow-hidden shadow-inner">
            <div
              className="bg-accent h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
           <p className="text-xs text-muted-foreground mt-1.5 text-center">
             {pointsNeededForNext > 0 ? `You are ${pointsNeededForNext} points away from your next reward!` : "You've reached the next reward tier!"}
           </p>
        </div>

        <div className="aspect-[16/10] w-full max-w-sm mx-auto bg-gradient-to-br from-primary to-blue-700 rounded-xl shadow-2xl p-4 sm:p-6 flex flex-col justify-between text-primary-foreground">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="text-lg sm:text-xl font-semibold font-headline">{membership.businessName} Card</h3>
              <Star className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-300 fill-yellow-300 opacity-50" />
            </div>
            <p className="text-xs sm:text-sm opacity-80">Member ID: {userId.slice(-6).toUpperCase()}</p>
          </div>
          <div className="text-right mt-auto">
            <p className="text-2xl sm:text-3xl font-bold">{membership.pointsBalance} PTS</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function LoyaltyPage() {
  const { user, isAuthenticated, loading, joinBusinessByCode } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [businessCode, setBusinessCode] = useState('');
  const [isJoining, startJoiningTransition] = useTransition();
  const [isAddAppealDialogOpen, setIsAddAppealDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/loyalty');
    }
  }, [loading, isAuthenticated, router]);

  const handleJoinBusiness = useCallback(async () => {
    if (!businessCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a business code.",
        variant: "destructive",
      });
      return;
    }
    startJoiningTransition(async () => {
      const result = await joinBusinessByCode(businessCode.trim().toUpperCase());
      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
          variant: "default",
        });
        setBusinessCode(''); 
      } else {
        toast({
          title: "Join Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  }, [businessCode, joinBusinessByCode, toast]);
  

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
                <Skeleton className="aspect-[16/10] w-full max-w-sm mx-auto rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
         <Card className="mt-8 shadow-lg bg-card">
          <CardHeader>
            <Skeleton className="h-7 w-1/3 mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
             <Skeleton className="h-10 w-1/3" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  const memberships = user.memberships || [];

  return (
    <>
    <div className="w-full space-y-10 sm:space-y-12">
      <div className="text-left pb-4 border-b border-border">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-1 flex items-center">
          <User className="inline-block h-8 w-8 mr-3 align-text-bottom" /> 
          Welcome back, {user.name}!
        </h1>
        <p className="text-lg text-muted-foreground">Here are your loyalty cards. Track your points and progress.</p>
      </div>

      {memberships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
          {memberships.map((membership) => (
            <LoyaltyBusinessCard key={membership.businessId} membership={membership} userId={user.id} />
          ))}
        </div>
      ) : (
        <Card className="shadow-lg text-center py-10 sm:py-12 bg-card">
          <CardHeader>
            <ShoppingBag className="h-16 w-16 mx-auto text-primary mb-4 opacity-70" />
            <CardTitle className="font-headline text-2xl sm:text-3xl">No Loyalty Programs Joined</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg mb-6">Join a program using a business code below to start earning rewards!</CardDescription>
            <Button onClick={() => document.getElementById('join-program-section')?.scrollIntoView({ behavior: 'smooth' })} variant="default" size="lg" aria-label="Scroll to join program section">
                Join a Program
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-8 shadow-xl bg-card" id="join-program-section">
        <CardHeader>
          <CardTitle className="font-headline text-2xl sm:text-3xl flex items-center gap-2">
            <KeyRound className="h-7 w-7 text-primary" />
            Join a New Loyalty Program
          </CardTitle>
          <CardDescription>Enter the unique code provided by a business to enroll.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="business-code" className="text-base">Business Code</Label>
            <Input 
              id="business-code" 
              aria-label="Business Code Input"
              placeholder="e.g., CAFE123" 
              value={businessCode}
              onChange={(e) => setBusinessCode(e.target.value.toUpperCase())} 
              className="mt-1 text-base py-3 px-4"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleJoinBusiness} disabled={isJoining || !businessCode.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-base py-3 px-6">
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Program"
            )}
          </Button>
        </CardFooter>
      </Card>


      <Card className="mt-10 sm:mt-12 shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="font-headline text-2xl sm:text-3xl">Earn More Points</CardTitle>
          <CardDescription>Present your QR code or submit a purchase appeal if you forgot to scan.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-4 p-6 border rounded-lg bg-muted/50 text-center shadow-sm hover:shadow-md transition-shadow">
            <Image data-ai-hint="QR code user" src={`https://placehold.co/150x150.png?text=${user.id.slice(-6).toUpperCase()}`} alt="Your unique QR Code" width={150} height={150} className="mx-auto bg-white p-2 rounded-md shadow-md"/>
            <h3 className="text-xl font-semibold">Your Universal QR Code</h3>
            <p className="text-muted-foreground">Present this at participating businesses.</p>
            <Button className="w-full mt-2" variant="outline" onClick={() => toast({ title: "Feature Coming Soon", description: "Displaying a larger QR code is planned!"})}>
              Show My QR Code
            </Button>
          </div>
          <div className="space-y-4 p-6 border rounded-lg bg-muted/50 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <FileText className="h-16 w-16 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-semibold text-center">Submit Purchase Appeal</h3>
            <p className="text-muted-foreground text-sm text-center mb-3">Forgot to scan? Add details for an enrolled business to request points.</p>
            <Button 
                onClick={() => {
                    if (memberships.length > 0) {
                        setIsAddAppealDialogOpen(true);
                    } else {
                        toast({
                            title: "No Memberships",
                            description: "Join a loyalty program first before submitting an appeal.",
                            variant: "default"
                        });
                    }
                }}
                className="w-full bg-primary hover:bg-primary/90"
                aria-label="Open purchase appeal dialog"
            >
                Submit Appeal
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">Points added after business review and approval.</p>
          </div>
        </CardContent>
      </Card>
    </div>
    {isAddAppealDialogOpen && user && (
        <AddPastPurchaseDialog
            user={user}
            isOpen={isAddAppealDialogOpen}
            onOpenChange={setIsAddAppealDialogOpen}
        />
    )}
    </>
  );
}
