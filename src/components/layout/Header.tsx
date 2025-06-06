
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Award, LogIn, LogOut, UserCircle, UserPlus, LayoutDashboard, Building, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from "next-themes";
import { useEffect, useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { isAuthenticated: isCustomerAuth, loading: customerLoading, logout: customerLogout, user: customerUser } = useAuth();
  const { isAdminAuthenticated, loading: adminLoading, logout: adminLogout, adminUser } = useAdminAuth();

  useEffect(() => setMounted(true), []);

  const loading = customerLoading || adminLoading;
  const isAdminRoute = pathname.startsWith('/admin');

  let titleText = "Loyalty Leap";
  let titleHref = "/";

  if (isAdminRoute) {
    titleText = adminUser?.businessName ? `${adminUser.businessName} Portal` : "Admin Portal";
    titleHref = isAdminAuthenticated ? "/admin/dashboard" : "/admin/login";
  } else {
    titleText = "Loyalty Leap";
    titleHref = isCustomerAuth ? "/loyalty" : "/";
  }
  
  if (!isAdminRoute && isCustomerAuth && pathname === "/") {
    titleHref = "/";
  }


  const handleAdminLogout = () => {
    adminLogout();
  };

  const handleCustomerLogout = () => {
    customerLogout();
  };

  if (!mounted) {
    // To prevent hydration mismatch for theme toggle
    // Render a placeholder or null during server rendering and initial client render
    return (
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Award className="h-7 w-7 sm:h-8 sm:w-8" />
            <h1 className="text-xl sm:text-2xl font-headline font-semibold">Loyalty Leap</h1>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Skeleton className="h-9 w-9 rounded-md" /> 
            <Skeleton className="h-9 w-20 rounded-md" />
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={titleHref} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          {isAdminRoute ? <Building className="h-7 w-7 sm:h-8 sm:w-8" /> : <Award className="h-7 w-7 sm:h-8 sm:w-8" />}
          <h1 className="text-xl sm:text-2xl font-headline font-semibold">{titleText}</h1>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {loading ? (
            <>
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </>
          ) : isAdminRoute ? (
            isAdminAuthenticated ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/admin/dashboard">
                    <LayoutDashboard className="h-5 w-5 sm:mr-1" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleAdminLogout} aria-label="Logout">
                  <LogOut className="h-5 w-5 sm:mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Button variant="ghost" asChild>
                <Link href="/">Customer Site</Link>
              </Button>
            )
          ) : (
            isCustomerAuth ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/loyalty">Loyalty</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/rewards">Rewards</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/history">History</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/offers">Offers</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile" aria-label="Profile">
                    <UserCircle className="h-5 w-5 sm:mr-1" />
                    <span className="hidden sm:inline">Profile</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleCustomerLogout} aria-label="Logout">
                  <LogOut className="h-5 w-5 sm:mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">
                    <LogIn className="h-5 w-5 sm:mr-1" />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                </Button>
                <Button variant="default" asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/signup">
                    <UserPlus className="h-5 w-5 sm:mr-1" />
                    <span className="hidden sm:inline">Sign Up</span>
                  </Link>
                </Button>
              </>
            )
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="ml-2"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
