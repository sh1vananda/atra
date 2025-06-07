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

  const isAuthPage = hasMounted ? (pathname === '/login' || pathname === '/signup') : false;

  const mainClassName = cn(
    "flex-grow w-full max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8",
    // bg-background is applied to body, not needed here explicitly if body has it.
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
        "font-body antialiased flex flex-col min-h-screen" 
        // bg-background and text-foreground are applied via @layer base in globals.css
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
