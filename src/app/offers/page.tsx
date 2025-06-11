
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles, TestTube2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// PersonalizedOfferForm is no longer directly used here for now
// import dynamic from 'next/dynamic';
// const PersonalizedOfferForm = dynamic(() =>
//   import('@/components/offers/PersonalizedOfferForm').then((mod) => mod.PersonalizedOfferForm)
// );

export default function OffersPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/offers');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated || !user) {
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
    <div className="w-full space-y-10 sm:space-y-12">
      <div className="text-center border-b border-border pb-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-2">Personalized Offers</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover offers and recommendations potentially curated for you using AI!
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
        <TestTube2 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        <AlertTitle className="font-semibold">Experimental AI Feature</AlertTitle>
        <AlertDescription>
          The AI-powered personalized offer generator is currently under development. Check back soon for exciting new features!
        </AlertDescription>
      </Alert>

      <Card className="shadow-xl bg-card max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle className="font-headline text-2xl sm:text-3xl flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-primary" />
                Coming Soon!
            </CardTitle>
            <CardDescription>
              Our AI is working hard to bring you tailored offers. This section will be updated shortly.
            </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Sparkles className="h-16 w-16 text-primary mx-auto animate-pulse" />
           <p className="text-muted-foreground mt-4">Personalized offers are on their way!</p>
        </CardContent>
      </Card>
    </div>
  );
}
