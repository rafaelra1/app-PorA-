/**
 * Category Icons Configuration
 *
 * Maps attraction/gastronomy categories to pre-uploaded 3D icons in Supabase Storage.
 *
 * Upload your icons to: Supabase Storage > Bucket: 'category-icons' (public)
 *
 * Expected structure:
 *   /adventure.png
 *   /relaxation.png
 *   /cultural.png
 *   /culinary.png
 *   /nature-wildlife.png
 *   /urban-exploration.png
 *   /water-sports.png
 *   /entertainment.png
 *   /wellness-spa.png
 *   /historical.png
 *   /nightlife.png
 *   /family-fun.png
 */

// Base URL for category icons in Supabase Storage
// Replace with your actual Supabase project URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ICONS_BUCKET = 'category-icons';
const ICONS_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${ICONS_BUCKET}`;

// Category icon definitions with patterns for matching
export interface CategoryIconConfig {
  id: string;
  name: string;
  iconUrl: string;
  patterns: RegExp;
  fallbackColor: string;
}

export const CATEGORY_ICONS: CategoryIconConfig[] = [
  {
    id: 'adventure',
    name: 'Adventure',
    iconUrl: `${ICONS_BASE_URL}/adventure.png`,
    patterns: /aventura|adventure|trilha|hiking|escalada|climb|rafting|bungee|paraglid|extreme/i,
    fallbackColor: 'orange'
  },
  {
    id: 'relaxation',
    name: 'Relaxation',
    iconUrl: `${ICONS_BASE_URL}/relaxation.png`,
    patterns: /relaxa|praia|beach|resort|pool|piscina|lounge|descanso/i,
    fallbackColor: 'cyan'
  },
  {
    id: 'cultural',
    name: 'Cultural',
    iconUrl: `${ICONS_BASE_URL}/cultural.png`,
    patterns: /museu|museum|galeria|gallery|art|arte|cultura|cultural|exposição|exhibit/i,
    fallbackColor: 'purple'
  },
  {
    id: 'culinary',
    name: 'Culinary',
    iconUrl: `${ICONS_BASE_URL}/culinary.png`,
    patterns: /restaurante|restaurant|comida|food|culinár|culinar|gastrono|chef|cozinha|kitchen/i,
    fallbackColor: 'red'
  },
  {
    id: 'nature-wildlife',
    name: 'Nature & Wildlife',
    iconUrl: `${ICONS_BASE_URL}/nature-wildlife.png`,
    patterns: /nature|natureza|parque|park|jardim|garden|floresta|forest|safari|zoo|animais|wildlife|fauna|flora/i,
    fallbackColor: 'emerald'
  },
  {
    id: 'urban-exploration',
    name: 'Urban Exploration',
    iconUrl: `${ICONS_BASE_URL}/urban-exploration.png`,
    patterns: /urban|cidade|city|downtown|centro|rua|street|praça|square|bairro|neighborhood|shop|compras|mercado|market/i,
    fallbackColor: 'slate'
  },
  {
    id: 'water-sports',
    name: 'Water Sports',
    iconUrl: `${ICONS_BASE_URL}/water-sports.png`,
    patterns: /surf|mergulh|dive|snorkel|kayak|canoagem|náutic|nautic|velej|sail|aqua|água|water sport/i,
    fallbackColor: 'blue'
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    iconUrl: `${ICONS_BASE_URL}/entertainment.png`,
    patterns: /teatro|theatre|theater|cinema|show|espetáculo|concert|music|música|comedy|comédia|circo|circus/i,
    fallbackColor: 'pink'
  },
  {
    id: 'wellness-spa',
    name: 'Wellness & Spa',
    iconUrl: `${ICONS_BASE_URL}/wellness-spa.png`,
    patterns: /spa|wellness|bem-estar|massag|termal|thermal|sauna|yoga|meditação|meditation|holistic/i,
    fallbackColor: 'teal'
  },
  {
    id: 'historical',
    name: 'Historical',
    iconUrl: `${ICONS_BASE_URL}/historical.png`,
    patterns: /históric|historic|antig|ancient|ruína|ruin|arqueol|archaeol|palácio|palace|castelo|castle|forte|fort|monument|monumento|memorial|igreja|church|catedral|cathedral|templo|temple/i,
    fallbackColor: 'amber'
  },
  {
    id: 'nightlife',
    name: 'Nightlife',
    iconUrl: `${ICONS_BASE_URL}/nightlife.png`,
    patterns: /noite|night|bar|pub|club|balada|disco|rooftop|cocktail|drink/i,
    fallbackColor: 'violet'
  },
  {
    id: 'family-fun',
    name: 'Family Fun',
    iconUrl: `${ICONS_BASE_URL}/family-fun.png`,
    patterns: /famíli|family|criança|kid|child|parque temático|theme park|amusement|diversão|playground|aquário|aquarium|zoológico/i,
    fallbackColor: 'rose'
  }
];

// Default icon for categories that don't match any pattern
export const DEFAULT_CATEGORY_ICON: CategoryIconConfig = {
  id: 'default',
  name: 'Attraction',
  iconUrl: `${ICONS_BASE_URL}/cultural.png`, // Fallback to cultural icon
  patterns: /.*/,
  fallbackColor: 'indigo'
};

/**
 * Get category icon config based on category string
 *
 * @param category - Category string to match
 * @returns CategoryIconConfig with icon URL and fallback color
 */
export function getCategoryIconConfig(category: string = ''): CategoryIconConfig {
  if (!category) {
    return DEFAULT_CATEGORY_ICON;
  }

  const matched = CATEGORY_ICONS.find(config => config.patterns.test(category));
  return matched || DEFAULT_CATEGORY_ICON;
}

/**
 * Get just the icon URL for a category
 *
 * @param category - Category string to match
 * @returns Icon URL string
 */
export function getCategoryIconUrl(category: string = ''): string {
  return getCategoryIconConfig(category).iconUrl;
}

/**
 * Check if category icons are properly configured
 * (Supabase URL is set)
 */
export function isCategoryIconsConfigured(): boolean {
  return Boolean(SUPABASE_URL);
}
