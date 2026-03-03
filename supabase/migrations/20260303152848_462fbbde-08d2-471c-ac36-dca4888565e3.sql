
-- ROI Cards table
CREATE TABLE public.roi_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL,
  card_name text NOT NULL,
  raw_avg numeric,
  psa9_avg numeric,
  psa9_gain numeric,
  multiplier numeric,
  psa10_avg numeric,
  psa10_profit numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.roi_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read roi_cards" ON public.roi_cards FOR SELECT USING (true);

-- Index for filtering by sport
CREATE INDEX idx_roi_cards_sport ON public.roi_cards(sport);
-- Index for sorting by profit
CREATE INDEX idx_roi_cards_psa10_profit ON public.roi_cards(psa10_profit DESC);

-- eBay listing cache table
CREATE TABLE public.roi_ebay_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_name text NOT NULL UNIQUE,
  listings jsonb NOT NULL DEFAULT '[]',
  fetched_at timestamptz DEFAULT now()
);

ALTER TABLE public.roi_ebay_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read roi_ebay_cache" ON public.roi_ebay_cache FOR SELECT USING (true);
