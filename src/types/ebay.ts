export interface EbayItem {
  itemId: string;
  title: string;
  price: { value: string; currency: string };
  shipping?: { value: string; currency: string };
  condition: string;
  buyingOption: 'AUCTION' | 'FIXED_PRICE' | 'UNKNOWN';
  endDate?: string;
  imageUrl?: string;
  additionalImages?: string[];  // For multi-image grading (front + back)
  itemUrl?: string;
  seller?: string;
  // Extracted population data from listing title/description
  popData?: {
    psa10: number | null;
    total: number | null;
    gemRate: number | null;
    source: 'listing';
  };
}

export interface WatchlistItem extends EbayItem {
  addedAt: number;
}

export interface SearchResponse {
  query: string;
  page: number;
  limit: number;
  total: number;
  nextPage: number | null;
  items: EbayItem[];
}

export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
  sort?: SortOption;
  includeLots?: boolean;
  buyingOptions?: 'ALL' | 'AUCTION';
}

export type SortOption = 'best' | 'price_asc' | 'end_soonest' | 'graded' | 'raw';
export type BuyingOption = 'ALL' | 'AUCTION';
