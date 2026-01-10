import { isValid, parseISO, isPast, differenceInMonths, parse } from 'date-fns';
import airports from '../data/iataAirports.json';

const IATA_CODES = new Set(airports.map(a => a.code));

export const validators = {
    iataCode: (code: string): boolean => {
        return code.length === 3 && IATA_CODES.has(code.toUpperCase());
    },

    date: (dateStr: string): boolean => {
        if (!dateStr) return false;
        const date = parseISO(dateStr);
        return isValid(date);
        // Not requiring !isPastDate here as sometimes we might log past trips
    },

    futureDate: (dateStr: string): boolean => {
        if (!dateStr) return false;
        const date = parseISO(dateStr);
        return isValid(date) && !isPast(date);
    },

    time: (time: string): boolean => {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
    },

    flightNumber: (fn: string): boolean => {
        // Allows "AA 1234" or "AA1234", standard IATA flight number format
        return /^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/.test(fn.toUpperCase());
    },

    hotelStars: (stars: number): boolean => {
        return stars >= 1 && stars <= 5;
    },

    passportExpiry: (expiryDateStr: string, tripReturnDateStr: string | null): boolean => {
        if (!expiryDateStr) return false;
        // Default to today if no trip date provided, though logic usually requires trip date
        const tripDate = tripReturnDateStr ? parseISO(tripReturnDateStr) : new Date();
        const expiryDate = parseISO(expiryDateStr);

        if (!isValid(expiryDate) || !isValid(tripDate)) return false;

        return differenceInMonths(expiryDate, tripDate) >= 6;
    }
};

export const validateFlightTimes = (
    departureDate: string,
    departureTime: string,
    arrivalDate: string,
    arrivalTime: string
): boolean => {
    const dep = parseISO(`${departureDate}T${departureTime}`);
    const arr = parseISO(`${arrivalDate}T${arrivalTime}`);

    if (!isValid(dep) || !isValid(arr)) return false;

    return arr > dep;
};

export const validateHotelDates = (checkIn: string, checkOut: string): boolean => {
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);

    if (!isValid(start) || !isValid(end)) return false;

    return end > start;
};
