
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { HistoryListItem, type HistoryEntry } from '@/components/history/HistoryListItem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollText, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { MockPurchase, UserMembership } from '@/types/user';

function mapPurchaseToHistoryEntry(purchase: MockPurchase, businessName: string): HistoryEntry {
  return {
    id: purchase.id,
    date: new Date(purchase.date),
    description: purchase.item,
    pointsChange: purchase.pointsEarned,
    type: purchase.pointsEarned >= 0 ? 'earn' : 'redeem',
    businessName: businessName,
  };
}

export default function HistoryPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/history');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="w-full space-y-8">
        <div className="text-center">
          <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <Card className="shadow-lg bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <Skeleton className="h-7 w-48 mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-8" />
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <li key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-52" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allHistoryEntries: HistoryEntry[] = [];
  user.memberships?.forEach((membership: UserMembership) => {
    membership.purchases?.forEach(purchase => {
      allHistoryEntries.push(mapPurchaseToHistoryEntry(purchase, membership.businessName));
    });
  });

  const sortedHistory = allHistoryEntries.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="w-full space-y-8">
       <div className="text-center border-b border-border pb-6 mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Your Activity</h1>
        <p className="text-lg text-muted-foreground">A record of your points earned and rewards redeemed across all programs.</p>
      </div>
      <Card className="shadow-lg bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Transaction History</CardTitle>
            <CardDescription>View your recent activity below.</CardDescription>
          </div>
          <ScrollText className="h-8 w-8 text-primary"/>
        </CardHeader>
        <CardContent>
          {sortedHistory.length > 0 ? (
            <ul className="space-y-4">
              {sortedHistory.map((entry) => (
                <HistoryListItem key={entry.id + entry.businessName} entry={entry} />
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <Info className="h-12 w-12 mx-auto text-primary mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No history yet.</p>
              <p className="text-muted-foreground">Start earning points or make a purchase to see your activity here!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
