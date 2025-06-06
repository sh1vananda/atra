"use client";

import { useState, useTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Lightbulb } from 'lucide-react';
import { generatePersonalizedOffer, type PersonalizedOfferInput, type PersonalizedOfferOutput } from '@/ai/flows/generate-personalized-offer';
import { PersonalizedOfferDisplay } from './PersonalizedOfferDisplay';

const formSchema = z.object({
  userId: z.string().min(1, "User ID is required").default("USR_123_XYZ"),
  purchaseHistory: z.string().min(10, "Purchase history should be at least 10 characters").default("Bought coffee twice, a sandwich, and a pastry last week."),
  preferences: z.string().min(5, "Preferences should be at least 5 characters").default("Loves lattes, interested in vegan options."),
});

type FormData = z.infer<typeof formSchema>;

export function PersonalizedOfferForm() {
  const [offerOutput, setOfferOutput] = useState<PersonalizedOfferOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setError(null);
    setOfferOutput(null);
    startTransition(async () => {
      try {
        const input: PersonalizedOfferInput = {
          userId: data.userId,
          purchaseHistory: data.purchaseHistory,
          preferences: data.preferences,
        };
        const result = await generatePersonalizedOffer(input);
        setOfferOutput(result);
      } catch (e) {
        console.error("Error generating offer:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="userId">User ID (mock)</Label>
          <Input id="userId" {...register("userId")} placeholder="e.g., user123" />
          {errors.userId && <p className="text-sm text-destructive mt-1">{errors.userId.message}</p>}
        </div>

        <div>
          <Label htmlFor="purchaseHistory">Purchase History (mock)</Label>
          <Textarea
            id="purchaseHistory"
            {...register("purchaseHistory")}
            placeholder="e.g., Bought 2 lattes, 1 croissant in the last month."
            rows={4}
          />
          {errors.purchaseHistory && <p className="text-sm text-destructive mt-1">{errors.purchaseHistory.message}</p>}
        </div>

        <div>
          <Label htmlFor="preferences">Preferences (mock)</Label>
          <Textarea
            id="preferences"
            {...register("preferences")}
            placeholder="e.g., Prefers dark roast coffee, enjoys pastries."
            rows={3}
          />
          {errors.preferences && <p className="text-sm text-destructive mt-1">{errors.preferences.message}</p>}
        </div>

        <Button type="submit" disabled={isPending} className="w-full bg-primary hover:bg-primary/90">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Personalized Offer"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {offerOutput && <PersonalizedOfferDisplay offerOutput={offerOutput} />}
    </div>
  );
}
