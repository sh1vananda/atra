
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-card border-t border-border py-6 text-center text-muted-foreground">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
        <p>&copy; {currentYear} Loyalty Leap. All rights reserved.</p>
        <Link href="/admin/login" className="text-sm text-primary hover:underline mt-2 sm:mt-0">
          Business Portal
        </Link>
      </div>
    </footer>
  );
}
