
-- Cards Normalized table
CREATE TABLE public.cards_normalized (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_identity_key text UNIQUE NOT NULL,
  sport text NOT NULL,
  category text,
  player_name text,
  character_name text,
  year text,
  brand text,
  set_name text,
  subset text,
  card_number text,
  parallel text,
  variation text,
  rookie_flag boolean NOT NULL DEFAULT false,
  autograph_flag boolean NOT NULL DEFAULT false,
  memorabilia_flag boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cards_normalized_key ON public.cards_normalized(card_identity_key);
CREATE INDEX idx_cards_normalized_player ON public.cards_normalized(player_name);
CREATE INDEX idx_cards_normalized_sport ON public.cards_normalized(sport);

ALTER TABLE public.cards_normalized ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cards_normalized" ON public.cards_normalized FOR SELECT USING (true);

-- Sales History table
CREATE TABLE public.sales_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_identity_key text NOT NULL REFERENCES public.cards_normalized(card_identity_key) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'ebay',
  source_sale_id text,
  title text,
  url text,
  image_url text,
  sold_price numeric,
  shipping_price numeric DEFAULT 0,
  total_price numeric,
  sold_at timestamptz,
  raw_or_graded text NOT NULL DEFAULT 'raw',
  grader text,
  grade text,
  confidence_score text NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_history_key ON public.sales_history(card_identity_key);
CREATE INDEX idx_sales_history_sold_at ON public.sales_history(sold_at);
CREATE UNIQUE INDEX idx_sales_history_source_sale ON public.sales_history(source, source_sale_id) WHERE source_sale_id IS NOT NULL;

ALTER TABLE public.sales_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sales_history" ON public.sales_history FOR SELECT USING (true);

-- PSA Population table (for future use)
CREATE TABLE public.psa_population (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_identity_key text NOT NULL REFERENCES public.cards_normalized(card_identity_key) ON DELETE CASCADE,
  psa_set text,
  psa_subject text,
  psa_grade text,
  population_count integer DEFAULT 0,
  last_synced timestamptz
);

CREATE INDEX idx_psa_pop_key ON public.psa_population(card_identity_key);

ALTER TABLE public.psa_population ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read psa_population" ON public.psa_population FOR SELECT USING (true);

-- Card Market Metrics table
CREATE TABLE public.card_market_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_identity_key text UNIQUE NOT NULL REFERENCES public.cards_normalized(card_identity_key) ON DELETE CASCADE,
  raw_median_price numeric,
  raw_comp_count integer DEFAULT 0,
  psa10_median_price numeric,
  psa10_comp_count integer DEFAULT 0,
  spread_amount numeric,
  spread_percent numeric,
  population integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_card_metrics_key ON public.card_market_metrics(card_identity_key);

ALTER TABLE public.card_market_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read card_market_metrics" ON public.card_market_metrics FOR SELECT USING (true);

-- Trigger for updated_at on cards_normalized
CREATE TRIGGER set_cards_normalized_updated_at
  BEFORE UPDATE ON public.cards_normalized
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Trigger for updated_at on card_market_metrics
CREATE TRIGGER set_card_market_metrics_updated_at
  BEFORE UPDATE ON public.card_market_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
