// =============================================================================
// Magazine Itinerary Service
// Transforms raw itinerary data into an immersive "magazine spread" experience.
// =============================================================================

import {
    DailyMagazineSpread,
    TripMagazine,
    MagazineExportOptions,
    MagazineSection,
    MagazineActivity,
    InsiderTip,
    MagazineImage,
    DayMood,
    ActivityCategory,
} from '../types/magazine';
import { Trip, ItineraryActivity, City } from '../types';
import { getGeminiService } from './geminiService';

// =============================================================================
// Types for internal use
// =============================================================================

export interface TripContextForMagazine {
    trip: Trip;
    cities: City[];
    itineraryActivities: ItineraryActivity[];
    travelerProfile?: string;
    interests?: string[];
}

interface DayData {
    dayNumber: number;
    date: string;
    city: string;
    country?: string;
    activities: ItineraryActivity[];
    weather?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Maps an ItineraryActivityType to an ActivityCategory for the magazine.
 */
function mapActivityCategory(type: string): ActivityCategory {
    const mapping: Record<string, ActivityCategory> = {
        transport: 'transport',
        accommodation: 'rest',
        meal: 'food',
        sightseeing: 'sightseeing',
        culture: 'culture',
        food: 'food',
        nature: 'nature',
        shopping: 'shopping',
        nightlife: 'nightlife',
        other: 'other',
    };
    return mapping[type] || 'other';
}

/**
 * Groups activities by time of day.
 */
function groupActivitiesByTimeOfDay(
    activities: ItineraryActivity[]
): Record<'morning' | 'afternoon' | 'evening' | 'night', ItineraryActivity[]> {
    const groups: Record<'morning' | 'afternoon' | 'evening' | 'night', ItineraryActivity[]> = {
        morning: [],
        afternoon: [],
        evening: [],
        night: [],
    };

    for (const act of activities) {
        const hour = parseInt(act.time?.split(':')[0] || '12', 10);
        if (hour >= 6 && hour < 12) {
            groups.morning.push(act);
        } else if (hour >= 12 && hour < 17) {
            groups.afternoon.push(act);
        } else if (hour >= 17 && hour < 21) {
            groups.evening.push(act);
        } else {
            groups.night.push(act);
        }
    }

    return groups;
}

/**
 * Infers a DayMood based on the types of activities.
 */
function inferMoodFromActivities(activities: ItineraryActivity[]): DayMood {
    const typeCounts: Record<string, number> = {};
    for (const act of activities) {
        typeCounts[act.type] = (typeCounts[act.type] || 0) + 1;
    }

    // Simple heuristic
    if (typeCounts.nature && typeCounts.nature > 1) return 'nature';
    if (typeCounts.food && typeCounts.food >= 2) return 'gastronomic';
    if (typeCounts.culture && typeCounts.culture >= 2) return 'cultural';
    if (typeCounts.nightlife) return 'urban';
    if (typeCounts.shopping) return 'urban';
    return 'adventurous'; // default
}

// =============================================================================
// Main Service
// =============================================================================

/**
 * Generates a magazine spread for a single day.
 * Calls Gemini to generate rich editorial content.
 */
export async function generateDaySpread(
    tripContext: TripContextForMagazine,
    dayData: DayData,
    useAI: boolean = true
): Promise<DailyMagazineSpread> {
    const { dayNumber, date, city, activities } = dayData;
    const country = dayData.country || tripContext.cities.find(c => c.name === city)?.country || '';

    // Group activities by time of day
    const groupedActivities = groupActivitiesByTimeOfDay(activities);

    // Build base sections
    const timeOfDayLabels: Record<string, string> = {
        morning: 'Manhã',
        afternoon: 'Tarde',
        evening: 'Entardecer',
        night: 'Noite',
    };

    // Default sections (will be enriched by AI)
    let sections: MagazineSection[] = [];
    for (const [period, acts] of Object.entries(groupedActivities)) {
        if (acts.length === 0) continue;

        const sectionActivities: MagazineActivity[] = acts.map((act) => ({
            id: act.id,
            time: act.time,
            title: act.title,
            description: act.notes || 'Uma atividade especial para o seu dia.',
            whyWeChoseThis: 'Esta é uma experiência essencial.',
            perfectFor: [],
            duration: act.duration ? `${act.duration} min` : '1 hora',
            cost: act.price || 'A consultar',
            address: act.location || city,
            coordinates: { lat: 0, lng: 0 },
            category: mapActivityCategory(act.type),
            image: act.image ? { url: act.image, aspectRatio: '16:9' } : undefined,
        }));

        sections.push({
            timeOfDay: period as 'morning' | 'afternoon' | 'evening' | 'night',
            title: `${timeOfDayLabels[period]}: Explorando ${city}`,
            narrative: `Prepare-se para ${acts.length} experiência(s) inesquecível(is).`,
            activities: sectionActivities,
        });
    }

    // Default values
    let headline = `Dia ${dayNumber} em ${city}`;
    let subheadline = 'Descobertas e momentos únicos';
    let introNarrative = `Hoje, o dia começa com energia em ${city}. Prepare-se para explorar, saborear e se surpreender.`;
    let closingThought = 'E assim termina mais um dia memorável...';
    let mood: DayMood = inferMoodFromActivities(activities);
    let insiderTips: InsiderTip[] = [{ icon: '💡', title: 'Dica do local', content: 'Chegue cedo para evitar filas!' }];
    let estimatedCost = 'A calcular';
    let walkingDistance = '~5km';

    // Call Gemini for AI-enriched content
    if (useAI && activities.length > 0) {
        try {
            const geminiService = getGeminiService();
            const aiContent = await geminiService.generateMagazineContent({
                destination: tripContext.trip.destination,
                country,
                dayNumber,
                date,
                city,
                weather: dayData.weather || 'Clima agradável',
                travelerProfile: tripContext.travelerProfile || 'Viajante curioso',
                interests: tripContext.interests || ['cultura', 'gastronomia'],
                activities: activities.map(a => ({
                    id: a.id,
                    time: a.time,
                    title: a.title,
                    location: a.location || city,
                    type: a.type,
                    duration: a.duration ? `${a.duration} min` : undefined,
                    cost: a.price,
                })),
            });

            if (aiContent) {
                // Merge AI content with base structure
                headline = aiContent.headline || headline;
                subheadline = aiContent.subheadline || subheadline;
                introNarrative = aiContent.introNarrative || introNarrative;
                closingThought = aiContent.closingThought || closingThought;
                mood = (aiContent.mood as DayMood) || mood;
                estimatedCost = aiContent.estimatedCost || estimatedCost;
                walkingDistance = aiContent.walkingDistance || walkingDistance;

                // Merge insider tips
                if (aiContent.insiderTips && aiContent.insiderTips.length > 0) {
                    insiderTips = aiContent.insiderTips;
                }

                // Merge section narratives
                if (aiContent.sections && aiContent.sections.length > 0) {
                    for (const aiSection of aiContent.sections) {
                        const matchingSection = sections.find(s => s.timeOfDay === aiSection.timeOfDay);
                        if (matchingSection) {
                            matchingSection.title = aiSection.title || matchingSection.title;
                            matchingSection.narrative = aiSection.narrative || matchingSection.narrative;
                        }
                    }
                }

                // Merge activity descriptions
                if (aiContent.activities) {
                    for (const aiAct of aiContent.activities) {
                        for (const section of sections) {
                            const matchingActivity = section.activities.find(a => a.id === aiAct.id);
                            if (matchingActivity) {
                                matchingActivity.description = aiAct.description || matchingActivity.description;
                                matchingActivity.whyWeChoseThis = aiAct.whyWeChoseThis || matchingActivity.whyWeChoseThis;
                                matchingActivity.proTip = aiAct.proTip;
                                matchingActivity.photoSpot = aiAct.photoSpot;
                                matchingActivity.perfectFor = aiAct.perfectFor || [];
                            }
                        }
                    }
                }

                console.log(`[MagazineService] AI content generated for Day ${dayNumber}`);
            }
        } catch (error) {
            console.error('[MagazineService] Failed to generate AI content, using defaults:', error);
        }
    }

    // Placeholder hero image
    const heroImage: MagazineImage = {
        url: tripContext.trip.coverImage || '',
        caption: `Vista de ${city}`,
        aspectRatio: '16:9',
    };

    // Build the final spread
    const spread: DailyMagazineSpread = {
        dayNumber,
        date,
        city,
        headline,
        subheadline,
        introNarrative,
        closingThought,
        heroImage,
        imageGallery: [],
        sections,
        mood,
        weatherSummary: dayData.weather || 'Clima agradável',
        walkingDistance,
        estimatedCost,
        insiderTips,
        localPhrases: [],
    };

    return spread;
}

/**
 * Generates the full magazine for an entire trip.
 */
export async function generateFullMagazine(
    tripContext: TripContextForMagazine
): Promise<TripMagazine> {
    const { trip, itineraryActivities } = tripContext;

    // Group activities by day
    const activitiesByDay = new Map<number, ItineraryActivity[]>();
    for (const act of itineraryActivities) {
        const day = act.day;
        if (!activitiesByDay.has(day)) {
            activitiesByDay.set(day, []);
        }
        activitiesByDay.get(day)!.push(act);
    }

    // Generate spreads for each day
    const daySpreads: DailyMagazineSpread[] = [];
    const sortedDays = Array.from(activitiesByDay.keys()).sort((a, b) => a - b);

    for (const dayNum of sortedDays) {
        const dayActivities = activitiesByDay.get(dayNum) || [];
        // Determine city for the day (from the first activity or trip destination)
        const city = tripContext.cities.find((c) => dayActivities[0]?.location?.includes(c.name))?.name || trip.destination;
        const dayData: DayData = {
            dayNumber: dayNum,
            date: dayActivities[0]?.date || trip.startDate,
            city,
            activities: dayActivities,
        };
        const spread = await generateDaySpread(tripContext, dayData);
        daySpreads.push(spread);
    }

    return {
        tripId: trip.id,
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        days: daySpreads,
        generatedAt: new Date().toISOString(),
    };
}

/**
 * Refreshes the editorial content for a specific day.
 * Keeps activity data but regenerates headlines, narratives, tips.
 */
export async function refreshEditorialContent(
    tripContext: TripContextForMagazine,
    dayNumber: number
): Promise<DailyMagazineSpread | null> {
    const dayActivities = tripContext.itineraryActivities.filter((a) => a.day === dayNumber);
    if (dayActivities.length === 0) return null;

    const city = tripContext.cities.find((c) => dayActivities[0]?.location?.includes(c.name))?.name || tripContext.trip.destination;
    const dayData: DayData = {
        dayNumber,
        date: dayActivities[0]?.date || tripContext.trip.startDate,
        city,
        activities: dayActivities,
    };

    // For now, just regenerate everything
    // In the future, we can selectively refresh only the editorial bits via Gemini
    return generateDaySpread(tripContext, dayData);
}

/**
 * Exports the magazine as a PDF.
 * (Placeholder - will be implemented in a later phase)
 */
export async function exportAsPdf(
    magazine: TripMagazine,
    options: MagazineExportOptions
): Promise<string> {
    console.log('Exporting magazine as PDF with options:', options);
    // TODO: Implement PDF export using jspdf or similar
    return Promise.resolve(`/exports/${magazine.tripId}-magazine.pdf`);
}
