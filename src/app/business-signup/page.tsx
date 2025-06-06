
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Briefcase } from 'lucide-react';

// This page is deprecated. Users should be redirected to the unified /signup page.
export default function BusinessSignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/signup'); // Redirect to the new unified signup page
  }, [router]);

  return (
    <div className="flex flex-grow flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Briefcase className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="font-headline text-3xl">Register Your Business</CardTitle>
          <CardDescription>Redirecting to our new signup page...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}
