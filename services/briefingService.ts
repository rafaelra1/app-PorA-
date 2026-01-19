
import { supabase } from '../lib/supabase';
import { PreTripBriefingData } from '../types/preTripBriefing';

export interface CityBriefingRow {
    id: string;
    trip_id: string;
    city_name: string;
    country: string;
    data: PreTripBriefingData;
    created_at: string;
    updated_at: string;
}

export const BriefingService = {
    /**
     * Fetch existing briefing from the database
     */
    async getBriefing(tripId: string, cityName: string, country: string): Promise<PreTripBriefingData | null> {
        try {
            const { data, error } = await supabase
                .from('city_briefings')
                .select('data')
                .eq('trip_id', tripId)
                .eq('city_name', cityName)
                .eq('country', country)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows found
                    return null;
                }
                console.error('Error fetching briefing:', error);
                return null;
            }

            return data?.data as PreTripBriefingData;
        } catch (err) {
            console.error('Unexpected error fetching briefing:', err);
            return null;
        }
    },

    /**
     * Save or update a briefing in the database
     */
    async saveBriefing(tripId: string, cityName: string, country: string, briefingData: PreTripBriefingData): Promise<void> {
        try {
            // Upsert based on the unique constraint (trip_id, city_name, country)
            const { error } = await supabase
                .from('city_briefings')
                .upsert({
                    trip_id: tripId,
                    city_name: cityName,
                    country: country,
                    data: briefingData,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'trip_id,city_name,country'
                });

            if (error) {
                console.error('Error saving briefing:', error);
                throw error;
            }
        } catch (err) {
            console.error('Unexpected error saving briefing:', err);
            throw err;
        }
    }
};
