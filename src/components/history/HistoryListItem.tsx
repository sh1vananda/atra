import { ArrowDownCircle, ArrowUpCircle, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface HistoryEntry {
  id: string;
  date: Date;
  description: string;
  pointsChange: number;
  type: 'earn' | 'redeem';
}

interface HistoryListItemProps {
  entry: HistoryEntry;
}

export function HistoryListItem({ entry }: HistoryListItemProps) {
  const isEarn = entry.type === 'earn';
  
  return (
    <li className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/20 transition-colors duration-200">
      <div className="flex items-center gap-4">
        {isEarn ? (
          <ArrowUpCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
        ) : (
          <ArrowDownCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
        )}
        <div>
          <p className="font-medium text-foreground">{entry.description}</p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{format(entry.date, 'MMMM d, yyyy HH:mm')}</span>
          </div>
        </div>
      </div>
      <p className={cn(
        "text-lg font-semibold",
        isEarn ? "text-green-600" : "text-red-600"
      )}>
        {isEarn ? '+' : ''}{entry.pointsChange} Points
      </p>
    </li>
  );
}
