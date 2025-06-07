
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
  // Auth pages (login/signup) will use the default background gradient
  const isAuthRoute = hasMounted ? (pathname === '/login' || pathname === '/signup') : false;

  let mainBgClass = 'bg-background'; // Default for most customer-facing pages
  if (isAdminRoute) {
    mainBgClass = 'bg-muted/40'; // Slightly different background for admin section
  } else if (isAuthRoute) {
     // Gradient for login/signup pages, consistent in light/dark
    mainBgClass = 'bg-gradient-to-br from-slate-50 via-gray-100 to-indigo-100 dark:from-slate-900 dark:via-gray-800 dark:to-indigo-950';
  }

  // Main content padding adjusted for a slightly more spacious feel
  const mainClassName = `flex-grow w-full max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 ${mainBgClass}`;
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Loyalty Leap - Your Digital Loyalty Platform</title> {/* Updated Title */}
        <meta name="description" content="Elevate customer relationships with Loyalty Leap, your all-in-one platform for digital loyalty programs." />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/25 selection:text-primary-foreground"> {/* Primary foreground for selection text for better contrast */}
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
