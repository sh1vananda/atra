
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { HardHat, Sparkles } from 'lucide-react'; // Using HardHat for maintenance
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
      <div className="w-full space-y-8">
        <div className="text-center border-b border-border pb-6 mb-8">
          <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <Card className="shadow-lg bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <Skeleton className="h-7 w-48 mb-1" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-8 w-8" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Skeleton className="h-12 w-12 rounded-full mb-4"/>
              <Skeleton className="h-6 w-1/2 mb-2"/>
              <Skeleton className="h-4 w-3/4"/>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="text-center border-b border-border pb-6 mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Personalized Offers</h1>
        <p className="text-lg text-muted-foreground">Discover offers and recommendations curated just for you!</p>
      </div>
      <Card className="shadow-lg bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Feature Under Maintenance</CardTitle>
            <CardDescription>
              We're working hard to bring you exciting personalized offers.
            </CardDescription>
          </div>
          <Sparkles className="h-8 w-8 text-primary/50" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <HardHat className="h-20 w-20 text-primary/70 mb-6" />
            <p className="text-xl font-semibold text-foreground mb-2">This feature is currently unavailable.</p>
            <p className="text-muted-foreground max-w-md">
              Our team is making some improvements to the personalized offers engine. Please check back soon!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
