// src/app/error.tsx
"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col flex-grow items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-lg text-center shadow-xl bg-card">
        <CardHeader>
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <CardTitle className="font-headline text-3xl text-destructive">Oops! Something Went Wrong</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            We encountered an unexpected issue. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {process.env.NODE_ENV === 'development' && (
            <div className="text-left bg-muted p-4 rounded-md">
              <h3 className="font-semibold mb-2">Error Details:</h3>
              <p className="text-sm text-destructive-foreground bg-destructive p-2 rounded-sm">{error.message}</p>
              {error.digest && <p className="text-xs mt-1">Digest: {error.digest}</p>}
            </div>
          )}
          <Button
            onClick={() => reset()}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90"
          >
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            size="lg"
            variant="outline"
            className="w-full"
          >
            Go to Homepage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
