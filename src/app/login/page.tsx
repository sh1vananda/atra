
"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogIn, User, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [businessEmail, setBusinessEmail] = useState('admin@example.com'); // Pre-fill for convenience
  const [businessPassword, setBusinessPassword] = useState('adminpass'); // Pre-fill for convenience

  const { login: customerLogin, loading: customerLoading } = useAuth();
  const { login: businessLogin, loading: businessLoading } = useAdminAuth();

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await customerLogin(customerEmail, customerPassword);
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await businessLogin(businessEmail, businessPassword);
  };

  return (
    <div className="flex flex-grow flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="font-headline text-3xl">Account Login</CardTitle>
          <CardDescription>Access your loyalty or business account.</CardDescription>
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
                  />
                </div>
                <Button type="submit" disabled={customerLoading} className="w-full bg-primary hover:bg-primary/90">
                  {customerLoading ? (
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
                    placeholder="admin@example.com"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    required
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
                  />
                </div>
                <Button type="submit" disabled={businessLoading} className="w-full bg-primary hover:bg-primary/90">
                  {businessLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Log In as Business"
                  )}
                </Button>
              </form>
               <p className="mt-6 text-center text-xs text-muted-foreground">
                Business portal access is for registered partners.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
