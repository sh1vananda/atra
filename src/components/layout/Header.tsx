
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Award, LogIn, LogOut, UserCircle, UserPlus, LayoutDashboard, Building, Sun, Moon, ShoppingBag, Star, History as HistoryIcon, Sparkles as OffersIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { usePathname } from 'next/navigation';
import { useTheme } from "next-themes";
import { useEffect, useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { isAuthenticated: isCustomerAuth, loading: customerLoading, logout: customerLogout } = useAuth();
  const { isAdminAuthenticated, loading: adminLoading, logout: adminLogout, adminUser } = useAdminAuth();

  useEffect(() => setMounted(true), []);

  const loading = customerLoading || adminLoading;
  const isAdminRoute = mounted ? pathname.startsWith('/admin') : false;

  let titleText = "Loyalty Leap";
  let titleHref = "/"; 

  if (mounted) {
    if (isAdminRoute) {
      titleText = adminUser?.businessName ? `${adminUser.businessName} Portal` : "Admin Portal";
      titleHref = isAdminAuthenticated ? "/admin/dashboard" : "/admin/login";
    } else if (isCustomerAuth) {
      titleText = "Loyalty Leap";
      titleHref = "/loyalty";
    } else {
      titleText = "Loyalty Leap";
      titleHref = "/";
    }
  }


  const handleAdminLogout = () => {
    adminLogout();
  };

  const handleCustomerLogout = () => {
    customerLogout();
  };

  if (!mounted) {
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
              // On admin login page, show link to customer site if desired
              pathname === '/admin/login' && (
                 <Button variant="ghost" asChild>
                   <Link href="/">Customer Site</Link>
                 </Button>
              )
            )
          ) : (
            isCustomerAuth ? (
              <>
                <Button variant="ghost" size="sm" asChild className={pathname === "/loyalty" ? "bg-accent text-accent-foreground" : ""}>
                  <Link href="/loyalty"><ShoppingBag className="h-4 w-4 mr-1 sm:mr-2"/>Loyalty</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className={pathname === "/rewards" ? "bg-accent text-accent-foreground" : ""}>
                  <Link href="/rewards"><Star className="h-4 w-4 mr-1 sm:mr-2"/>Rewards</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className={pathname === "/history" ? "bg-accent text-accent-foreground" : ""}>
                  <Link href="/history"><HistoryIcon className="h-4 w-4 mr-1 sm:mr-2"/>History</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className={pathname === "/offers" ? "bg-accent text-accent-foreground" : ""}>
                  <Link href="/offers"><OffersIcon className="h-4 w-4 mr-1 sm:mr-2"/>Offers</Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className={pathname === "/profile" ? "bg-accent text-accent-foreground rounded-full" : "rounded-full"}>
                  <Link href="/profile" aria-label="Profile">
                    <UserCircle className="h-5 w-5" />
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
            className="ml-1 sm:ml-2"
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
