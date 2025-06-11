
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

// This prompt is defined at the module level.
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
      // The personalizedOfferPrompt should be defined if this flow is callable.
      // The actual call to the AI model happens here.
      const {output} = await personalizedOfferPrompt(input);
      if (!output) {
        console.error('Personalized offer generation failed for input (null output from prompt):', input);
        throw new Error('Failed to generate personalized offer. The AI model did not return valid output.');
      }
      return output;
    } catch (flowError: any) {
      console.error('Error during personalizedOfferPrompt execution inside flow:', flowError);
      let detail = 'An unknown error occurred in the AI flow\'s prompt execution.';
      if (flowError instanceof Error) {
        detail = flowError.message;
      } else if (typeof flowError === 'string') {
        detail = flowError;
      }
      if (input && input.userId) {
        detail += ` (User ID: ${input.userId})`;
      }
      // This error will be caught by the calling function's try/catch if present, or bubble up.
      throw new Error(`AI flow execution failed: ${detail}`);
    }
  }
);

export async function generatePersonalizedOffer(input: PersonalizedOfferInput): Promise<PersonalizedOfferOutput> {
  try {
    // Check if the prompt definition was successful (e.g., Genkit initialized correctly)
    if (!personalizedOfferPrompt || typeof personalizedOfferPrompt !== 'function') {
      console.error('Personalized offer prompt is not defined or not a function. This indicates an issue with Genkit initialization or prompt definition, potentially due to missing API keys or configuration.');
      throw new Error('The AI prompt required for generating offers is not configured correctly. Please contact support or check server logs.');
    }
    // Await the flow execution to ensure any errors from it are caught here
    return await generatePersonalizedOfferFlow(input);
  } catch (error: any) {
    // This catch block is for errors from generatePersonalizedOfferFlow or the prompt check itself.
    console.error('Critical error in generatePersonalizedOffer wrapper function:', error);
    // Re-throw the error so the client-side form can catch it and display a message.
    // If the error is already an Error instance with a good message (from the flow's catch), re-use it.
    // Otherwise, provide a generic server-side error message.
    if (error instanceof Error) {
        throw error; // Re-throw the already specific error from the flow
    }
    throw new Error('A critical server-side error occurred while attempting to generate the offer. Please try again later.');
  }
}
