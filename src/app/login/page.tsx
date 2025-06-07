
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogIn, User, Briefcase, Building } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const { login: customerLogin, loading: customerAuthLoading, isAuthenticated: isCustomerAuth } = useAuth();
  const { login: adminLogin, loading: adminAuthLoading, isAdminAuthenticated } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  useEffect(() => {
    if (!customerAuthLoading && isCustomerAuth) {
      // Only redirect if there's no specific redirect OR if the redirect is NOT an admin path.
      if (!redirectPath || !redirectPath.startsWith('/admin')) {
        const targetPath = redirectPath && redirectPath.startsWith('/') ? redirectPath : '/loyalty';
        router.push(targetPath);
      }
    }
  }, [isCustomerAuth, customerAuthLoading, router, redirectPath]);

  useEffect(() => {
    if (!adminAuthLoading && isAdminAuthenticated) {
      // Redirect to admin dashboard or specified admin redirect path.
      const targetPath = redirectPath && redirectPath.startsWith('/admin') ? redirectPath : '/admin/dashboard';
      router.push(targetPath);
    }
  }, [isAdminAuthenticated, adminAuthLoading, router, redirectPath]);

  // --- Revised Rendering Logic ---

  // Case 1: Customer is authenticated and context is done loading (and not an admin redirect from customer login attempt)
  // The redirection useEffect for customer should be firing or about to fire. Show "Redirecting...".
  if (!customerAuthLoading && isCustomerAuth && (!redirectPath || !redirectPath.startsWith('/admin'))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,80px)-6rem)]">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // Case 2: Admin is authenticated and context is done loading
  // The redirection useEffect for admin should be firing or about to fire. Show "Redirecting...".
  if (!adminAuthLoading && isAdminAuthenticated) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,80px)-6rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirecting...</p>
        </div>
    );
  }
  
  // Case 3: If either context is still loading (and we haven't met conditions for an immediate redirect display)
  // This means we are actively verifying auth state or fetching profiles.
  if (customerAuthLoading || adminAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,80px)-6rem)]">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading account status...</p>
      </div>
    );
  }

  // Case 4: If none of the above, means not authenticated and not loading, so show login form.
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await customerLogin(customerEmail, customerPassword);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminLogin(adminEmail, adminPassword);
  };

  return (
    <div className="flex flex-grow flex-col items-center justify-center py-8 sm:py-12">
      <Card className="w-full max-w-md shadow-xl mt-8 sm:mt-0">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="font-headline text-3xl">Account Login</CardTitle>
          <CardDescription>Access your Keeva customer or business account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer" aria-label="Login as Customer">
                <User className="mr-2 h-4 w-4" /> Customer
              </TabsTrigger>
              <TabsTrigger value="business" aria-label="Login as Business">
                <Briefcase className="mr-2 h-4 w-4" /> Business
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customer" className="mt-6">
              <form onSubmit={handleCustomerSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="you@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    disabled={customerAuthLoading} 
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-password">Password</Label>
                  <Input
                    id="customer-password"
                    type="password"
                    placeholder="••••••••"
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    required
                    disabled={customerAuthLoading} 
                    aria-required="true"
                  />
                </div>
                <Button type="submit" disabled={customerAuthLoading} className="w-full bg-primary hover:bg-primary/90 text-base py-3">
                  {customerAuthLoading ? ( 
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Log In as Customer"
                  )}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </TabsContent>

            <TabsContent value="business" className="mt-6">
              <form onSubmit={handleAdminSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Business Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@yourbusiness.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    disabled={adminAuthLoading} 
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Business Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    disabled={adminAuthLoading} 
                    aria-required="true"
                  />
                </div>
                <Button type="submit" disabled={adminAuthLoading} className="w-full bg-primary hover:bg-primary/90 text-base py-3">
                  {adminAuthLoading ? ( 
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Log In as Business"
                  )}
                </Button>
              </form>
               <p className="mt-4 text-center text-sm text-muted-foreground">
                New business?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline flex items-center justify-center">
                  <Building className="mr-1 h-4 w-4" /> Register Your Business
                </Link>
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
