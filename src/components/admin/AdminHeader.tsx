
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building, LogOut, LayoutDashboard } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminHeader() {
  const { adminUser, isAdminAuthenticated, loading, logout } = useAdminAuth();

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Building className="h-8 w-8" />
          <h1 className="text-2xl font-headline font-semibold">
            {adminUser ? adminUser.businessName : 'Admin Panel'}
          </h1>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {loading ? (
            <Skeleton className="h-9 w-24 rounded-md" />
          ) : isAdminAuthenticated ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/admin/dashboard">
                  <LayoutDashboard className="h-5 w-5 sm:mr-1" />
                   <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
              <Button variant="outline" onClick={logout} aria-label="Logout">
                <LogOut className="h-5 w-5 sm:mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
             <Button variant="ghost" asChild>
                <Link href="/admin/login">Login</Link>
              </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
