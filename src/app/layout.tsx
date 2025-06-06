
"use client"; // Required for usePathname

import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { usePathname } from 'next/navigation';

// Metadata should be defined outside the component if it's static
// export const metadata: Metadata = { ... };
// However, since RootLayout is now a client component due to usePathname,
// metadata should be handled in a parent server component or moved to specific page.tsx files.
// For now, we'll keep it simple and you can add metadata to individual page.tsx files as needed.

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
        <title>Loyalty Leap</title>{/* Basic title, can be overridden by pages */}
        <meta name="description" content="Your Digital Loyalty Platform" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-muted/40">
        <AdminAuthProvider>
          <AuthProvider>
            {!isAdminRoute && <Header />}
            <main className={`flex-grow container mx-auto px-4 py-8 ${isAdminRoute ? 'bg-muted/40' : 'bg-background'}`}>
              {children}
            </main>
            {!isAdminRoute && <Footer />}
            <Toaster />
          </AuthProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
