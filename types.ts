
export type TripStatus = 'confirmed' | 'planning' | 'completed';
export type ActivityType = 'flight' | 'hotel' | 'food' | 'transport' | 'culture';
export * from './types/checklist';

// =============================================================================
// Notification Types
// =============================================================================

export type NotificationType =
  | 'alert'
  | 'flight_change'
  | 'reminder'
  | 'hotel_reminder'
  | 'document_expiry'
  | 'weather_alert'
  | 'itinerary_reminder'
  | 'social';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  deleted: boolean;
  createdAt: string;
  actionUrl?: string;
  tripId?: string;
  metadata?: Record<string, unknown>;
}

export type EmailFrequency = 'immediate' | 'daily' | 'weekly';

export interface UserPreferences {
  userId: string;
  tripReminders: boolean;
  documentAlerts: boolean;
  journalActivity: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  emailFrequency: EmailFrequency;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  autoCreateEntities: boolean;
}

// Tab types for TripDetails navigation
export type SubTab = 'overview' | 'checklist' | 'itinerary' | 'map' | 'cities' | 'logistics' | 'accommodation' | 'transport' | 'docs' | 'budget' | 'journal' | 'memories' | 'media';
export type CityTab = 'info' | 'attractions' | 'gastronomy' | 'tips' | 'timeline' | 'map';
export type DocsFilter = 'Tudo' | 'Reservas' | 'Pessoais' | 'Outros';
export type ReservationType = 'hotel' | 'flight' | 'car' | 'insurance' | 'activity' | 'train' | 'bus' | 'transfer' | 'ferry' | 'other';
export type DocumentType = ReservationType | 'passport' | 'visa' | 'vaccine' | 'other';
export type DocumentStatus = 'confirmed' | 'pending' | 'printed' | 'expiring' | 'cancelled';

export interface TripDocument {
  id: string;
  type: DocumentType;
  title: string;
  subtitle?: string; // e.g., "GRU → ATH"
  date?: string; // Relevant date (departure, check-in, etc.)
  expiryDate?: string; // For passports/visas
  reference?: string; // Locator/Booking Ref
  status: DocumentStatus;
  travelers: string[]; // IDs of travelers
  fileUrl?: string; // For opening the PDF/Image
  actions?: {
    checkInUrl?: string;
    mapUrl?: string;
    contactPhone?: string;
  };
  isOfflineAvailable?: boolean;
  isPrinted?: boolean;
  // Additional fields for specific types
  details?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  model?: string;
  // Reservation linking fields
  linkedAccommodationId?: string; // Links to HotelReservation
  linkedTransportId?: string; // Links to Transport
}
export type ExpenseCategory = 'alimentacao' | 'transporte' | 'hospedagem' | 'lazer' | 'compras' | 'outros';
export type ExpenseFilter = 'todas' | 'entradas' | 'saidas';

export interface Expense {
  id: string;
  title: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  type: 'entrada' | 'saida';
  date: string;
  paymentMethod: string;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  role?: string;
  initials?: string;
}

export interface DetailedDestination {
  id: string;
  name: string;
  country?: string;
  placeId?: string;
  startDate?: string;
  endDate?: string;
  image?: string;
}

export interface YouTubeVideo {
  id: string; // The YouTube Video ID
  url: string; // The full URL
  title: string;
  thumbnail: string;
  addedAt: string;
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  isCritical?: boolean;
  deadline?: string;
  category?: 'visa' | 'booking' | 'health' | 'insurance' | 'packing' | 'other';
}

export interface LuggageItem {
  id: string;
  text: string;
  packed: boolean;
  category: 'documents' | 'clothes' | 'hygiene' | 'electronics' | 'other';
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  detailedDestinations?: DetailedDestination[];
  startDate: string;
  endDate: string;
  isFlexibleDates?: boolean;
  status: TripStatus;
  coverImage: string;
  participants: Participant[];
  videos?: YouTubeVideo[];
  tasks?: TaskItem[];
  luggage?: LuggageItem[];
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  bookingReference: string;
  departure: string;
  arrival: string;
  departureAirport: string;
  arrivalAirport: string;
}

