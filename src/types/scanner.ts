export type MarketMode = 'all' | 'tcg' | 'sports';
export type ListingType = 'all' | 'auction' | 'bin';
export type OpportunityStrength = 'strong' | 'good' | 'watch' | 'weak';
export type ClusterConfidence = 'high' | 'medium' | 'low';

export type ScannerSort =
  | 'bestOpportunity'
  | 'biggestActiveDiscount'
  | 'endingSoon'
  | 'newlyListed'
  | 'priceAsc'
  | 'priceDesc'
  | 'relevance';

export interface ScannerFilters {
  marketMode: MarketMode;
  listingType: ListingType;
  minPrice: number | null;
  maxPrice: number | null;
  endingSoonOnly: boolean;
  newlyListedOnly: boolean;
  rawOnly: boolean;
  excludeGraded: boolean;
  excludeLots: boolean;
  excludeReprints: boolean;
  excludeProxyCustom: boolean;
  excludeDamaged: boolean;
  excludedKeywords: string[];
}

export interface SavedScannerPreset {
  id: string;
  name: string;
  query: string;
  filters: Partial<ScannerFilters>;
  sortBy: ScannerSort;
  createdAt: string;
}

export interface NormalizedListing {
  id: string;
  title: string;
  cleanedTitle: string;
  normalizedLabel: string;
  imageUrl: string | null;
  ebayUrl: string | null;
  market: MarketMode;
  listingType: ListingType;
  price: number | null;
  shipping: number | null;
  totalCost: number | null;
  condition: string | null;
  sellerName: string | null;
  timeLeftLabel: string | null;
  endTime: string | null;
  tokenSignature: string[];
  isLikelyJunk: boolean;
  junkReasons: string[];
  activeClusterId: string | null;
  clusterMedian: number | null;
  clusterMin: number | null;
  clusterMax: number | null;
  clusterCount: number;
  activeDiscountPercent: number | null;
  opportunityScore: number;
  opportunityStrength: OpportunityStrength;
  clusterConfidence: ClusterConfidence;
}

export const DEFAULT_FILTERS: ScannerFilters = {
  marketMode: 'all',
  listingType: 'all',
  minPrice: null,
  maxPrice: null,
  endingSoonOnly: false,
  newlyListedOnly: false,
  rawOnly: false,
  excludeGraded: false,
  excludeLots: true,
  excludeReprints: true,
  excludeProxyCustom: true,
  excludeDamaged: true,
  excludedKeywords: [],
};

export type ScannerMode = 'scanner' | 'rawToPsa';

export interface ModeSlice {
  results: NormalizedListing[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  hasMore: boolean;
  currentPage: number;
}

export interface ScannerState {
  query: string;
  recentQueries: string[];
  sortBy: ScannerSort;
  filters: ScannerFilters;
  viewMode: ScannerMode;
  scanner: ModeSlice;
  rawToPsa: ModeSlice;
  selectedListingId: string | null;
  comparisonListingId: string | null;
  savedSearches: SavedScannerPreset[];
  sidebarOpen: boolean;
  drawerMode: 'details' | 'compare' | null;
}
