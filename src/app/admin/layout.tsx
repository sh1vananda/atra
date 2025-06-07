
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Keeva - Admin',
  description: 'Manage your Keeva Program',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The unified Header is now rendered by RootLayout.
  // This layout can be simplified or used for admin-specific sub-navigation or sidebars if needed later.
  return (
    <div className="flex flex-col flex-grow w-full">
      {children}
    </div>
  );
}