export interface HotelReservation {
  id: string;
  name: string;
  address: string;
  image: string;
  rating: number;
  nights: number;
  checkIn: string;
  checkInTime?: string;
  checkOut: string;
  checkOutTime?: string;
  confirmation: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  stars?: number;
  type?: 'hotel' | 'home'; // Distinguish between Hotel and Rental Home/Apartment
  cityId?: string; // Link to specific city
  documentId?: string; // Link to source document
}

export interface CarRental {
  id: string;
  company: string;
  model?: string;
  pickupLocation: string;
  dropoffLocation: string;
  startDate: string;
  endDate: string;
  confirmation: string;
  documentId?: string; // Link to source document
}

export type TransportType = 'flight' | 'train' | 'car' | 'transfer' | 'bus' | 'ferry';
export type TransportStatus = 'confirmed' | 'scheduled' | 'booked' | 'pending' | 'cancelled';

export interface Transport {
  id: string;
  type: TransportType;
  operator: string; // Airline, train company, rental company, etc.
  reference: string; // Flight number, train number, booking ref
  route?: string; // e.g., "HND → NRT" or "Tokyo → Kyoto"
  departureLocation: string;
  departureCity?: string;
  departureTime: string;
  departureDate: string;
  arrivalLocation: string;
  arrivalCity?: string;
  arrivalTime: string;
  arrivalDate: string;
  duration?: string;
  class?: string; // Business, Economy, First, Green Car, etc.
  seat?: string;
  vehicle?: string; // For car rentals: model
  confirmation: string;
  status: TransportStatus;
  documentId?: string; // Link to source document
}

// =============================================================================
// Flight Status Types (Real-time Tracking)
// =============================================================================

export type FlightStatusCode =
  | 'scheduled'    // Programado
  | 'active'       // Em voo
  | 'landed'       // Pousou
  | 'cancelled'    // Cancelado
  | 'diverted'     // Desviado
  | 'delayed'      // Atrasado
  | 'unknown';

export interface FlightLiveStatus {
  flightNumber: string;
  status: FlightStatusCode;

  // Departure Info
  departureAirport: string;
  departureTerminal?: string;
  departureGate?: string;
  scheduledDeparture: string;    // ISO datetime
  estimatedDeparture?: string;   // ISO datetime (if delayed)
  actualDeparture?: string;      // ISO datetime

  // Arrival Info
  arrivalAirport: string;
  arrivalTerminal?: string;
  arrivalGate?: string;
  arrivalBaggage?: string;
  scheduledArrival: string;
  estimatedArrival?: string;
  actualArrival?: string;

  // Delay Info
  departureDelay?: number;       // minutes
  arrivalDelay?: number;         // minutes

  // Aircraft Info
  aircraftType?: string;
  aircraftRegistration?: string;

  // Meta
  lastUpdated: string;
}

export interface FlightStatusChange {
  transportId: string;
  previousStatus: FlightStatusCode;
  newStatus: FlightStatusCode;
  changeType: 'delay' | 'gate_change' | 'cancellation' | 'diversion' | 'status_update';
  details: string;
  timestamp: string;
}

export interface Insurance {
  id: string;
  provider: string;
  policyNumber: string;
  startDate: string;
  endDate: string;
  contactPhone: string;
}

export interface ActivityTicket {
  id: string;
  name: string;
  location: string;
  date: string;
  time: string;
  reference: string;
}

export type JournalMood = 'amazing' | 'tired' | 'hungry' | 'cold' | 'excited' | 'relaxed';

export interface JournalWeather {
  temp: number;
  condition: string;
  icon: string;
}

