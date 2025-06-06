
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { HistoryListItem, type HistoryEntry } from '@/components/history/HistoryListItem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const mockHistory: HistoryEntry[] = [
  {
    id: '1',
    date: new Date('2024-07-20T10:30:00Z'),
    description: 'Earned points - Coffee Purchase',
    pointsChange: 20,
    type: 'earn',
  },
  {
    id: '2',
    date: new Date('2024-07-18T15:00:00Z'),
    description: 'Redeemed - Free Coffee',
    pointsChange: -100,
    type: 'redeem',
  },
  {
    id: '3',
    date: new Date('2024-07-15T09:15:00Z'),
    description: 'Earned points - Pastry Purchase',
    pointsChange: 15,
    type: 'earn',
  },
  {
    id: '4',
    date: new Date('2024-07-10T12:00:00Z'),
    description: 'Bonus points - Welcome Offer',
    pointsChange: 50,
    type: 'earn',
  },
   {
    id: '5',
    date: new Date('2024-07-05T18:45:00Z'),
    description: 'Earned points - Sandwich & Drink',
    pointsChange: 35,
    type: 'earn',
  },
];

export default function HistoryPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/history');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <Card className="shadow-lg">
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

  return (
    <div className="space-y-8">
       <div className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Your Activity</h1>
        <p className="text-lg text-muted-foreground">A record of your points earned and rewards redeemed.</p>
      </div>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Transaction History</CardTitle>
            <CardDescription>View your recent activity below.</CardDescription>
          </div>
          <ScrollText className="h-8 w-8 text-primary"/>
        </CardHeader>
        <CardContent>
          {mockHistory.length > 0 ? (
            <ul className="space-y-4">
              {mockHistory.map((entry) => (
                <HistoryListItem key={entry.id} entry={entry} />
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-8">No history yet. Start earning points!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
