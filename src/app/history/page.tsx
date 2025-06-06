import { HistoryListItem, type HistoryEntry } from '@/components/history/HistoryListItem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';

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
