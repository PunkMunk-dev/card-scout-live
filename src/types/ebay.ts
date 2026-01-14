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
  // Sold item fields
  isSold?: boolean;
  soldPrice?: { value: string; currency: string };
  soldDate?: string;
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

export interface SoldSearchResponse {
  query: string;
  total: number;
  items: EbayItem[];
  averagePrice?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
  sort?: 'best' | 'price_asc' | 'end_soonest' | 'newly_listed';
  includeLots?: boolean;
  buyingOptions?: 'ALL' | 'AUCTION' | 'FIXED_PRICE';
  showSold?: boolean;
}

export type SortOption = 'best' | 'price_asc' | 'end_soonest' | 'newly_listed';
export type BuyingOption = 'ALL' | 'AUCTION' | 'FIXED_PRICE';
