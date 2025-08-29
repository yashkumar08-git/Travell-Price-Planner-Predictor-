'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Coffee, Download, Loader2, Moon, RotateCcw, Share2, Sparkles, Sunset, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { generateItineraryAction } from '@/app/actions';
import { AirplaneIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  destination: z.string().min(1, 'Destination is required.'),
  startDate: z.date({ required_error: 'A start date is required.' }),
  days: z.coerce.number().min(1).max(21).default(3),
  budget: z.enum(['Low', 'Medium', 'Luxury']).default('Medium'),
  travelers: z.coerce.number().min(1).default(2),
  interests: z.string().min(1, 'Please select at least one interest.'),
  pace: z.enum(['Relaxed', 'Balanced', 'Intense']).default('Balanced'),
  mustInclude: z.string().optional(),
  avoid: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const INTERESTS = [
  'Beaches', 'Food', 'Shopping', 'History', 'Culture', 'Adventure', 
  'Nature', 'Nightlife', 'Religious', 'Photography'
];

function ItineraryPlanner() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<GeneratePersonalizedItineraryOutput | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: '',
      days: 3,
      budget: 'Medium',
      travelers: 2,
      interests: '',
      pace: 'Balanced',
      mustInclude: '',
      avoid: '',
      notes: '',
    },
  });

  const generateItinerary = useCallback(async (data: FormValues) => {
    setLoading(true);
    setItinerary(null);
    try {
      localStorage.setItem('last_itinerary_input', JSON.stringify(data));
      const result = await generateItineraryAction({
        ...data,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
      });
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: 'Error Generating Itinerary',
          description: result.error,
        });
      } else {
        setItinerary(result);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An unexpected error occurred',
        description: 'Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const planParam = searchParams.get('plan');
    let dataToLoad = null;

    if (planParam) {
      try {
        dataToLoad = JSON.parse(atob(planParam));
      } catch (e) {
        console.error('Failed to parse plan from URL', e);
      }
    } else {
      const savedData = localStorage.getItem('last_itinerary_input');
      if (savedData) {
        try {
          dataToLoad = JSON.parse(savedData);
        } catch (e) {
          console.error('Failed to parse plan from localStorage', e);
        }
      }
    }
    
    if (dataToLoad) {
      if (dataToLoad.startDate) {
        dataToLoad.startDate = new Date(dataToLoad.startDate);
      }
      form.reset(dataToLoad);
      if (dataToLoad.destination) {
          generateItinerary(dataToLoad);
      }
    }
  }, [searchParams, form.reset, generateItinerary]);


  function handleShare() {
    const values = form.getValues();
    const jsonString = JSON.stringify(values);
    const base64String = btoa(jsonString);
    const url = `${window.location.origin}${window.location.pathname}?plan=${base64String}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied!',
      description: 'You can now share your trip plan with others.',
    });
  }

  function handleClear() {
    form.reset({
      destination: '',
      days: 3,
      budget: 'Medium',
      travelers: 2,
      interests: '',
      pace: 'Balanced',
      mustInclude: '',
      avoid: '',
      notes: '',
    });
    setItinerary(null);
    localStorage.removeItem('last_itinerary_input');
  }

  const toggleInterest = (interest: string) => {
    const currentInterests = form.getValues('interests').split(', ').filter(Boolean);
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter((i) => i !== interest)
      : [...currentInterests, interest];
    form.setValue('interests', newInterests.join(', '), { shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden animate-fade-in-down">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <AirplaneIcon className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">TripGenius</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 />
              Share
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Download />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="print:hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-3xl flex items-center gap-2"><Sparkles className="text-primary"/>Plan Your Next Adventure</CardTitle>
                <CardDescription>Fill in your preferences and let our AI create the perfect itinerary for you.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(generateItinerary)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Goa, India" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'w-full justify-start text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                          control={form.control}
                          name="days"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Days</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="21" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                          control={form.control}
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select budget" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="Luxury">Luxury</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="travelers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Travelers</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="interests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interests</FormLabel>
                          <FormControl>
                            <>
                              <Input className="hidden" {...field} />
                              <div className="flex flex-wrap gap-2">
                                {INTERESTS.map((interest) => (
                                  <Badge
                                    key={interest}
                                    variant={field.value.includes(interest) ? 'default' : 'secondary'}
                                    className="cursor-pointer transition-transform hover:scale-105"
                                    onClick={() => toggleInterest(interest)}
                                  >
                                    {interest}
                                  </Badge>
                                ))}
                              </div>
                            </>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                     <FormField
                        control={form.control}
                        name="pace"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pace</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select pace" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Relaxed">Relaxed</SelectItem>
                                <SelectItem value="Balanced">Balanced</SelectItem>
                                <SelectItem value="Intense">Intense</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    <FormField
                      control={form.control}
                      name="mustInclude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Must Include (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Eiffel Tower, Louvre Museum" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="avoid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avoid (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Crowded places" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Any other preferences or constraints..." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-4 pt-4">
                       <Button type="submit" disabled={loading} size="lg" className="w-full">
                        {loading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                        {loading ? 'Generating...' : 'Generate Itinerary'}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleClear} className="w-full" size="lg">
                        <RotateCcw />
                        Clear
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {loading && (
               <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center p-12 space-y-4 text-center h-full">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="font-headline text-xl">Generating your dream trip...</p>
                  <p className="text-muted-foreground">The AI is crafting your personalized itinerary. This might take a moment.</p>
                </CardContent>
              </Card>
            )}

            {!loading && !itinerary && (
              <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px]">
                <Image src="https://picsum.photos/800/600" data-ai-hint="travel planning" alt="Travel illustration" width={300} height={225} className="rounded-lg mb-6 shadow-lg" />
                <h2 className="font-headline text-2xl font-bold">Your Itinerary Awaits</h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Ready for an adventure? Fill out the form to get started, and your personalized travel plan will appear here.
                </p>
              </Card>
            )}

            {itinerary && (
              <>
                <Card className="transition-transform hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle className="font-headline text-4xl">{form.getValues('destination')}</CardTitle>
                    <CardDescription className="pt-2">{itinerary.summary}</CardDescription>
                  </CardHeader>
                   <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-headline text-lg font-semibold mb-2">Estimated Budget</h3>
                        <p className="text-muted-foreground">{itinerary.estimatedBudget}</p>
                      </div>
                      <div>
                        <h3 className="font-headline text-lg font-semibold mb-2">Helpful Tips</h3>
                        <p className="text-muted-foreground">{itinerary.tips}</p>
                      </div>
                   </CardContent>
                </Card>

                {itinerary.itinerary.map((day, index) => (
                  <Card key={day.day} className="transition-transform hover:scale-[1.02] animate-fade-in-up" style={{ animationDelay: `${0.2 * (index + 1)}s` }}>
                    <CardHeader>
                      <CardTitle className="font-headline text-2xl">Day {day.day}</CardTitle>
                      <CardDescription>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Coffee className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Morning</p>
                          <p className="text-muted-foreground">{day.morning}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Sunset className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Afternoon</p>
                          <p className="text-muted-foreground">{day.afternoon}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Moon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Evening</p>
                          <p className="text-muted-foreground">{day.evening}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ItineraryPlanner />
    </Suspense>
  );
}
