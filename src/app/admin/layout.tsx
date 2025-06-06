
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
  return (
    // The overall background is handled by RootLayout now based on isAdminRoute
    // This div can be for specific admin area styling if needed, or removed if RootLayout covers it.
    <div className="flex flex-col flex-grow w-full"> 
      <AdminHeader />
      {/* main tag is now in RootLayout, children are directly rendered */}
      {children}
    </div>
  );
}

