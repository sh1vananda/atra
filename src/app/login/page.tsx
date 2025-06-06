
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
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPassword, setBusinessPassword] = useState('');

  const { login: customerLogin, loading: customerAuthLoading, isAuthenticated: isCustomerAuth } = useAuth();
  const { login: businessLogin, loading: adminAuthLoading, isAdminAuthenticated } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isCheckingAuth = customerAuthLoading || adminAuthLoading;

  // Effect for customer redirection
  useEffect(() => {
    const redirectPath = searchParams.get('redirect');
    console.log(`LoginPage:EFFECT[customerAuth]: customerAuthLoading: ${customerAuthLoading}, isCustomerAuth: ${isCustomerAuth}, redirect: ${redirectPath}`);
    if (!customerAuthLoading && isCustomerAuth) {
      const targetPath = redirectPath && redirectPath.startsWith('/') ? redirectPath : '/loyalty';
      console.log(`LoginPage:EFFECT[customerAuth]: Redirecting authenticated customer to ${targetPath}`);
      router.push(targetPath);
    }
  }, [isCustomerAuth, customerAuthLoading, router, searchParams]);

  // Effect for admin redirection
  useEffect(() => {
    const redirectPath = searchParams.get('redirect');
    console.log(`LoginPage:EFFECT[adminAuth]: adminAuthLoading: ${adminAuthLoading}, isAdminAuthenticated: ${isAdminAuthenticated}, redirect: ${redirectPath}`);
    if (!adminAuthLoading && isAdminAuthenticated) {
      const targetPath = redirectPath && redirectPath.startsWith('/admin') ? redirectPath : '/admin/dashboard';
      console.log(`LoginPage:EFFECT[adminAuth]: Redirecting authenticated admin to ${targetPath}`);
      router.push(targetPath);
    }
  }, [isAdminAuthenticated, adminAuthLoading, router, searchParams]);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await customerLogin(customerEmail, customerPassword);
    // Redirection handled by useEffect
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await businessLogin(businessEmail, businessPassword);
    // Redirection handled by useEffect
  };
  
  if (isCheckingAuth && (!isCustomerAuth && !isAdminAuthenticated)) {
    // Show loader only if actively checking auth AND user is not already authenticated
    // (to prevent loader flashing if already authenticated and about to redirect)
    console.log(`LoginPage:RENDER: Showing main loader. customerAuthLoading: ${customerAuthLoading}, adminAuthLoading: ${adminAuthLoading}`);
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading account status...</p>
        </div>
    );
  }

  // If already authenticated (and not loading), redirection useEffects should handle it.
  // This prevents rendering the form briefly before redirecting.
  if ((!customerAuthLoading && isCustomerAuth) || (!adminAuthLoading && isAdminAuthenticated)) {
    console.log(`LoginPage:RENDER: Authenticated, waiting for redirect effect. isCustomerAuth: ${isCustomerAuth}, isAdminAuthenticated: ${isAdminAuthenticated}`);
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirecting...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-grow flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="font-headline text-3xl">Account Login</CardTitle>
          <CardDescription>Access your ATRA customer or business account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">
                <User className="mr-2 h-4 w-4" /> Customer
              </TabsTrigger>
              <TabsTrigger value="business">
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
                  />
                </div>
                <Button type="submit" disabled={customerAuthLoading} className="w-full bg-primary hover:bg-primary/90">
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
              <form onSubmit={handleBusinessSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="business-email">Business Email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    placeholder="admin@yourbusiness.com"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    required
                    disabled={adminAuthLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-password">Business Password</Label>
                  <Input
                    id="business-password"
                    type="password"
                    placeholder="••••••••"
                    value={businessPassword}
                    onChange={(e) => setBusinessPassword(e.target.value)}
                    required
                    disabled={adminAuthLoading}
                  />
                </div>
                <Button type="submit" disabled={adminAuthLoading} className="w-full bg-primary hover:bg-primary/90">
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
