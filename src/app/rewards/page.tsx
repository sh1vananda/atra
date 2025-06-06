
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { RewardCard } from '@/components/rewards/RewardCard';
import { Gift, Briefcase, ArrowLeft, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Business } from '@/types/business';
import type { UserMembership } from '@/types/user';


export default function RewardsPage() {
  const { user, isAuthenticated, loading, getBusinessById } = useAuth();
  const router = useRouter();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [enrolledBusinesses, setEnrolledBusinesses] = useState<Business[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/rewards');
    }
  }, [loading, isAuthenticated, router]);

  const fetchEnrolledBusinesses = useCallback(async () => {
    if (user && user.memberships) {
      setDataLoading(true);
      const businessesPromises = user.memberships.map(
        (membership: UserMembership) => getBusinessById(membership.businessId)
      );
      const businessesResults = await Promise.all(businessesPromises);
      setEnrolledBusinesses(businessesResults.filter((b): b is Business => b !== null));
      setDataLoading(false);
    } else if (!user?.memberships || user.memberships.length === 0) {
        setDataLoading(false);
    }
  }, [user, getBusinessById]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchEnrolledBusinesses();
    }
  }, [isAuthenticated, user, fetchEnrolledBusinesses]);


  if (loading || dataLoading || !isAuthenticated || !user) {
    return (
      <div className="w-full space-y-8">
        <div className="text-center border-b border-border pb-6 mb-8">
          <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <BusinessCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (selectedBusiness) {
    return (
      <div className="w-full space-y-8">
        <Button variant="outline" onClick={() => setSelectedBusiness(null)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Businesses
        </Button>
        <div className="text-center border-b border-border pb-6 mb-8">
          <h1 className="text-4xl font-headline font-bold text-primary mb-2">
            Rewards from {selectedBusiness.name}
          </h1>
          <p className="text-lg text-muted-foreground">
            Redeem your points for these exclusive rewards.
          </p>
        </div>
        {selectedBusiness.rewards && selectedBusiness.rewards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedBusiness.rewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 bg-card">
            <CardHeader>
              <Info className="h-12 w-12 mx-auto text-primary mb-3" />
              <CardTitle className="font-headline text-xl">No Rewards Available</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{selectedBusiness.name} currently has no rewards listed.</CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="text-center border-b border-border pb-6 mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Select a Business</h1>
        <p className="text-lg text-muted-foreground">Choose a loyalty program to view its rewards catalog.</p>
      </div>
      {enrolledBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledBusinesses.map((business) => (
            <Card 
              key={business.id} 
              className="bg-card hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
              onClick={() => setSelectedBusiness(business)}
            >
              <CardHeader className="flex-row items-center gap-4">
                <Briefcase className="h-10 w-10 text-primary flex-shrink-0" />
                <div>
                  <CardTitle className="font-headline text-xl">{business.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {business.rewards?.length || 0} reward{business.rewards?.length !== 1 ? 's' : ''} available
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{business.description}</p>
                 <Button variant="link" className="p-0 h-auto text-primary group-hover:underline">View Rewards <ArrowLeft className="h-4 w-4 ml-1 transform rotate-180 group-hover:translate-x-1 transition-transform duration-200" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 bg-card">
           <CardHeader>
            <Info className="h-12 w-12 mx-auto text-primary mb-3" />
            <CardTitle className="font-headline text-xl">No Loyalty Programs Joined</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>You haven't joined any loyalty programs yet. Once you do, you'll see them here.</CardDescription>
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
        <Skeleton className="h-10 w-10 rounded-md" />
        <div>
          <Skeleton className="h-6 w-32 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Skeleton className="h-5 w-20" />
      </CardContent>
    </Card>
  );
}