export interface JournalEntry {
  id: string;
  author: Participant;
  timestamp: string;
  date: string; // YYYY-MM-DD for grouping by day
  dayNumber?: number; // Day 1, Day 2, etc.
  location: string;
  locationCoords?: { lat: number; lng: number };
  title?: string;
  content: string;
  images: string[];
  mood?: JournalMood;
  weather?: JournalWeather;
  tags: string[];
  likes: number;
  comments: number;
  expenseId?: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

// Activity and Itinerary types
export interface Activity {
  id: string;
  day: number;
  time: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  iconBg: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  date: string;
  city?: string;
  activities: {
    time: string;
    activity: string;
    description: string;
    type: 'culture' | 'food' | 'rest' | 'transport';
  }[];
}

// Itinerary Activity types for the new itinerary page
export type ItineraryActivityType = 'transport' | 'accommodation' | 'meal' | 'sightseeing' | 'culture' | 'food' | 'nature' | 'shopping' | 'nightlife' | 'other';

export interface ItineraryActivity {
  id: string;
  day: number;
  date: string;
  time: string;
  title: string;
  location?: string;
  locationDetail?: string;
  type: ItineraryActivityType;
  completed: boolean;
  notes?: string;
  price?: string;
  image?: string;
  isGeneratingImage?: boolean;
  duration?: number; // Duration in minutes
}

// Country and Cost of Living Information
export interface CountryInfo {
  currency: { code: string; symbol: string; name: string };
  language: string;
  timezone: string;
  plugType: string;
  visaRequired: boolean;
  emergencyNumber: string;
  drivingSide: 'left' | 'right';
}

export interface CostOfLiving {
  restaurant: number; // Average meal cost in USD
  transport: number;  // Day pass cost
  hotel: number;      // Average hotel night
  overall: number;    // Index compared to Brazil (100 = same)
}

// City and Guide types
export interface City {
  id: string;
  name: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  headline: string;
  image: string;
  editorialContent?: string;
  attractionsCount?: number;
  restaurantsCount?: number;
  countryInfo?: CountryInfo;
  costOfLiving?: CostOfLiving;
}

export interface Attraction {
  name: string;
  description: string;
  image: string;
  aiImage?: string;
  category: string;
  longDescription?: string;
  reviewSummary?: string;
  isGenerating?: boolean;
  rating?: number;
  time?: string;
  type?: string;
  price?: string;
  address?: string;
  openingHours?: string;
  city?: string;
}

export interface TypicalDish {
  name: string;
  description: string;
  image: string;
  aiImage?: string;
  isGenerating?: boolean;
}

export interface Restaurant {
  id?: string;
  name: string;
  city?: string;
  category: string;
  description: string;
  price?: string;
  rating?: number;
  image?: string;
  images?: string[];
  address?: string;
  hours?: {
    open: string;
    close: string;
    text?: string;
  };
  isOpen?: boolean;
  reviews?: {
    author: string;
    rating: number;
    text: string;
    date: string;
    avatar?: string;
  }[];
  specialty?: string;
  highlight?: string;
  reviewSummary?: string;
}


export interface Tip {
  title: string;
  description: string;
  category: string;
}

export interface GastronomyPlace {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  rating: number;
  image: string;
  address: string;
  hours?: { open: string; close: string; text?: string };
  isOpen?: boolean;
  specialty?: string;
  highlight?: string;
}

export interface CityGuide {
  overview: string;
  attractions: Attraction[];
  typicalDishes: TypicalDish[];
  gastronomy: GastronomyPlace[];
  tips: Tip[];
  essentials?: {
    icon: string;
    title: string;
    description: string;
  }[];
  emergency?: {
    police: string;
    ambulance: string;
    embassy?: {
      label: string;
      phone: string;
      address: string;
    };
  };
}

// Grounding types for Google Maps integration
export interface GroundingInfo {
  text: string;
  links: GroundingLink[];
}

export interface GroundingLink {
  web?: {
    uri: string;
    title?: string;
  };
}

// Image generation types
export interface ImageGenerationOptions {
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  imageSize?: '1K' | '2K' | '4K';
}

// =============================================================================
// AI Assistant Types
// =============================================================================

export type TravelBudget = 'economic' | 'balanced' | 'luxury';
export type TravelRhythm = 'relaxed' | 'moderate' | 'intense';
export type TravelCompany = 'solo' | 'couple' | 'family' | 'friends';
export type TravelInterest = 'history' | 'food' | 'nature' | 'shopping' | 'nightlife' | 'art' | 'adventure';

export interface TravelPreferences {
  budget: TravelBudget;
  rhythm: TravelRhythm;
  company: TravelCompany;
  interests: TravelInterest[];
}

export interface AIItineraryActivity {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'culture' | 'food' | 'rest' | 'transport' | 'nature' | 'shopping' | 'nightlife';
  location?: string;
  coordinates?: { lat: number; lng: number };
  reasoning?: string;
  estimatedCost?: string;
  duration?: string;
  image?: string;
}

export interface AIItineraryDay {
  day: number;
  title: string;
  date: string;
  summary?: string;
  activities: AIItineraryActivity[];
  totalCost?: string;
}

export interface AIGeneratedPlan {
  destination: string;
  days: AIItineraryDay[];
  preferences: TravelPreferences;
  weatherSummary?: string;
  totalEstimatedCost?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// =============================================================================
// AI Assistant V2 Types (Enhanced Planning)
// =============================================================================

// --- Timing / When ---
export type TravelTimingType = 'exact' | 'month' | 'flexible';
export type SeasonPreference = 'summer' | 'winter' | 'shoulder' | 'no_rain' | 'any';

export interface TravelTimingExact {
  type: 'exact';
  startDate: string; // ISO date
  endDate: string;
}

export interface TravelTimingMonth {
  type: 'month';
  month: number; // 1-12
  year: number;
  duration: number; // days
}

export interface TravelTimingFlexible {
  type: 'flexible';
  earliestDate?: string;
  latestDate?: string;
  duration: number;
  seasonPreference?: SeasonPreference;
}

export type TravelTiming = TravelTimingExact | TravelTimingMonth | TravelTimingFlexible;

// --- Social / Who ---
export type TravelerAgeGroup = 'infant' | 'child' | 'teen' | 'adult' | 'senior';

export interface TravelerProfile {
  id: string;
  name?: string;
  ageGroup: TravelerAgeGroup;
  age?: number; // Specific age for children
  dietaryRestrictions?: string[];
  mobilityRestrictions?: string[];
  interests?: TravelInterest[];
}

export interface TravelParty {
  type: TravelCompany;
  size: number;
  travelers: TravelerProfile[];
}

// --- Budget / How Much ---
export interface BudgetBreakdown {
  total: number;
  accommodation?: number;
  food?: number;
  transport?: number;
  activities?: number;
  shopping?: number;
  emergency?: number;
  // Currency fields for dual-currency support
  currency?: string;              // "BRL" or destination currency
  totalInBRL?: number;            // Value converted to BRL
  totalInDestination?: number;    // Value converted to destination currency
  exchangeRate?: number;          // Rate used in conversion
  exchangeRateDate?: string;      // Date of the rate
}

export interface CurrencyInfo {
  code: string; // e.g., "EUR", "JPY"
  symbol: string; // e.g., "€", "¥"
  rateToBRL?: number;      // Real-time rate
  lastUpdated?: string;    // Timestamp of the rate
}

// =============================================================================
// Currency Exchange Types
// =============================================================================

export interface ExchangeRate {
  from: string;           // "BRL"
  to: string;             // "EUR"
  rate: number;           // 0.18 (1 BRL = 0.18 EUR)
  inverseRate: number;    // 5.56 (1 EUR = 5.56 BRL)
  lastUpdated: string;    // ISO datetime
}

export interface CurrencyConversion {
  amount: number;
  from: string;
  to: string;
  result: number;
  rate: number;
  formattedResult: string;  // "€ 180,00"
}

export interface DestinationCurrency {
  code: string;           // "EUR"
  symbol: string;         // "€"
  name: string;           // "Euro"
  flag: string;           // "🇪🇺"
  rateToBRL: number;      // 5.56
  rateFromBRL: number;    // 0.18
  lastUpdated: string;
}

// --- Accommodation / Where to Stay ---
export type AccommodationType = 'hotel' | 'hostel' | 'resort' | 'apartment' | 'airbnb' | 'friends_house';
export type AccommodationVibe = 'romantic' | 'business' | 'party' | 'family_friendly' | 'quiet';

export interface AccommodationPreference {
  types: AccommodationType[];
  maxPricePerNight?: number;
  minRating?: number; // 1-5
  vibe?: AccommodationVibe;
  requiredAmenities?: string[]; // e.g., "pool", "wifi", "breakfast"
}

// --- Transport / How ---
export type TransportPreference = 'public_transport' | 'rent_car' | 'rideshare' | 'private_driver' | 'walking';
export type FlightPreference = 'direct_only' | 'cheapest' | 'best_value' | 'shortest';

export interface TransportPreferences {
  localMobility: TransportPreference[];
  flightPriority?: FlightPreference;
  trainPreferred?: boolean;
}

// --- Preparation / What to Prepare ---
export type TaskCategory = 'documentation' | 'health' | 'reservations' | 'packing' | 'financial' | 'tech';
export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface PreparationTask {
  id: string;
  title: string;
  description?: string;
  deadline?: string; // ISO date
  status: TaskStatus;
  category: TaskCategory;
  isAutoGenerated: boolean;
  priority: 'low' | 'medium' | 'high';
}

// --- Connectivity / Communication ---
export type ConnectivityType = 'esim' | 'local_sim' | 'roaming' | 'wifi_only';

export interface ConnectivityAdvice {
  recommendedType: ConnectivityType;
  estimatedCost?: string;
  providers?: string[];
  notes?: string;
}

export interface AppSuggestion {
  name: string;
  category: 'transport' | 'maps' | 'translation' | 'payment' | 'communication' | 'utility';
  reason: string;
  iosLink?: string;
  androidLink?: string;
  isOfflineCapable?: boolean;
}

// --- Destination Metadata (Auto-enriched) ---
export interface DestinationMetadata {
  name: string;
  country: string;
  timezone: string;
  currency: CurrencyInfo;
  language: string;
  voltage?: string; // e.g., "220V"
  plugType?: string; // e.g., "Type C"
  visaRequired?: boolean;
  visaNotes?: string;
  emergencyNumbers?: { police?: string; ambulance?: string; fire?: string };
  travelAdvisory?: string;
}

// --- Activity V2 (Enhanced) ---
export type ActivityPriority = 'essential' | 'desirable' | 'optional';

export interface AIItineraryActivityV2 extends AIItineraryActivity {
  priority?: ActivityPriority;
  travelTimeFromPrevious?: string; // e.g., "15 min walk"
  approximateCost?: number; // Numeric for calculations
  bookingRequired?: boolean;
  bookingUrl?: string;
  ageRestriction?: string;
  accessibilityNotes?: string;
}

export interface AIItineraryDayV2 {
  day: number;
  title: string;
  date: string;
  city?: string;
  summary?: string;
  activities: AIItineraryActivityV2[];
  totalCost?: number;
  totalActivityTime?: string;
  weatherForecast?: string;
}

// --- Full V2 Generated Plan ---
export interface AIGeneratedPlanV2 {
  id: string;
  createdAt: string;

