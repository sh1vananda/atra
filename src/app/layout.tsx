
"use client"; 

import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { usePathname } from 'next/navigation';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <html lang="en">
      <head>
        <title>Loyalty Leap</title> {/* Basic title, can be overridden by pages */}
        <meta name="description" content="Your Digital Loyalty Platform" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-muted/40">
        <AdminAuthProvider>
          <AuthProvider>
            <Header /> {/* Unified Header */}
            <main className={`flex-grow container mx-auto px-4 py-8 ${isAdminRoute ? 'bg-muted/40' : 'bg-background'}`}>
              {children}
            </main>
            {!isAdminRoute && <Footer />} {/* Footer only for non-admin routes */}
            <Toaster />
          </AuthProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
