import type { PersonalizedOfferOutput } from '@/ai/flows/generate-personalized-offer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, MessageSquareQuote } from 'lucide-react';

interface PersonalizedOfferDisplayProps {
  offerOutput: PersonalizedOfferOutput;
}

export function PersonalizedOfferDisplay({ offerOutput }: PersonalizedOfferDisplayProps) {
  return (
    <Card className="bg-accent/10 border-accent shadow-lg animate-in fade-in-50 zoom-in-95 duration-500">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Gift className="h-10 w-10 text-accent" />
          <div>
            <CardTitle className="font-headline text-2xl text-accent">Your Personalized Offer!</CardTitle>
            <CardDescription className="text-accent/80">Specially crafted for you based on your activity.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Badge variant="default" className="bg-accent text-accent-foreground mb-2">Special Offer</Badge>
          <p className="text-lg font-medium text-foreground leading-relaxed whitespace-pre-wrap">
            {offerOutput.offer}
          </p>
        </div>
        <hr className="border-accent/30"/>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquareQuote className="h-5 w-5 text-accent/80" />
            <h4 className="font-semibold text-muted-foreground">Reasoning Behind This Offer:</h4>
          </div>
          <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
            {offerOutput.reasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
