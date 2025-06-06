
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { PersonalizedOfferForm } from '@/components/offers/PersonalizedOfferForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function OffersPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/offers');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <Skeleton className="h-7 w-48 mb-1" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-8 w-8" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Personalized Offers</h1>
        <p className="text-lg text-muted-foreground">Discover offers and recommendations curated just for you!</p>
      </div>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Generate Your Offer</CardTitle>
            <CardDescription>
              Tell us a bit about your preferences and purchase history to receive a personalized offer.
            </CardDescription>
          </div>
          <Sparkles className="h-8 w-8 text-primary" />
        </CardHeader>
        <CardContent>
          <PersonalizedOfferForm />
        </CardContent>
      </Card>
    </div>
  );
}
