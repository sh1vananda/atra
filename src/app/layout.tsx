
"use client";

import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
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

  const mainClassName = `flex-grow container mx-auto px-4 py-8 ${
    isAdminRoute ? 'bg-muted/40' : 'bg-background'
  }`;
  
  const showFooter = hasMounted ? !isAdminRoute : true;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Loyalty Leap</title>
        <meta name="description" content="Your Digital Loyalty Platform" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-muted/40">
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
              {showFooter && <Footer />}
              <Toaster />
            </AuthProvider>
          </AdminAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
