// src/app/admin/error.tsx
"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin section error:", error);
  }, [error]);

  return (
    <div className="flex flex-col flex-grow items-center justify-center min-h-[calc(100vh-var(--header-height,80px))] bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center shadow-lg bg-card">
        <CardHeader>
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-3" />
          <CardTitle className="font-headline text-2xl text-destructive">Admin Area Error</CardTitle>
          <CardDescription className="text-md text-muted-foreground mt-1">
            An error occurred in the admin section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {process.env.NODE_ENV === 'development' && (
            <div className="text-left bg-muted p-3 rounded-md">
              <h4 className="font-semibold mb-1 text-sm">Error:</h4>
              <p className="text-xs text-destructive-foreground bg-destructive p-1.5 rounded-sm">{error.message}</p>
            </div>
          )}
          <Button
            onClick={() => reset()}
            className="w-full"
          >
            Try Again
          </Button>
           <Button
            onClick={() => window.location.href = '/admin/dashboard'}
            variant="outline"
            className="w-full"
          >
            Back to Admin Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
