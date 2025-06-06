
"use client";

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

// This page is deprecated as login is handled by the unified /login page.
// It can be modified to redirect or removed. For now, it will redirect.
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login'); // Redirect to the unified login page
  }, [router]);


  // Fallback content while redirecting
  return (
    <div className="flex flex-grow flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="font-headline text-3xl">Business Portal Login</CardTitle>
          <CardDescription>Redirecting to the main login page...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
       <p className="mt-6 text-center text-sm">
        <Link href="/" className="font-medium text-primary hover:underline">
          Back to customer site
        </Link>
      </p>
    </div>
  );
}
