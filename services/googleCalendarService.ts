import { ItineraryActivity, Transport, HotelReservation } from '../types';
import { googleAuthService } from './googleAuthService';

/**
 * Service to handle Google Calendar integration
 */
export const googleCalendarService = {
    /**
     * Create a calendar event for an itinerary activity
     */
    async createEvent(activity: ItineraryActivity, city: string = '') {
        console.log('Syncing with Google Calendar:', activity);

        try {
            // Ensure we are authorized
            if (!googleAuthService.isAuthorized()) {
                await googleAuthService.getAccessToken();
            }

            const event = {
                'summary': activity.title,
                'location': activity.location || city,
                'description': activity.notes || '',
                'start': {
                    'dateTime': `${activity.date}T${activity.time}:00Z`,
                    'timeZone': 'UTC'
                },
                'end': {
                    'dateTime': `${this.calculateEndTime(activity.date, activity.time, activity.duration)}Z`,
                    'timeZone': 'UTC'
                }
            };

            const request = (window as any).gapi.client.calendar.events.insert({
                'calendarId': 'primary',
                'resource': event
            });

            const response = await request;
            console.log('Event created:', response.result);
            return response.result;
        } catch (error) {
            console.error('Error creating calendar event:', error);
            throw error;
        }
    },

    /**
     * Sync the entire trip itinerary to Google Calendar
     */
    async syncTrip(activities: ItineraryActivity[], hotels: HotelReservation[], transports: Transport[]) {
        console.log('Syncing entire trip to Google Calendar...');

        try {
            if (!googleAuthService.isAuthorized()) {
                await googleAuthService.getAccessToken();
            }

            const results = [];

            // Sync activities
            for (const activity of activities) {
                const res = await this.createEvent(activity);
                results.push(res);
            }

            // Sync hotel check-ins
            for (const hotel of hotels) {
                const res = await this.createHotelEvent(hotel);
                results.push(res);
            }

            return results;
        } catch (error) {
            console.error('Error syncing trip:', error);
            throw error;
        }
    },

    /**
     * Create a hotel check-in event
     */
    async createHotelEvent(hotel: HotelReservation) {
        const event = {
            'summary': `Check-in: ${hotel.name}`,
            'location': hotel.address,
            'start': {
                'dateTime': `${hotel.checkIn}T${hotel.checkInTime || '15:00'}:00Z`,
                'timeZone': 'UTC'
            },
            'end': {
                'dateTime': `${hotel.checkIn}T20:00:00Z`,
                'timeZone': 'UTC'
            }
        };

        return (window as any).gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event
        });
    },

    /**
     * Helper to calculate end time based on duration or default (1h)
     */
    calculateEndTime(date: string, startTime: string, durationMinutes?: number): string {
        const [h, m] = startTime.split(':').map(Number);
        const dateObj = new Date(`${date}T${startTime}:00`);
        const duration = durationMinutes || 60;
        dateObj.setMinutes(dateObj.getMinutes() + duration);

        return dateObj.toISOString().split('.')[0];
    }
};
