// =============================================================================
// Magazine View Types
// =============================================================================

/**
 * Represents the mood/vibe of a given day in the magazine.
 */
export type DayMood =
    | 'adventurous'
    | 'relaxing'
    | 'cultural'
    | 'gastronomic'
    | 'romantic'
    | 'urban'
    | 'nature';

/**
 * Represents an image used within the magazine view.
 */
export interface MagazineImage {
    url: string;
    caption?: string;
    credit?: string;
    aspectRatio: '16:9' | '4:3' | '1:1' | '3:4';
}

/**
 * Activity category for visual distinction in the UI.
 */
export type ActivityCategory =
    | 'sightseeing'
    | 'food'
    | 'culture'
    | 'nature'
    | 'transport'
    | 'shopping'
    | 'nightlife'
    | 'rest'
    | 'other';

/**
 * A single activity presented in magazine format.
 */
export interface MagazineActivity {
    id: string;
    time: string;
    title: string;

    // Editorial content
    description: string;           // Evocative description
    whyWeChoseThis: string;        // "Because no visit to Lisbon is complete without..."
    perfectFor: string[];          // e.g., ["photographers", "romantics"]

    // Practical info
    duration: string;
    cost?: string;
    address: string;
    coordinates: { lat: number; lng: number };

    // Inline tips
    proTip?: string;
    avoidTip?: string;
    photoSpot?: string;

    // Visual
    image?: MagazineImage;
    category: ActivityCategory;
}

/**
 * A section of the day, grouped by time of day.
 */
export interface MagazineSection {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    title: string;                 // e.g., "Morning: A Lisbon Awakening"
    narrative: string;             // Text connecting the activities
    activities: MagazineActivity[];
}

/**
 * An insider tip with personality.
 */
export interface InsiderTip {
    icon: string;
    title: string;
    content: string;
    source?: string;               // "Local's tip" or "Our experience"
}

/**
 * A local phrase to help the traveler.
 */
export interface LocalPhrase {
    phrase: string;
    translation: string;
    pronunciation?: string;
}

/**
 * The main data structure for a single day's "magazine spread".
 */
export interface DailyMagazineSpread {
    dayNumber: number;
    date: string;
    city: string;

    // Editorial
    headline: string;              // e.g., "Lost in the Alleys of Alfama"
    subheadline: string;           // e.g., "A day of fado, pastéis, and viewpoints"
    introNarrative: string;        // 2-3 evocative paragraphs
    closingThought: string;        // End-of-day reflection

    // Visual
    heroImage: MagazineImage;
    imageGallery: MagazineImage[];
    mapSnapshot?: string;          // URL for a stylized map of the day

    // Structured content
    sections: MagazineSection[];

    // Metadata
    mood: DayMood;
    weatherSummary: string;        // "Sunny morning, mild afternoon"
    walkingDistance: string;       // "~8km of walking"
    estimatedCost: string;         // "€45-60 per person"

    // Editorial extras
    insiderTips: InsiderTip[];
    localPhrases?: LocalPhrase[];
    spotifyPlaylist?: string;      // Suggested playlist URL
}

/**
 * Options for exporting the magazine to PDF.
 */
export interface MagazineExportOptions {
    includePhotos: boolean;
    format: 'A4' | 'letter';
    includeQrCodes: boolean;
}

/**
 * The complete trip magazine, aggregating all day spreads.
 */
export interface TripMagazine {
    tripId: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    days: DailyMagazineSpread[];
    generatedAt: string;
}
