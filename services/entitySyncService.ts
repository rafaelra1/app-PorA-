import {
    TripDocument,
    Transport,
    HotelReservation,
    CarRental,
    CalendarEvent,
    TransportType
} from '../types';

// =============================================================================
// Document -> Entity Mapping Constants
// =============================================================================

const DOCUMENT_TO_TRANSPORT_TYPE: Record<string, TransportType> = {
    'flight': 'flight',
    'car': 'car', // Generally managed separately, but can be a transport
    'bus': 'bus',
    'train': 'train',
    'ferry': 'ferry'
};

// =============================================================================
// Mapping Functions
// =============================================================================

export const documentToTransport = (doc: Partial<TripDocument>): Partial<Transport> => {
    // Default assumptions
    const type = DOCUMENT_TO_TRANSPORT_TYPE[doc.type || ''] || 'flight';
    const departureDate = doc.date || '';
    // If no arrival date/time known, assume same day or +duration (logic handled by user or defaults)

    return {
        type: type,
        operator: doc.title || '', // e.g. "Latam"
        reference: doc.reference || '',
        departureLocation: doc.pickupLocation || '',
        arrivalLocation: doc.dropoffLocation || '',
        departureDate: departureDate,
        departureTime: doc.details || '12:00', // Best guess or extracted time
        arrivalDate: departureDate, // Default to same day
        arrivalTime: '', // User to fill
        status: 'confirmed',
        confirmation: doc.reference || '',
        documentId: doc.id
    };
};

export const documentToAccommodation = (doc: Partial<TripDocument>): Partial<HotelReservation> => {
    return {
        name: doc.title || '',
        checkIn: doc.date || '',
        checkOut: doc.details || doc.date || '', // Often details stores checkout or duration
        confirmation: doc.reference || '',
        address: doc.pickupLocation || '', // Address often in pickup/location field
        status: 'confirmed',
        documentId: doc.id
    };
};

export const documentToCarRental = (doc: Partial<TripDocument>): Partial<CarRental> => {
    return {
        company: doc.title || '',
        model: doc.model || '',
        pickupLocation: doc.pickupLocation || '',
        dropoffLocation: doc.dropoffLocation || doc.pickupLocation || '',
        startDate: doc.date || '',
        endDate: doc.details || doc.date || '',
        confirmation: doc.reference || '',
        documentId: doc.id
    };
};


// =============================================================================
// Calendar Event Generation
// =============================================================================

export const createCalendarEventsFromDocument = (doc: TripDocument, tripId: string): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const now = new Date().toISOString();
    const baseEvent = {
        tripId,
        documentId: doc.id,
        createdAt: now,
        updatedAt: now,
        completed: false
    };

    if (doc.type === 'flight') {
        // Depature Event
        events.push({
            ...baseEvent,
            id: `evt_dep_${doc.id}`,
            title: `✈️ Voo: ${doc.title} (${doc.pickupLocation || 'Origem'} → ${doc.dropoffLocation || 'Destino'})`,
            description: `Voo ${doc.reference || ''}. ${doc.details || ''}`,
            startDate: doc.date || '',
            startTime: doc.details || '00:00',
            endTime: undefined,
            allDay: false, // Added missing property
            type: 'flight',
            location: doc.pickupLocation
        } as CalendarEvent);

        // Arrival Event (Simulated 3h later if no data, or just one event? Let's stick to one main event for now unless we have arrival data)
        // If we had arrival time, we'd add it. For now, simple mapping.
    }
    else if (doc.type === 'hotel') {
        // Check-in
        events.push({
            ...baseEvent,
            id: `evt_checkin_${doc.id}`,
            title: `🏨 Check-in: ${doc.title}`,
            startDate: doc.date || '',
            startTime: '15:00', // Standard check-in
            allDay: false,
            type: 'accommodation',
            location: doc.pickupLocation, // Address
            description: `Reserva: ${doc.reference}`
        } as CalendarEvent);

        // Check-out (if date known)
        if (doc.details && doc.details.match(/^\d{4}-\d{2}-\d{2}$/)) {
            events.push({
                ...baseEvent,
                id: `evt_checkout_${doc.id}`,
                title: `👋 Check-out: ${doc.title}`,
                startDate: doc.details,
                startTime: '11:00', // Standard check-out
                allDay: false,
                type: 'accommodation',
                location: doc.pickupLocation
            } as CalendarEvent);
        }
    }
    else if (doc.type === 'car') {
        events.push({
            ...baseEvent,
            id: `evt_car_pickup_${doc.id}`,
            title: `🚗 Retirada Carro: ${doc.title}`,
            startDate: doc.date || '',
            startTime: '10:00',
            type: 'transport',
            location: doc.pickupLocation,
            allDay: false, // Ensure this is present
            description: `Modelo: ${doc.model}. Ref: ${doc.reference}`
        } as CalendarEvent);

        if (doc.details && doc.details.match(/^\d{4}-\d{2}-\d{2}$/)) {
            events.push({
                ...baseEvent,
                id: `evt_car_dropoff_${doc.id}`,
                title: `🚗 Devolução Carro: ${doc.title}`,
                startDate: doc.details,
                startTime: '10:00',
                allDay: false, // Ensure this is present
                type: 'transport',
                location: doc.dropoffLocation || doc.pickupLocation
            } as CalendarEvent);
        }
    }
    else {
        // Generic Event
        events.push({
            ...baseEvent,
            id: `evt_doc_${doc.id}`,
            title: `${getEmojiForType(doc.type)} ${doc.title}`,
            startDate: doc.date || '',
            startTime: '09:00',
            type: 'other',
            description: doc.details
        } as CalendarEvent);
    }

    return events;
};

export const getAutoSyncData = (doc: TripDocument): { entityType: 'transport' | 'accommodation' | 'car' | null, data: any } => {
    if (['flight', 'bus', 'train', 'ferry'].includes(doc.type)) {
        return { entityType: 'transport', data: documentToTransport(doc) };
    }
    if (doc.type === 'hotel') {
        return { entityType: 'accommodation', data: documentToAccommodation(doc) };
    }
    if (doc.type === 'car') {
        return { entityType: 'car', data: documentToCarRental(doc) };
    }
    return { entityType: null, data: null };
};

const getEmojiForType = (type: string) => {
    switch (type) {
        case 'activity': return '🎫';
        case 'insurance': return '🏥';
        case 'passport': return '🛂';
        case 'visa': return '🛂';
        case 'vaccine': return '💉';
        default: return '📄';
    }
};
