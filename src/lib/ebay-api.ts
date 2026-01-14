import { supabase } from "@/integrations/supabase/client";
import type { SearchParams, SearchResponse, SoldSearchResponse } from "@/types/ebay";

export async function searchEbay(params: SearchParams): Promise<SearchResponse> {
  const { data, error } = await supabase.functions.invoke('ebay-search', {
    body: params,
  });

  if (error) {
    throw new Error(error.message || 'Failed to search eBay');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as SearchResponse;
}

export async function searchEbaySold(params: SearchParams): Promise<SoldSearchResponse> {
  const { data, error } = await supabase.functions.invoke('ebay-sold-search', {
    body: params,
  });

  if (error) {
    throw new Error(error.message || 'Failed to search sold listings');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as SoldSearchResponse;
}
