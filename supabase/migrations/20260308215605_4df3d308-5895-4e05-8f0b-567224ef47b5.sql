
-- Create psa_cert_cache table
CREATE TABLE public.psa_cert_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_number text UNIQUE NOT NULL,
  card_identity_key text,
  grade text,
  player_name text,
  year text,
  set_name text,
  card_number text,
  image_url text,
  raw_response_json jsonb,
  last_verified_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.psa_cert_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read psa_cert_cache" ON public.psa_cert_cache
  FOR SELECT TO anon, authenticated USING (true);

-- Create psa_population_mapping table
CREATE TABLE public.psa_population_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_identity_key text NOT NULL UNIQUE,
  psa_set_name text,
  psa_subject text,
  psa_card_number text,
  psa_population_source text DEFAULT 'manual',
  mapping_confidence text DEFAULT 'unverified',
  is_admin_verified boolean DEFAULT false,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.psa_population_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read psa_population_mapping" ON public.psa_population_mapping
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage psa_population_mapping" ON public.psa_population_mapping
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
