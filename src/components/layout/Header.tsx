import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Award className="h-8 w-8" />
          <h1 className="text-2xl font-headline font-semibold">Loyalty Leap</h1>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
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
        </nav>
      </div>
    </header>
  );
}
