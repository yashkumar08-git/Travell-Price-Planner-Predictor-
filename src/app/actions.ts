'use server';

import {
  generatePersonalizedItinerary,
  type GeneratePersonalizedItineraryInput,
  type GeneratePersonalizedItineraryOutput,
} from '@/ai/flows/generate-personalized-itinerary';

export async function generateItineraryAction(
  input: GeneratePersonalizedItineraryInput
): Promise<GeneratePersonalizedItineraryOutput | { error: string }> {
  try {
    const itinerary = await generatePersonalizedItinerary(input);
    return itinerary;
  } catch (e: any) {
    console.error(e);
    // Provide a more user-friendly error message
    const message = e.message || 'An unknown error occurred.';
    return { error: `Failed to generate itinerary: ${message}` };
  }
}
