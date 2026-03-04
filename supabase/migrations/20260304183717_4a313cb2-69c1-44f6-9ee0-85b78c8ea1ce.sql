
CREATE TABLE public.roi_live_auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roi_card_id uuid NOT NULL REFERENCES public.roi_cards(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  listing_url text NOT NULL,
  current_bid numeric,
  shipping numeric,
  end_time timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_roi_live_auctions_last_seen ON public.roi_live_auctions (last_seen_at);
CREATE INDEX idx_roi_live_auctions_roi_card_id ON public.roi_live_auctions (roi_card_id);

ALTER TABLE public.roi_live_auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read roi_live_auctions"
  ON public.roi_live_auctions
  FOR SELECT
  USING (true);
