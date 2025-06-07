
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Award, LogIn, LogOut, UserCircle, UserPlus, LayoutDashboard, Sun, Moon, ShoppingBag, Star, History as HistoryIcon, Sparkles as OffersIcon } from 'lucide-react';
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

  const { isAuthenticated: isCustomerAuth, loading: customerLoading, user: customerUser, logout: customerLogout } = useAuth();
  const { isAdminAuthenticated, loading: adminLoading, adminUser, logout: adminLogout } = useAdminAuth();

  useEffect(() => setMounted(true), []);

  const combinedLoading = customerLoading || adminLoading;
  
  const titleText = "ATRA";
  let titleHref = "/"; 

  if (mounted) {
    if (isAdminAuthenticated) {
      titleHref = "/admin/dashboard";
    } else if (isCustomerAuth) {
      titleHref = "/loyalty";
    }
  }
  
  const displayIcon = <Award className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />;
  
  if (!mounted) {
    return (
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            {displayIcon}
            <h1 className="text-xl sm:text-2xl font-headline font-semibold">{titleText}</h1>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Skeleton className="h-9 w-9 rounded-full" /> 
            <Skeleton className="h-9 w-20 rounded-md hidden sm:block" />
            <Skeleton className="h-9 w-20 rounded-md hidden sm:block" />
          </nav>
        </div>
      </header>
    );
  }
  
  const currentAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/login';
  const isSignupPage = pathname === '/signup';

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b shadow-sm", // Simplified shadow
      "bg-card text-card-foreground" // Solid, theme-aware background
    )}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        <Link href={titleHref} className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label={`Go to ${isAdminAuthenticated ? 'Admin Dashboard' : isCustomerAuth ? 'My Loyalty Page' : 'Homepage'}`}>
          {displayIcon}
          <h1 className="text-xl sm:text-2xl font-headline font-semibold text-primary hover:text-primary/80 transition-colors duration-300">{titleText}</h1>
        </Link>
        
        <nav className="flex items-center gap-1 sm:gap-2">
          {combinedLoading ? (
            <>
              <Skeleton className="h-9 w-9 rounded-full sm:w-24 sm:rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md hidden sm:block" />
            </>
          ) : currentAdminRoute ? (
            isAdminAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" asChild className={cn("font-medium", pathname === "/admin/dashboard" && "bg-primary/10 text-primary")}>
                  <Link href="/admin/dashboard" aria-label="Admin Dashboard">
                    <LayoutDashboard className="h-5 w-5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={adminLogout} aria-label="Logout from admin account">
                  <LogOut className="h-5 w-5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              !isLoginPage && !isSignupPage && ( 
                 <Button variant="ghost" size="sm" asChild className="font-medium">
                   <Link href="/">Customer Site</Link>
                 </Button>
              )
            )
          ) : (
            isCustomerAuth ? (
              <>
                <Button variant="ghost" size="sm" asChild className={cn("font-medium", pathname === "/loyalty" ? "bg-primary/10 text-primary" : "")}>
                  <Link href="/loyalty"><ShoppingBag className="h-4 w-4 mr-1 sm:mr-1.5"/>Loyalty</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className={cn("font-medium", pathname === "/rewards" ? "bg-primary/10 text-primary" : "")}>
                  <Link href="/rewards"><Star className="h-4 w-4 mr-1 sm:mr-1.5"/>Rewards</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className={cn("font-medium", pathname === "/history" ? "bg-primary/10 text-primary" : "")}>
                  <Link href="/history"><HistoryIcon className="h-4 w-4 mr-1 sm:mr-1.5"/>History</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className={cn("font-medium", pathname === "/offers" ? "bg-primary/10 text-primary" : "")}>
                  <Link href="/offers"><OffersIcon className="h-4 w-4 mr-1 sm:mr-1.5"/>Offers</Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className={cn("rounded-full", pathname === "/profile" ? "bg-primary/10 ring-2 ring-primary/30" : "")}>
                  <Link href="/profile" aria-label="View your profile">
                    <UserCircle className="h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : (
             !isLoginPage && !isSignupPage && (
              <>
                <Button variant="ghost" size="sm" asChild className="font-medium">
                  <Link href="/login" aria-label="Login page">
                    <LogIn className="h-5 w-5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                </Button>
                <Button variant="default" size="sm" asChild className="font-medium">
                  <Link href="/signup" aria-label="Signup page">
                    <UserPlus className="h-5 w-5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Sign Up</span>
                  </Link>
                </Button>
              </>
              )
            )
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="ml-1 sm:ml-2 rounded-full"
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
