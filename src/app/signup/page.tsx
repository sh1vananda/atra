
"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UserPlus, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  // Customer Signup States
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  
  // Business Signup States
  const [businessName, setBusinessName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const { signup: customerSignup, loading: customerLoading } = useAuth();
  const { signupBusiness, loading: businessLoading } = useAdminAuth();
  const { toast } = useToast();

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await customerSignup(customerName, customerEmail, customerPassword);
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signupBusiness(businessName, adminEmail, adminPassword);
  };

  return (
    <div className="flex flex-grow flex-col items-center justify-center py-8 sm:py-12">
      <Card className="w-full max-w-md shadow-xl mt-8 sm:mt-0"> {/* Added margin top for smaller screens */}
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-primary mb-2" />
          <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
          <CardDescription>Join Loyalty Leap as a customer or register your business.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer" className="text-sm sm:text-base">
                <UserPlus className="mr-2 h-4 w-4" /> Customer
              </TabsTrigger>
              <TabsTrigger value="business" className="text-sm sm:text-base">
                <Briefcase className="mr-2 h-4 w-4" /> Business
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="customer" className="mt-6">
              <form onSubmit={handleCustomerSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Full Name</Label>
                  <Input
                    id="customer-name"
                    type="text"
                    placeholder="Your Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    disabled={customerLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="you@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    disabled={customerLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-password">Password</Label>
                  <Input
                    id="customer-password"
                    type="password"
                    placeholder="Create a strong password (min. 6 characters)"
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    required
                    disabled={customerLoading}
                  />
                </div>
                <Button type="submit" disabled={customerLoading} className="w-full bg-primary hover:bg-primary/90 text-base py-3">
                  {customerLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing up...
                    </>
                  ) : (
                    "Sign Up as Customer"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="business" className="mt-6">
              <form onSubmit={handleBusinessSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Your Business Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    disabled={businessLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@yourbusiness.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    disabled={businessLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Admin Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Create a strong password (min. 6 characters)"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    disabled={businessLoading}
                  />
                </div>
                <Button type="submit" disabled={businessLoading} className="w-full bg-primary hover:bg-primary/90 text-base py-3">
                  {businessLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register Business"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
