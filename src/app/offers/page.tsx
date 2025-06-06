import { PersonalizedOfferForm } from '@/components/offers/PersonalizedOfferForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function OffersPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Personalized Offers</h1>
        <p className="text-lg text-muted-foreground">Discover offers and recommendations curated just for you!</p>
      </div>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Generate Your Offer</CardTitle>
            <CardDescription>
              Tell us a bit about your preferences and purchase history to receive a personalized offer.
            </CardDescription>
          </div>
          <Sparkles className="h-8 w-8 text-primary" />
        </CardHeader>
        <CardContent>
          <PersonalizedOfferForm />
        </CardContent>
      </Card>
    </div>
  );
}
