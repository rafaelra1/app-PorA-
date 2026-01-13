import { z } from 'zod';

// =============================================================================
// Base Schema Helpers
// =============================================================================

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM');
const iataCodeSchema = z.string().length(3).toUpperCase();

const fieldWithConfidence = <T extends z.ZodTypeAny>(valueSchema: T) =>
    z.object({
        value: valueSchema.nullable(),
        confidence: z.number().min(0).max(1),
    });

// =============================================================================
// Flight Schema
// =============================================================================

export const FlightFieldsSchema = z.object({
    airline: fieldWithConfidence(z.string()).optional(),
    flightNumber: fieldWithConfidence(z.string()).optional(),
    pnr: fieldWithConfidence(z.string().min(4).max(10)).optional(), // Locator 4-10 chars
    ticketNumber: fieldWithConfidence(z.string()).optional(),
    departureAirport: fieldWithConfidence(iataCodeSchema).optional(),
    arrivalAirport: fieldWithConfidence(iataCodeSchema).optional(),
    departureDate: fieldWithConfidence(dateSchema).optional(),
    arrivalDate: fieldWithConfidence(dateSchema).optional(),
    departureTime: fieldWithConfidence(timeSchema).optional(),
    arrivalTime: fieldWithConfidence(timeSchema).optional(),
    terminal: fieldWithConfidence(z.string()).optional(),
    gate: fieldWithConfidence(z.string()).optional(),
    seat: fieldWithConfidence(z.string()).optional(),
    class: fieldWithConfidence(z.string()).optional(),
});

export const FlightItemSchema = z.object({
    fields: FlightFieldsSchema,
    overallConfidence: z.number().min(0).max(1),
});

// =============================================================================
// Hotel Schema
// =============================================================================

export const HotelFieldsSchema = z.object({
    hotelName: fieldWithConfidence(z.string()).optional(),
    address: fieldWithConfidence(z.string()).optional(),
    checkInDate: fieldWithConfidence(dateSchema).optional(),
    checkInTime: fieldWithConfidence(timeSchema).optional(),
    checkOutDate: fieldWithConfidence(dateSchema).optional(),
    checkOutTime: fieldWithConfidence(timeSchema).optional(),
    roomType: fieldWithConfidence(z.string()).optional(),
    confirmationNumber: fieldWithConfidence(z.string()).optional(),
    guestName: fieldWithConfidence(z.string()).optional(),
});

export const HotelItemSchema = z.object({
    fields: HotelFieldsSchema,
    overallConfidence: z.number().min(0).max(1),
});

// =============================================================================
// Car Rental Schema
// =============================================================================

export const CarRentalFieldsSchema = z.object({
    company: fieldWithConfidence(z.string()).optional(),
    pickupLocation: fieldWithConfidence(z.string()).optional(),
    pickupDate: fieldWithConfidence(dateSchema).optional(),
    pickupTime: fieldWithConfidence(timeSchema).optional(),
    dropoffLocation: fieldWithConfidence(z.string()).optional(),
    dropoffDate: fieldWithConfidence(dateSchema).optional(),
    dropoffTime: fieldWithConfidence(timeSchema).optional(),
    vehicleModel: fieldWithConfidence(z.string()).optional(),
    confirmationNumber: fieldWithConfidence(z.string()).optional(),
});

export const CarRentalItemSchema = z.object({
    fields: CarRentalFieldsSchema,
    overallConfidence: z.number().min(0).max(1),
});

// =============================================================================
// Insurance Schema
// =============================================================================

export const InsuranceFieldsSchema = z.object({
    provider: fieldWithConfidence(z.string()).optional(),
    policyNumber: fieldWithConfidence(z.string()).optional(),
    insuredName: fieldWithConfidence(z.string()).optional(),
    coverageStart: fieldWithConfidence(dateSchema).optional(),
    coverageEnd: fieldWithConfidence(dateSchema).optional(),
    emergencyPhone: fieldWithConfidence(z.string()).optional(),
});

export const InsuranceItemSchema = z.object({
    fields: InsuranceFieldsSchema,
    overallConfidence: z.number().min(0).max(1),
});

// =============================================================================
// Generic Item Schema
// =============================================================================

export const GenericFieldsSchema = z.object({
    name: fieldWithConfidence(z.string()).optional(),
    date: fieldWithConfidence(dateSchema).optional(),
    reference: fieldWithConfidence(z.string()).optional(),
    details: fieldWithConfidence(z.string()).optional(),
});

export const GenericItemSchema = z.object({
    fields: GenericFieldsSchema,
    overallConfidence: z.number().min(0).max(1),
});

// =============================================================================
// Document Analysis Response Schema
// =============================================================================

export const DocumentTypeEnum = z.enum([
    'flight',
    'hotel',
    'car',
    'train',
    'bus',
    'insurance',
    'passport',
    'visa',
    'activity',
    'other',
]);

export const DocumentAnalysisResponseSchema = z.object({
    type: DocumentTypeEnum,
    items: z.array(
        z.union([
            FlightItemSchema,
            HotelItemSchema,
            CarRentalItemSchema,
            InsuranceItemSchema,
            GenericItemSchema,
        ])
    ),
});

// =============================================================================
// Classification Response
// =============================================================================

export const ClassificationResponseSchema = z.object({
    type: DocumentTypeEnum,
    confidence: z.number().min(0).max(1),
});

// =============================================================================
// Types
// =============================================================================

export type DocumentType = z.infer<typeof DocumentTypeEnum>;
export type FlightFields = z.infer<typeof FlightFieldsSchema>;
export type HotelFields = z.infer<typeof HotelFieldsSchema>;
export type CarRentalFields = z.infer<typeof CarRentalFieldsSchema>;
export type DocumentAnalysisResponse = z.infer<typeof DocumentAnalysisResponseSchema>;
export type ClassificationResponse = z.infer<typeof ClassificationResponseSchema>;
