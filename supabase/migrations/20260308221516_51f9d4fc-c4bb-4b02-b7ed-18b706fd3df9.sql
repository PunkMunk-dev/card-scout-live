
-- 1. Add new columns to psa_population_mapping
ALTER TABLE public.psa_population_mapping
  ADD COLUMN IF NOT EXISTS psa_search_query text,
  ADD COLUMN IF NOT EXISTS psa_population_url text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Add new columns to psa_population
ALTER TABLE public.psa_population
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_label text,
  ADD COLUMN IF NOT EXISTS source_last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 3. Add psa10_population and pop_last_synced_at to card_market_metrics
ALTER TABLE public.card_market_metrics
  ADD COLUMN IF NOT EXISTS psa10_population integer,
  ADD COLUMN IF NOT EXISTS pop_last_synced_at timestamptz;

-- 4. Create psa_sync_runs table
CREATE TABLE IF NOT EXISTS public.psa_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  source_type text,
  records_seen integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  error_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.psa_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read psa_sync_runs" ON public.psa_sync_runs
  FOR SELECT TO authenticated, anon USING (true);

-- 5. Add updated_at trigger for psa_population_mapping
CREATE TRIGGER set_psa_population_mapping_updated_at
  BEFORE UPDATE ON public.psa_population_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 6. Add updated_at trigger for psa_population
CREATE TRIGGER set_psa_population_updated_at
  BEFORE UPDATE ON public.psa_population
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
