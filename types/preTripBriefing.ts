export interface QuickFact {
    label: string;
    value: string;
    subValue?: string;
    icon: string; // Material Symbol name
    actionLabel?: string;
    actionUrl?: string; // or handler ID
    variant?: 'default' | 'highlight';
}

export interface DifferenceItem {
    term: string; // e.g. "Pequeno almoço"
    description: string; // e.g. "Café da manhã"
}

export interface DifferenceCategory {
    id: string;
    title: string;
    icon: string;
    items: (string | DifferenceItem)[]; // Supports mixed strings and key-value pairs
}

export interface CultureRule {
    text: string;
}

export interface CultureSection {
    dos: CultureRule[];
    donts: CultureRule[];
    greetings: {
        context: string;
        description: string;
    }[];
}

export interface EntryRequirementDocument {
    name: string;
    required: boolean; // false = recommended/optional/conditionally required
    note?: string;
}

export interface EntryRequirements {
    visaPolicy: {
        title: string;
        description: string;
        isVisaFree: boolean;
    };
    documents: EntryRequirementDocument[];
    vaccines: {
        mandatory: string[];
        recommended: string[];
    };
}

export interface CostReference {
    item: string;
    priceEuro: string;
    priceReal: string;
}

export interface ExchangeRate {
    currencyCode: string; // 'EUR'
    currencyName: string; // 'Euro'
    rate: number; // 5.42
    lastUpdated: string; // ISO date or "2 hours ago"
}

export interface MoneyCosts {
    exchangeRate: ExchangeRate;
    dailyBudget: {
        economic: string;
        moderate: string;
        comfortable: string;
    };
    referencePrices: CostReference[];
    paymentMethods: {
        method: string;
        accepted: boolean;
        note?: string;
    }[];
    tips: string; // Summary text for tips
}

export interface EmergencyPhone {
    label: string;
    number: string;
}

export interface EmergencySafety {
    numbers: EmergencyPhone[];
    safetyLevel: {
        status: 'safe' | 'caution' | 'danger'; // 🟢 🟡 🔴
        label: string;
        description: string;
    };
    precautions: string[];
    health: {
        system: string;
        insurancePolicy?: string; // User specific
        pharmacies: string;
    };
}

export interface UsefulPhrase {
    original: string; // pt-PT
    meaning?: string; // pt-BR equivalent or explanation
    pronunciation?: string; // Optional audio URL or phonetic
}

export interface PhraseCategory {
    category: string;
    phrases: UsefulPhrase[];
}

export interface RecommendedApp {
    name: string;
    category: string;
    description: string;
    icon?: string;
    iosUrl?: string;
    androidUrl?: string;
}

export interface WeatherDay {
    date: string; // '2026-02-15'
    dayOfWeek: string; // 'Sáb'
    conditionIcon: string; // '☀️'
    maxTemp: number;
    minTemp: number;
    rainProb: number;
}

export interface WeatherInfo {
    summary: string; // "Fevereiro é chuvoso..."
    forecast: WeatherDay[];
    packingList: string[];
}

export interface PreTripBriefingData {
    destination: string;
    tripDuration: string;
    season: string; // "Inverno"
    hookMessage: string; // "Portugal é familiar..."
    quickFacts: QuickFact[];
    differences: DifferenceCategory[];
    culture: CultureSection;
    entry: EntryRequirements;
    money: MoneyCosts;
    safety: EmergencySafety;
    phrases: PhraseCategory[];
    apps: RecommendedApp[];
    weather: WeatherInfo;
}
