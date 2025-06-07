
"use client";

import './globals.css';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeProvider } from "next-themes";

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
  const isAuthRoute = hasMounted ? (pathname === '/login' || pathname === '/signup') : false;

  // Use theme-based background, it will switch with light/dark mode.
  // Shadcn often uses bg-background for main content areas.
  // Specific pages might override this with bg-card or bg-muted if needed.
  const mainBgClass = 'bg-background'; 

  const mainClassName = `flex-grow w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 ${mainBgClass}`;
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Loyalty Leap - Your Digital Loyalty Platform</title>
        <meta name="description" content="Elevate customer relationships with Loyalty Leap, your all-in-one platform for digital loyalty programs." />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background text-foreground">
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
