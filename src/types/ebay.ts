export interface EbayItem {
  itemId: string;
  title: string;
  price: { value: string; currency: string };
  shipping?: { value: string; currency: string };
  condition: string;
  buyingOption: 'AUCTION' | 'FIXED_PRICE' | 'UNKNOWN';
  endDate?: string;
  imageUrl?: string;
  itemUrl?: string;
  seller?: string;
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
