
import type { Metadata } from 'next';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata: Metadata = {
  title: 'Loyalty Leap - Admin',
  description: 'Manage your Loyalty Leap Program',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // AdminAuthProvider is now in RootLayout, so it's removed from here.
  // Toaster is also in RootLayout.
  // Removed <html>, <head>, <body> tags as this is a child layout.
  return (
    <div className="flex flex-col flex-grow w-full bg-muted/40"> {/* Apply styling that was on body */}
      <AdminHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
