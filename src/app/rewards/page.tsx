
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { RewardCard } from '@/components/rewards/RewardCard';
import { Gift, Briefcase, ArrowLeft, Info, ShoppingBag, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Button } from '@/components/ui/button';
import type { Business } from '@/types/business';
import type { UserMembership } from '@/types/user';
import Link from 'next/link';

export default function RewardsPage() {
  const { user, isAuthenticated, loading: authLoading, getBusinessById } = useAuth();
  const router = useRouter();
  
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedBusinessMembership, setSelectedBusinessMembership] = useState<UserMembership | null>(null);
  const [enrolledBusinessesWithDetails, setEnrolledBusinessesWithDetails] = useState<Business[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/rewards');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchEnrolledBusinessesData = useCallback(async () => {
    if (user && user.memberships && user.memberships.length > 0) {
      setPageLoading(true);
      try {
        const businessesPromises = user.memberships.map(
          (membership: UserMembership) => getBusinessById(membership.businessId)
        );
        const businessesResults = await Promise.all(businessesPromises);
        const validBusinesses = businessesResults.filter((b): b is Business => b !== null);
        
        // Filter out businesses that don't have rewards OR where the user has no membership for them
        const businessesWithRewardsAndMembership = validBusinesses.filter(business => 
          (business.rewards && business.rewards.length > 0) && 
          user.memberships?.some(m => m.businessId === business.id)
        );
        setEnrolledBusinessesWithDetails(businessesWithRewardsAndMembership);

      } catch (error) {
        // Error is handled by getBusinessById's toast
      } finally {
        setPageLoading(false);
      }
    } else {
      setEnrolledBusinessesWithDetails([]);
      setPageLoading(false);
    }
  }, [user, getBusinessById]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchEnrolledBusinessesData();
    } else if (!authLoading && !isAuthenticated) {
      setPageLoading(false); // Not logged in, no data to fetch
    }
  }, [isAuthenticated, user, authLoading, fetchEnrolledBusinessesData]);

  const handleSelectBusiness = useCallback((business: Business) => {
    setSelectedBusiness(business);
    const membership = user?.memberships?.find(m => m.businessId === business.id) || null;
    setSelectedBusinessMembership(membership);
  }, [user?.memberships]);

  const handleRewardRedeemed = useCallback(() => {
    // Re-derive selectedBusinessMembership from the updated user object from AuthContext
    if (user && selectedBusiness) {
      const updatedMembership = user.memberships?.find(m => m.businessId === selectedBusiness.id);
      setSelectedBusinessMembership(updatedMembership || null);
    }
    // Optionally, re-fetch business details if rewards might change (e.g., stock)
    // For now, relying on context update for points is sufficient.
  }, [user, selectedBusiness]);

  if (authLoading || pageLoading) {
    return (
      <div className="w-full space-y-8">
        <div className="text-center border-b border-border pb-6 mb-8">
          <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        {selectedBusiness ? (
          <>
            <Skeleton className="h-10 w-40 mb-4" /> {/* Back button skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <RewardCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <BusinessCardSkeleton key={i} />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  if (!isAuthenticated || !user) { // Ensure user object exists
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,80px)-6rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }


  if (selectedBusiness && selectedBusinessMembership) {
    const userPointsForSelectedBusiness = selectedBusinessMembership.pointsBalance;
    return (
      <div className="w-full space-y-8">
        <Button variant="outline" onClick={() => { setSelectedBusiness(null); setSelectedBusinessMembership(null); }} className="mb-2 sm:mb-6 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Businesses
        </Button>
        <div className="text-center border-b border-border pb-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-2">
            Rewards from {selectedBusiness.name}
          </h1>
          <p className="text-lg text-muted-foreground">
            Redeem your points for these exclusive rewards.
          </p>
          <p className="text-xl font-semibold text-accent mt-3">
            Your Points: {userPointsForSelectedBusiness}
          </p>
        </div>
        {selectedBusiness.rewards && selectedBusiness.rewards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedBusiness.rewards.map((reward) => (
              <RewardCard 
                key={reward.id} 
                reward={reward} 
                businessId={selectedBusiness.id}
                userPointsInBusiness={userPointsForSelectedBusiness}
                onRewardRedeemed={handleRewardRedeemed}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 bg-card shadow-md col-span-full">
            <CardHeader>
              <ShoppingBag className="h-16 w-16 mx-auto text-primary mb-4 opacity-70" />
              <CardTitle className="font-headline text-2xl">No Rewards Available</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-lg">{selectedBusiness.name} currently has no rewards listed. Check back soon!</CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="text-center border-b border-border pb-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-2">Select a Business</h1>
        <p className="text-lg text-muted-foreground">Choose a loyalty program to view its rewards catalog.</p>
      </div>
      {enrolledBusinessesWithDetails.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledBusinessesWithDetails.map((business) => (
            <Card 
              key={business.id} 
              className="bg-card hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
              onClick={() => handleSelectBusiness(business)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectBusiness(business)}
            >
              <CardHeader className="flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Briefcase className="h-8 w-8 text-primary flex-shrink-0" />
                </div>
                <div>
                  <CardTitle className="font-headline text-xl group-hover:text-primary transition-colors">{business.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {business.rewards?.length || 0} reward{business.rewards?.length !== 1 ? 's' : ''} available
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 h-10">{business.description}</p>
                 <Button variant="link" className="p-0 h-auto text-sm text-primary group-hover:underline">View Rewards <ArrowLeft className="h-4 w-4 ml-1.5 transform rotate-180 group-hover:translate-x-1 transition-transform duration-200" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 bg-card shadow-md col-span-full">
           <CardHeader>
            <Info className="h-16 w-16 mx-auto text-primary mb-4 opacity-70" />
            <CardTitle className="font-headline text-2xl">No Loyalty Programs With Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg">You haven't joined any loyalty programs that currently offer rewards, or there are no rewards listed yet. Once you do, you'll see them here.</CardDescription>
            <Button asChild className="mt-6">
              <Link href="/loyalty">Join a Program</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BusinessCardSkeleton() {
  return (
    <Card className="w-full bg-card">
      <CardHeader className="flex-row items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div>
          <Skeleton className="h-6 w-32 mb-1.5" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-1.5" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Skeleton className="h-5 w-28" />
      </CardContent>
    </Card>
  );
}

function RewardCardSkeleton() {
  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-7 w-3/4 mb-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6 mb-3" />
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t">
        <Skeleton className="h-7 w-24 mb-2 sm:mb-0" />
        <Skeleton className="h-10 w-full sm:w-28" />
      </CardFooter>
    </Card>
  );
}

