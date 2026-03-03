
-- Add new columns to roi_ebay_cache for improved caching
ALTER TABLE public.roi_ebay_cache
  ADD COLUMN IF NOT EXISTS query_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS query_hash text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS query_version int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS refreshing_until timestamptz NULL;

-- Add unique constraint on query_hash (new canonical cache key)
ALTER TABLE public.roi_ebay_cache
  ADD CONSTRAINT roi_ebay_cache_query_hash_key UNIQUE (query_hash);

-- Add index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_roi_ebay_cache_expires_at ON public.roi_ebay_cache (expires_at);
