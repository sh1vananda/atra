
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
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { isAuthenticated: isCustomerAuth, loading: customerLoading, logout: customerLogout } = useAuth();
  const { isAdminAuthenticated, loading: adminLoading, logout: adminLogout } = useAdminAuth();

  useEffect(() => setMounted(true), []);

  const combinedLoading = customerLoading || adminLoading;
  
  const titleText = "ATRA";
  const titleHref = "/";
  const displayIcon = <Award className="h-7 w-7 sm:h-8 sm:w-8" />;
  
  if (!mounted) {
    // Consistent skeleton for SSR and initial client render
    return (
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            {displayIcon}
            <h1 className="text-xl sm:text-2xl font-headline font-semibold">{titleText}</h1>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Skeleton className="h-9 w-9 rounded-md" /> 
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </nav>
        </div>
      </header>
    );
  }
  
  const currentAdminRoute = pathname.startsWith('/admin');

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href={titleHref} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity" aria-label="Go to homepage">
          {displayIcon}
          <h1 className="text-xl sm:text-2xl font-headline font-semibold">{titleText}</h1>
        </Link>
        
        <nav className="flex items-center gap-1 sm:gap-2">
          {combinedLoading ? (
            <>
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </>
          ) : currentAdminRoute ? (
            isAdminAuthenticated ? (
              <>
                <Button variant="ghost" asChild className={cn(pathname === "/admin/dashboard" && "bg-secondary")}>
                  <Link href="/admin/dashboard" aria-label="Admin Dashboard">
                    <LayoutDashboard className="h-5 w-5 sm:mr-1" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                </Button>
                <Button variant="outline" onClick={adminLogout} aria-label="Logout from admin account">
                  <LogOut className="h-5 w-5 sm:mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              pathname !== '/login' && ( // Show 'Customer Site' link if not on general login page where business tab is present
                 <Button variant="ghost" asChild>
                   <Link href="/">Customer Site</Link>
                 </Button>
              )
            )
          ) : (
            isCustomerAuth ? (
              <>
                <Button variant="ghost" size="sm" asChild className={cn(pathname === "/loyalty" ? "bg-accent text-accent-foreground" : "")}>
                  <Link href="/loyalty"><ShoppingBag className="h-4 w-4 mr-1 sm:mr-2"/>Loyalty</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className={cn(pathname === "/rewards" ? "bg-accent text-accent-foreground" : "")}>
                  <Link href="/rewards"><Star className="h-4 w-4 mr-1 sm:mr-2"/>Rewards</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className={cn(pathname === "/history" ? "bg-accent text-accent-foreground" : "")}>
                  <Link href="/history"><HistoryIcon className="h-4 w-4 mr-1 sm:mr-2"/>History</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className={cn(pathname === "/offers" ? "bg-accent text-accent-foreground" : "")}>
                  <Link href="/offers"><OffersIcon className="h-4 w-4 mr-1 sm:mr-2"/>Offers</Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className={cn(pathname === "/profile" ? "bg-accent text-accent-foreground rounded-full" : "rounded-full")}>
                  <Link href="/profile" aria-label="View your profile">
                    <UserCircle className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={customerLogout} aria-label="Logout from your account">
                  <LogOut className="h-5 w-5 sm:mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className={cn(pathname === "/login" && "bg-secondary")}>
                  <Link href="/login" aria-label="Login page">
                    <LogIn className="h-5 w-5 sm:mr-1" />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                </Button>
                <Button variant="default" asChild className={cn(pathname === "/signup" ? "bg-primary/80" : "bg-primary", "hover:bg-primary/90")}>
                  <Link href="/signup" aria-label="Signup page">
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
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="ml-1 sm:ml-2"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
