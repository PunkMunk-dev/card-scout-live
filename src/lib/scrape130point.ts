import { supabase } from '@/integrations/supabase/client';

interface CacheEntry {
  markdown: string;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

function normalizeKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function scrape130point(query: string): Promise<{ success: boolean; markdown: string; error?: string }> {
  const key = normalizeKey(query);

  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return { success: true, markdown: cached.markdown };
  }

  const { data, error } = await supabase.functions.invoke('scrape-130point', {
    body: { query },
  });

  if (error) {
    return { success: false, markdown: '', error: error.message };
  }

  if (!data?.success) {
    return { success: false, markdown: '', error: data?.error || 'Scrape failed' };
  }

  const markdown = data.markdown || '';
  cache.set(key, { markdown, fetchedAt: Date.now() });
  return { success: true, markdown };
}
