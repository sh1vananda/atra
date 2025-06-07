
"use client";

import './globals.css';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeProvider } from "next-themes";
import { cn } from '@/lib/utils';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isAdminRoute = hasMounted ? pathname.startsWith('/admin') : false;
  const isAuthPage = hasMounted ? (pathname === '/login' || pathname === '/signup') : false;

  // Default main background for content pages
  const mainBgClass = 'bg-background';
  // Special gradient background for auth pages
  const authPageBgClass = 'bg-gradient-to-br from-slate-100 via-gray-50 to-stone-100 dark:from-slate-900 dark:via-zinc-900 dark:to-neutral-950';

  const mainClassName = cn(
    "flex-grow w-full max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8",
    isAuthPage ? '' : mainBgClass // Apply default bg only if not an auth page
  );
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Loyalty Leap | Digital Loyalty & Rewards Platform</title>
        <meta name="description" content="Elevate customer relationships with Loyalty Leap, your all-in-one platform for digital loyalty programs, personalized rewards, and insightful analytics." />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "font-body antialiased flex flex-col min-h-screen text-foreground",
        isAuthPage ? authPageBgClass : 'bg-background' // Body gets the special bg for auth pages
      )}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <AdminAuthProvider>
            <AuthProvider>
              <Header />
              <main className={mainClassName}>
                {children}
              </main>
              <Toaster />
            </AuthProvider>
          </AdminAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
