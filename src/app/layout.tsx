
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
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', // Optional: if you want to use it as a CSS variable
});

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
    isAuthPage && "flex items-center justify-center"
  );

  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <head>
        <title>ATRA | Digital Loyalty & Rewards Platform</title>
        <meta name="description" content="Elevate customer relationships with ATRA, your all-in-one platform for digital loyalty programs, personalized rewards, and insightful analytics." />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Google Fonts preconnects and links are removed as next/font handles this */}
      </head>
      <body className={cn(
        "font-body antialiased flex flex-col min-h-screen", // font-body can be replaced by inter.className or a variable if set
        isAuthPage && "bg-gradient-to-br from-background to-primary/10",
        !isAuthPage && "bg-background text-foreground"
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
