
// src/ai/flows/generate-personalized-offer.ts
'use server';

/**
 * @fileOverview Generates personalized offers and recommendations for users based on their purchase history and preferences.
 *
 * - generatePersonalizedOffer - A function that generates personalized offers.
 * - PersonalizedOfferInput - The input type for the generatePersonalizedOffer function.
 * - PersonalizedOfferOutput - The return type for the generatePersonalizedOffer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedOfferInputSchema = z.object({
  userId: z.string().describe('The ID of the user to generate an offer for.'),
  purchaseHistory: z.string().describe('The purchase history of the user.'),
  preferences: z.string().describe('The preferences of the user.'),
});

export type PersonalizedOfferInput = z.infer<typeof PersonalizedOfferInputSchema>;

const PersonalizedOfferOutputSchema = z.object({
  offer: z.string().describe('The personalized offer for the user.'),
  reasoning: z.string().describe('The reasoning behind the offer.'),
});

export type PersonalizedOfferOutput = z.infer<typeof PersonalizedOfferOutputSchema>;

export async function generatePersonalizedOffer(input: PersonalizedOfferInput): Promise<PersonalizedOfferOutput> {
  return generatePersonalizedOfferFlow(input);
}

const personalizedOfferPrompt = ai.definePrompt({
  name: 'personalizedOfferPrompt',
  input: {schema: PersonalizedOfferInputSchema},
  output: {schema: PersonalizedOfferOutputSchema},
  prompt: `You are an expert marketing assistant that specializes in generating personalized offers for users based on their purchase history and preferences.

  Generate a personalized offer for the user with the following information:

  User ID: {{{userId}}}
  Purchase History: {{{purchaseHistory}}}
  Preferences: {{{preferences}}}

  Explain the reasoning behind the offer.
  `,
});

const generatePersonalizedOfferFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedOfferFlow',
    inputSchema: PersonalizedOfferInputSchema,
    outputSchema: PersonalizedOfferOutputSchema,
  },
  async (input: PersonalizedOfferInput): Promise<PersonalizedOfferOutput> => {
    try {
      const {output} = await personalizedOfferPrompt(input);
      if (!output) {
        // Log the input for debugging if the model fails to produce output
        console.error('Personalized offer generation failed for input (null output):', input);
        throw new Error('Failed to generate personalized offer. The AI model did not return valid output.');
      }
      return output;
    } catch (flowError: any) {
      console.error('Error during personalizedOfferPrompt execution:', flowError);
      // Re-throw the error to be caught by the calling function's try/catch,
      // potentially providing more context than a generic ISE.
      throw new Error(`AI flow execution failed: ${flowError.message || 'An unknown error occurred in the AI flow.'}`);
    }
  }
);
