
"use client";

import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

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

  // Determine isAdminRoute. For SSR & pre-hydration, assume a default (e.g., false or based on a non-hook value if possible).
  // After hydration, use actual pathname.
  // Defaulting to `false` ensures server and initial client render for `isAdminRoute` are consistent.
  const isAdminRoute = hasMounted ? pathname.startsWith('/admin') : false;

  // Determine main className based on isAdminRoute.
  // For SSR and initial client render, it will use `isAdminRoute = false`.
  const mainClassName = `flex-grow container mx-auto px-4 py-8 ${
    isAdminRoute ? 'bg-muted/40' : 'bg-background'
  }`;
  
  // Determine if Footer should be shown.
  // For SSR & pre-hydration, if isAdminRoute defaults to false, footer will be shown.
  // After hydration, it uses the client-derived isAdminRoute.
  const showFooter = hasMounted ? !isAdminRoute : true; // If not mounted, assume not admin route, show footer.

  return (
    <html lang="en">
      <head>
        <title>Loyalty Leap</title>
        <meta name="description" content="Your Digital Loyalty Platform" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-muted/40">
        <AdminAuthProvider>
          <AuthProvider>
            <Header /> {/* Unified Header */}
            <main className={mainClassName}>
              {children}
            </main>
            {/* Conditionally render Footer ensuring consistency */}
            {showFooter && <Footer />}
            <Toaster />
          </AuthProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
