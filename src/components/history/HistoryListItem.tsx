
import { ArrowDownCircle, ArrowUpCircle, CalendarDays, Briefcase, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface HistoryEntry {
  id: string;
  date: Date;
  description: string;
  pointsChange: number;
  type: 'earn' | 'redeem';
  businessName?: string;
  status?: 'pending' | 'approved' | 'rejected';
  appealId?: string;
}

interface HistoryListItemProps {
  entry: HistoryEntry;
}

export function HistoryListItem({ entry }: HistoryListItemProps) {
  const isEarn = entry.type === 'earn';
  const isRedemption = entry.pointsChange < 0;

  let statusIcon = null;
  let statusText = "";
  let statusColorClass = "";

  if (entry.appealId && entry.status) { // Only show appeal status if it's an appealed item
    switch (entry.status) {
      case 'pending':
        statusIcon = <Clock className="h-4 w-4 text-yellow-500" />;
        statusText = "Pending Review";
        statusColorClass = "bg-yellow-100 text-yellow-700 border-yellow-300";
        break;
      case 'approved':
        // For approved appeals, the main icon (earn/redeem) is usually sufficient
        // unless we want to explicitly state it was an approved appeal.
        // For simplicity, we'll rely on the pointsChange to show it was positive.
        break;
      case 'rejected':
        statusIcon = <AlertCircle className="h-4 w-4 text-red-500" />;
        statusText = "Appeal Rejected";
        statusColorClass = "bg-red-100 text-red-700 border-red-300";
        break;
    }
  }


  return (
    <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-secondary/20 transition-colors duration-200 gap-3 sm:gap-0">
      <div className="flex items-center gap-4 flex-grow">
        {isRedemption ? (
          <ArrowDownCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
        ) : (
          <ArrowUpCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
        )}
        <div className="flex-grow">
          <p className="font-medium text-foreground">{entry.description}</p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{format(entry.date, 'MMMM d, yyyy HH:mm')}</span>
          </div>
          {entry.businessName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Briefcase className="h-3 w-3" />
              <span>{entry.businessName}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end sm:items-center gap-1 self-end sm:self-center">
        <p className={cn(
          "text-lg font-semibold",
          isRedemption ? "text-red-600" : "text-green-600"
        )}>
          {isRedemption || entry.pointsChange <=0 ? '' : '+'}{entry.pointsChange} Points
        </p>
        {statusText && (
            <Badge variant="outline" className={cn("text-xs font-normal py-0.5 px-1.5", statusColorClass)}>
                {statusIcon && React.cloneElement(statusIcon, {className: "h-3 w-3 mr-1"})}
                {statusText}
            </Badge>
        )}
      </div>
    </li>
  );
}
