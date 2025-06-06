
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Award, LogIn, LogOut, UserCircle, UserPlus, LayoutDashboard, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { usePathname, useRouter } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const { isAuthenticated: isCustomerAuth, loading: customerLoading, logout: customerLogout, user: customerUser } = useAuth();
  const { isAdminAuthenticated, loading: adminLoading, logout: adminLogout, adminUser } = useAdminAuth();

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
  
  // Special case for homepage when customer is logged in, title still goes to /
  if (!isAdminRoute && isCustomerAuth && pathname === "/") {
    titleHref = "/";
  }


  const handleAdminLogout = () => {
    adminLogout();
  };

  const handleCustomerLogout = () => {
    customerLogout();
  };

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
            // Admin Routes Navigation
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
              // No specific links needed on /admin/login if not authenticated, title link is sufficient
              // Or a link back to customer site if desired:
              <Button variant="ghost" asChild>
                <Link href="/">Customer Site</Link>
              </Button>
            )
          ) : (
            // Customer Routes Navigation
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
        </nav>
      </div>
    </header>
  );
}
