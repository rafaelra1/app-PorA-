import { supabase } from '../lib/supabase';
import { JournalEntry, JournalMood, Participant } from '../types';

// =============================================================================
// Types for Database Operations
// =============================================================================

export interface JournalEntryDB {
    id: string;
    trip_id: string;
    user_id: string;
    content: string;
    location: string | null;
    mood: JournalMood | null;
    tags: string[];
    photos: string[];
    day_number: number | null;
    weather_temp: number | null;
    weather_condition: string | null;
    weather_icon: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateJournalEntryInput {
    tripId: string;
    content: string;
    location?: string;
    mood?: JournalMood;
    tags?: string[];
    photos?: File[];
    dayNumber?: number;
}

// =============================================================================
// Storage Operations
// =============================================================================

const BUCKET_NAME = 'trip-memories';

/**
 * Uploads multiple images to Supabase Storage and returns their public URLs.
 */
export async function uploadJournalImages(
    userId: string,
    tripId: string,
    files: File[]
): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${tripId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            continue; // Skip this file but continue with others
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
            uploadedUrls.push(urlData.publicUrl);
        }
    }

    return uploadedUrls;
}

// =============================================================================
// Database Operations
// =============================================================================

/**
 * Fetches all journal entries for a specific trip.
 */
export async function fetchJournalEntries(tripId: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching journal entries:', error);
        throw error;
    }

    // Transform DB format to frontend format
    return (data || []).map((entry: JournalEntryDB) => transformDBEntryToFrontend(entry));
}

/**
 * Creates a new journal entry.
 */
export async function createJournalEntry(
    input: CreateJournalEntryInput,
    author: Participant
): Promise<JournalEntry> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    let photoUrls: string[] = [];

    // Upload photos if provided
    if (input.photos && input.photos.length > 0) {
        photoUrls = await uploadJournalImages(user.id, input.tripId, input.photos);
    }

    // Insert the entry
    const { data, error } = await supabase
        .from('journal_entries')
        .insert({
            trip_id: input.tripId,
            user_id: user.id,
            content: input.content,
            location: input.location || null,
            mood: input.mood || null,
            tags: input.tags || [],
            photos: photoUrls,
            day_number: input.dayNumber || null,
            // Mock weather data (can be replaced with real API later)
            weather_temp: Math.floor(Math.random() * 15) + 18,
            weather_condition: 'Ensolarado',
            weather_icon: 'sunny',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating journal entry:', error);
        throw error;
    }

    // Transform to frontend format with author info
    return transformDBEntryToFrontend(data as JournalEntryDB, author);
}

/**
 * Deletes a journal entry.
 */
export async function deleteJournalEntry(entryId: string): Promise<void> {
    // First, get the entry to find the photos
    const { data: entry, error: fetchError } = await supabase
        .from('journal_entries')
        .select('photos, user_id, trip_id')
        .eq('id', entryId)
        .single();

    if (fetchError) {
        console.error('Error fetching entry for deletion:', fetchError);
        throw fetchError;
    }

    // Delete photos from storage
    if (entry?.photos && entry.photos.length > 0) {
        const filePaths = entry.photos.map((url: string) => {
            // Extract file path from URL
            const urlParts = url.split(`${BUCKET_NAME}/`);
            return urlParts.length > 1 ? urlParts[1] : '';
        }).filter(Boolean);

        if (filePaths.length > 0) {
            await supabase.storage.from(BUCKET_NAME).remove(filePaths);
        }
    }

    // Delete the entry
    const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);

    if (error) {
        console.error('Error deleting journal entry:', error);
        throw error;
    }
}

// =============================================================================
// Transformers
// =============================================================================

/**
 * Transforms a database entry to the frontend JournalEntry format.
 */
function transformDBEntryToFrontend(
    dbEntry: JournalEntryDB,
    author?: Participant
): JournalEntry {
    const createdAt = new Date(dbEntry.created_at);

    return {
        id: dbEntry.id,
        author: author || {
            id: dbEntry.user_id,
            name: 'Viajante',
            avatar: `https://ui-avatars.com/api/?name=User&background=667eea&color=fff`,
            role: 'Viajante',
        },
        timestamp: createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        date: createdAt.toISOString().split('T')[0],
        dayNumber: dbEntry.day_number || undefined,
        location: dbEntry.location || 'Local não especificado',
        content: dbEntry.content,
        images: dbEntry.photos || [],
        mood: dbEntry.mood || undefined,
        weather: dbEntry.weather_temp ? {
            temp: dbEntry.weather_temp,
            condition: dbEntry.weather_condition || 'Ensolarado',
            icon: dbEntry.weather_icon || 'sunny',
        } : undefined,
        tags: dbEntry.tags || [],
        likes: 0,
        comments: 0,
    };
}
