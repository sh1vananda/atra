
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Award, LogIn, LogOut, UserCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export function Header() {
  const { isAuthenticated, loading, logout } = useAuth();

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Award className="h-8 w-8" />
          <h1 className="text-2xl font-headline font-semibold">Loyalty Leap</h1>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {loading ? (
            <>
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </>
          ) : isAuthenticated ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/loyalty">Loyalty Card</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/rewards">Rewards</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/history">History</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/offers">Offers</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/profile" aria-label="Profile">
                  <UserCircle className="h-5 w-5 sm:mr-1" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>
              <Button variant="outline" onClick={logout} aria-label="Logout">
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
          )}
        </nav>
      </div>
    </header>
  );
}