  // Input Echo
  destinations: string[];
  timing: TravelTiming;
  party: TravelParty;
  budgetInput: BudgetBreakdown;
  accommodationPrefs?: AccommodationPreference;
  transportPrefs?: TransportPreferences;
  interests: TravelInterest[];

  // Generated Content
  days: AIItineraryDayV2[];

  // Enriched Metadata
  destinationMetadata: DestinationMetadata[];

  // Financial Summary
  estimatedBudget: BudgetBreakdown;
  totalEstimatedCost: number;
  costPerDay?: number;

  // Logistics
  weatherSummary: string;
  purchaseAdvice?: string; // e.g., "Book flights now, prices are rising"
  seasonalityStatus?: 'high' | 'low' | 'shoulder';
  eventAlerts?: string[]; // e.g., "Golden Week starts during your trip"

  // Preparation
  preparationTasks: PreparationTask[];

  // Connectivity
  connectivityAdvice?: ConnectivityAdvice;
  suggestedApps?: AppSuggestion[];
}

// --- V2 Travel Preferences (Extended) ---
export interface TravelPreferencesV2 {
  timing: TravelTiming;
  party: TravelParty;
  budget: BudgetBreakdown;
  rhythm: TravelRhythm;
  interests: TravelInterest[];
  accommodation?: AccommodationPreference;
  transport?: TransportPreferences;
}

// =============================================================================
// Calendar Event Types
// =============================================================================

export type CalendarEventType =
  | 'trip'
  | 'holiday' // Brazilian holidays
  | 'transport' // Added Generic transport
  | 'flight'
  | 'train'
  | 'bus'
  | 'ferry'
  | 'transfer'
  | 'accommodation'
  | 'meal'
  | 'restaurant'
  | 'sightseeing'
  | 'culture'
  | 'attraction'
  | 'nature'
  | 'shopping'
  | 'nightlife'
  | 'activity'
  | 'task'
  | 'reminder'
  | 'other';

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  pattern: RecurrencePattern;
  interval: number; // Every X days/weeks/months/years
  endDate?: string; // When recurrence stops
  occurrences?: number; // Or stop after N occurrences
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // DD/MM/YYYY or YYYY-MM-DD
  endDate?: string; // For multi-day events
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  allDay: boolean;
  type: CalendarEventType;
  tripId?: string; // Link to specific trip
  activityId?: string; // Link to itinerary activity
  transportId?: string; // Link to transport
  accommodationId?: string; // Link to accommodation
  documentId?: string; // Link to source document
  color?: string; // Custom color for this event
  location?: string;
  locationDetail?: string;
  reminder?: number; // Minutes before event
  recurrence?: RecurrenceRule;
  completed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarFilter {
  status?: 'all' | 'confirmed' | 'planning' | 'completed';
  type?: CalendarEventType | 'all';
  tripId?: string | 'all';
  searchQuery?: string;
}

export type CalendarViewMode = 'day' | 'week' | 'month' | 'year';

// =============================================================================
// Document Analysis & Feedback Types
// =============================================================================

export interface FieldWithConfidence<T> {
  value: T;
  confidence: number;
}

export interface DocumentAnalysisResult {
  type: 'flight' | 'hotel' | 'car' | 'activity' | 'insurance' | 'passport' | 'visa' | 'other';
  typeConfidence?: number;

