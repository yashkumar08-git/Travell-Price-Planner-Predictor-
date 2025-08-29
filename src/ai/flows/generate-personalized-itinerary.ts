// src/ai/flows/generate-personalized-itinerary.ts
'use server';

/**
 * @fileOverview Generates a personalized travel itinerary based on user preferences.
 *
 * - generatePersonalizedItinerary - A function that generates a travel itinerary.
 * - GeneratePersonalizedItineraryInput - The input type for the generatePersonalizedItinerary function.
 * - GeneratePersonalizedItineraryOutput - The return type for the generatePersonalizedItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedItineraryInputSchema = z.object({
  destination: z.string().describe('The desired travel destination.'),
  startDate: z.string().describe('The start date of the trip (YYYY-MM-DD).'),
  days: z.number().min(1).max(21).default(3).describe('The number of travel days.'),
  budget: z.enum(['Low', 'Medium', 'Luxury']).default('Medium').describe('The budget level for the trip.'),
  travelers: z.number().min(1).default(2).describe('The number of travelers.'),
  interests: z
    .string()
    .describe(
      'A comma-separated list of interests (e.g., Beaches, Food, Shopping, History, Adventure).'
    ),
  pace: z.enum(['Relaxed', 'Balanced', 'Intense']).default('Balanced').describe('The preferred travel pace.'),
  mustInclude: z
    .string()
    .optional()
    .describe(
      'A comma-separated list of specific places or activities that must be included in the itinerary.'
    ),
  avoid: z
    .string()
    .optional()
    .describe('A comma-separated list of things to avoid.'),
  notes: z.string().optional().describe('Any additional notes or constraints.'),
});

export type GeneratePersonalizedItineraryInput = z.infer<
  typeof GeneratePersonalizedItineraryInputSchema
>;

const ItineraryItemSchema = z.object({
  day: z.number().describe('The day number in the itinerary.'),
  date: z.string().describe('The date for this day in YYYY-MM-DD format.'),
  morning: z.string().describe('A suggested morning activity.'),
  afternoon: z.string().describe('A suggested afternoon activity.'),
  evening: z.string().describe('A suggested evening activity.'),
});

const GeneratePersonalizedItineraryOutputSchema = z.object({
  summary: z.string().describe('A summary of the trip itinerary.'),
  itinerary: z.array(ItineraryItemSchema).describe('The generated travel itinerary.'),
  estimatedBudget: z.string().describe('The estimated budget for the trip.'),
  tips: z.string().describe('Helpful tips for the trip.'),
});

export type GeneratePersonalizedItineraryOutput = z.infer<
  typeof GeneratePersonalizedItineraryOutputSchema
>;

export async function generatePersonalizedItinerary(
  input: GeneratePersonalizedItineraryInput
): Promise<GeneratePersonalizedItineraryOutput> {
  return generatePersonalizedItineraryFlow(input);
}

const generatePersonalizedItineraryPrompt = ai.definePrompt({
  name: 'generatePersonalizedItineraryPrompt',
  input: {schema: GeneratePersonalizedItineraryInputSchema},
  output: {schema: GeneratePersonalizedItineraryOutputSchema},
  prompt: `You are an expert travel agent. Generate a personalized travel itinerary based on the following user preferences:

Destination: {{{destination}}}
Start Date: {{{startDate}}}
Days: {{{days}}}
Budget: {{{budget}}}
Travelers: {{{travelers}}}
Interests: {{{interests}}}
Pace: {{{pace}}}
Must Include: {{{mustInclude}}}
Avoid: {{{avoid}}}
Notes: {{{notes}}}

Create a detailed itinerary including a summary, daily plans (morning, afternoon, evening activities with date in YYYY-MM-DD format), estimated budget, and helpful tips. The output should be well structured and easy to read.

Make sure that activities selected match the interests specified.
If mustInclude is specified, make sure to include them in the itinerary.
If avoid is specified, make sure to avoid the things that the user wants to avoid.
Take into account the pace, and make sure that if the pace is relaxed, activities are not crammed together. If the pace is intense, pack the itinerary with activities.

Ensure the output is well formatted.
`,
});

const generatePersonalizedItineraryFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedItineraryFlow',
    inputSchema: GeneratePersonalizedItineraryInputSchema,
    outputSchema: GeneratePersonalizedItineraryOutputSchema,
  },
  async input => {
    const {output} = await generatePersonalizedItineraryPrompt(input);
    return output!;
  }
);
