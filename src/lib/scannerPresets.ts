import type { ScannerFilters, ScannerSort, SavedScannerPreset } from '@/types/scanner';
import { DEFAULT_FILTERS } from '@/types/scanner';

interface PresetDef {
  id: string;
  name: string;
  query: string;
  filters: Partial<ScannerFilters>;
  sortBy: ScannerSort;
  group: 'tcg' | 'sports' | 'universal';
}

export const SCANNER_PRESETS: PresetDef[] = [
  // TCG
  { id: 'pokemon-raw', name: 'Pokémon Raw', query: 'Pokemon', group: 'tcg', sortBy: 'bestOpportunity', filters: { marketMode: 'tcg', rawOnly: true, excludeGraded: true } },
  { id: 'one-piece-raw', name: 'One Piece Raw', query: 'One Piece card', group: 'tcg', sortBy: 'bestOpportunity', filters: { marketMode: 'tcg', rawOnly: true, excludeGraded: true } },
  { id: 'pokemon-alt-arts', name: 'Pokémon Alt Arts', query: 'Pokemon alt art', group: 'tcg', sortBy: 'bestOpportunity', filters: { marketMode: 'tcg' } },
  { id: 'charizard', name: 'Charizard', query: 'Charizard', group: 'tcg', sortBy: 'bestOpportunity', filters: { marketMode: 'tcg' } },

  // Sports
  { id: 'nba-rookies', name: 'NBA Rookies', query: 'NBA rookie prizm', group: 'sports', sortBy: 'bestOpportunity', filters: { marketMode: 'sports', rawOnly: true, excludeGraded: true } },
  { id: 'nfl-qbs', name: 'NFL QBs', query: 'NFL quarterback prizm', group: 'sports', sortBy: 'bestOpportunity', filters: { marketMode: 'sports', rawOnly: true, excludeGraded: true } },
  { id: 'baseball-prospects', name: 'Baseball Prospects', query: 'baseball bowman 1st prospect', group: 'sports', sortBy: 'bestOpportunity', filters: { marketMode: 'sports' } },
  { id: 'soccer-stars', name: 'Soccer Stars', query: 'soccer topps chrome', group: 'sports', sortBy: 'bestOpportunity', filters: { marketMode: 'sports' } },

  // Universal
  { id: 'under-50', name: 'Under $50', query: '', group: 'universal', sortBy: 'bestOpportunity', filters: { maxPrice: 50 } },
  { id: 'under-100', name: 'Under $100', query: '', group: 'universal', sortBy: 'bestOpportunity', filters: { maxPrice: 100 } },
  { id: 'auctions-ending', name: 'Ending Soon', query: '', group: 'universal', sortBy: 'endingSoon', filters: { listingType: 'auction', endingSoonOnly: true } },
  { id: 'auction-only', name: 'Auction Only', query: '', group: 'universal', sortBy: 'endingSoon', filters: { listingType: 'auction' } },
  { id: 'bin-only', name: 'BIN Only', query: '', group: 'universal', sortBy: 'priceAsc', filters: { listingType: 'bin' } },
  { id: 'biggest-discount', name: 'Biggest Discount', query: '', group: 'universal', sortBy: 'biggestActiveDiscount', filters: {} },
];

export function buildPresetFilters(preset: PresetDef): ScannerFilters {
  return { ...DEFAULT_FILTERS, ...preset.filters };
}

// ─── Saved searches persistence ─────────────────────────
const SAVED_SEARCHES_KEY = 'omni_saved_searches_v1';

export function loadSavedSearches(): SavedScannerPreset[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function persistSavedSearches(searches: SavedScannerPreset[]) {
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
  } catch {}
}