  // Legacy fields for backward compatibility
  name?: string;
  date?: string;
  endDate?: string;
  reference?: string;
  departureTime?: string;
  arrivalTime?: string;
  details?: string;
  address?: string;
  stars?: number;
  rating?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  model?: string;

  // Richer data structure
  fields?: Record<string, FieldWithConfidence<string | number | boolean>>;
  warnings?: string[];
  overallConfidence?: number;

  // Metadata for batch processing
  fileName?: string;
  originalFile?: File;

  // Debug Info
  debugInfo?: DebugInfo;
}

export interface BatchAnalysisResult {
  successful: DocumentAnalysisResult[];
  failed: { file: File; error: string; fileName: string }[];
  duplicates: { file: File; duplicateOf: string; fileName: string }[];
}

export interface CorrectionFeedback {
  documentId?: string;
  originalValue: { field: string; value: any }[];
  correctedValue: { field: string; value: any }[];
  documentType: string;
  imageHash?: string;
  timestamp: string;
}

export interface DebugInfo {
  prompt: string;
  rawResponse: string;
  imageHash?: string;
  model: string;
}

export interface TripContext {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: Participant[];
  interests?: string[];
}

export interface PlanningGap {
  type: 'accommodation' | 'transport';
  severity: 'critical' | 'warning';
  description: string;
  date?: string;
}

export interface EnhancedTripContext extends TripContext {
  cities?: DetailedDestination[];
  flights?: Transport[];
  hotels?: HotelReservation[];
  activities?: ItineraryActivity[];
  existingTasks?: string[];
  tripType?: string;
  planningGaps?: PlanningGap[];
}

export interface ChecklistInsight {
  id: string;
  type: 'weather' | 'event' | 'logistics' | 'local_tip';
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ChecklistTask {
  id: string;
  title: string;
  category: 'preparation' | 'packing' | 'documents' | 'health';
  reason: string;
  isUrgent: boolean;
}

export interface ChecklistAnalysisResult {
  insights: ChecklistInsight[];
  suggestedTasks: ChecklistTask[];
}

// =============================================================================
// Trip Viability Analysis Types (Imagine Trips Feature)
// =============================================================================

export type ViabilityLevel = 'recommended' | 'acceptable' | 'not_recommended';

export interface TravelPeriod {
  type: 'exact' | 'estimated';
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: number;
}

export interface TripViabilityAnalysis {
  viability: ViabilityLevel;
  summary: string;
  pros: string[];
  cons: string[];
  climate: {
    description: string;
    avgTemp: string;
  };
  events: string[];
  tips: string[];
}

