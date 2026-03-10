
-- ebay_listing_cache table
CREATE TABLE public.ebay_listing_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebay_item_id text,
  title text NOT NULL,
  listing_url text,
  sold_price_usd numeric,
  sold_date timestamptz,
  image_url text,
  condition_text text,
  is_graded boolean DEFAULT false,
  grader text,
  grade_value text,
  listing_type text CHECK (listing_type IN ('raw','psa10')),
  game text DEFAULT 'onepiece',
  parsed_character text,
  parsed_card_number text,
  parsed_set_name text,
  parsed_rarity text,
  parsed_variant text,
  language_detected text,
  normalized_card_key text,
  parse_confidence text,
  junk_flag boolean DEFAULT false,
  outlier_flag boolean DEFAULT false,
  inserted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ebay_listing_cache_item_id ON public.ebay_listing_cache (ebay_item_id);
CREATE INDEX idx_ebay_listing_cache_card_key ON public.ebay_listing_cache (normalized_card_key);
CREATE INDEX idx_ebay_listing_cache_card_number ON public.ebay_listing_cache (parsed_card_number);
CREATE INDEX idx_ebay_listing_cache_sold_date ON public.ebay_listing_cache (sold_date);
CREATE INDEX idx_ebay_listing_cache_listing_type ON public.ebay_listing_cache (listing_type);

ALTER TABLE public.ebay_listing_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ebay_listing_cache"
  ON public.ebay_listing_cache FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read ebay_listing_cache"
  ON public.ebay_listing_cache FOR SELECT TO public
  USING (true);

-- onepiece_card_market table
CREATE TABLE public.onepiece_card_market (
  normalized_card_key text PRIMARY KEY,
  game text DEFAULT 'onepiece',
  character text,
  card_number text,
  set_name text,
  rarity text,
  variant text,
  language text,
  raw_avg_price_usd numeric,
  raw_median_price_usd numeric,
  raw_sale_count integer DEFAULT 0,
  raw_prices_usd text[],
  raw_sold_dates text[],
  raw_source_urls text[],
  psa10_avg_price_usd numeric,
  psa10_median_price_usd numeric,
  psa10_sale_count integer DEFAULT 0,
  psa10_prices_usd text[],
  psa10_sold_dates text[],
  psa10_source_urls text[],
  price_spread_usd numeric,
  multiple numeric,
  match_confidence text,
  notes text,
  last_updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_op_market_card_number ON public.onepiece_card_market (card_number);
CREATE INDEX idx_op_market_character ON public.onepiece_card_market (character);
CREATE INDEX idx_op_market_set_name ON public.onepiece_card_market (set_name);
CREATE INDEX idx_op_market_language ON public.onepiece_card_market (language);
CREATE INDEX idx_op_market_confidence ON public.onepiece_card_market (match_confidence);
CREATE INDEX idx_op_market_updated ON public.onepiece_card_market (last_updated_at);

ALTER TABLE public.onepiece_card_market ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage onepiece_card_market"
  ON public.onepiece_card_market FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read onepiece_card_market"
  ON public.onepiece_card_market FOR SELECT TO public
  USING (true);
