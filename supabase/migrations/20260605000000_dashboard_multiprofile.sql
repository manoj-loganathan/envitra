-- ============================================================
-- Migration: Envitra Dashboard — Multi-Profile Architecture
-- Date: 2026-06-05
-- ============================================================

-- ── New ENUMs ────────────────────────────────────────────────
CREATE TYPE profile_status AS ENUM ('active', 'inactive', 'draft');
CREATE TYPE link_category   AS ENUM ('social', 'payment', 'website', 'custom');
CREATE TYPE lead_status     AS ENUM ('new', 'contacted', 'following_up', 'converted', 'lost', 'spam');
CREATE TYPE feed_type       AS ENUM ('image', 'video', 'text', 'link');

-- ── Helper: auto-update updated_at ──────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 1. card_profiles ─────────────────────────────────────────
CREATE TABLE public.card_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id         UUID NOT NULL REFERENCES public.nfc_cards(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  profile_name    TEXT NOT NULL DEFAULT 'My Profile',
  display_name    TEXT NOT NULL DEFAULT '',
  title           TEXT,
  bio             TEXT,

  avatar_url      TEXT,
  bg_image_url    TEXT,

  status          profile_status NOT NULL DEFAULT 'draft',
  is_active       BOOLEAN NOT NULL DEFAULT false,
  sort_order      INT NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_profiles_card_id    ON public.card_profiles(card_id);
CREATE INDEX idx_card_profiles_account_id ON public.card_profiles(account_id);
-- Enforce: only ONE active profile per card at a time
CREATE UNIQUE INDEX idx_one_active_per_card ON public.card_profiles(card_id)
  WHERE is_active = true;

CREATE TRIGGER trg_card_profiles_updated_at
  BEFORE UPDATE ON public.card_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.card_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select own card profiles"
  ON public.card_profiles FOR SELECT USING (auth.uid() = account_id);
CREATE POLICY "Users can insert own card profiles"
  ON public.card_profiles FOR INSERT WITH CHECK (auth.uid() = account_id);
CREATE POLICY "Users can update own card profiles"
  ON public.card_profiles FOR UPDATE USING (auth.uid() = account_id);
CREATE POLICY "Users can delete own card profiles"
  ON public.card_profiles FOR DELETE USING (auth.uid() = account_id);
-- Public can read active profiles (for the tap page)
CREATE POLICY "Public can read active profiles"
  ON public.card_profiles FOR SELECT USING (is_active = true);

-- ── 2. vcard_details ─────────────────────────────────────────
CREATE TABLE public.vcard_details (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL UNIQUE REFERENCES public.card_profiles(id) ON DELETE CASCADE,

  first_name      TEXT,
  last_name       TEXT,
  organization    TEXT,
  job_title       TEXT,

  -- [{ "label": "Work", "number": "+91 98765 43210", "is_primary": true }]
  phones          JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{ "label": "Work", "email": "m@co.com", "is_primary": true }]
  emails          JSONB NOT NULL DEFAULT '[]'::jsonb,

  street          TEXT,
  city            TEXT,
  state           TEXT,
  postal_code     TEXT,
  country         TEXT DEFAULT 'India',
  website         TEXT,

  -- [{ "key": "LinkedIn", "value": "https://..." }]
  custom_fields   JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_vcard_updated_at
  BEFORE UPDATE ON public.vcard_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.vcard_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own vcard details"
  ON public.vcard_details FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = vcard_details.profile_id AND cp.account_id = auth.uid()
    )
  );
CREATE POLICY "Public can read vcard for active profiles"
  ON public.vcard_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = vcard_details.profile_id AND cp.is_active = true
    )
  );

-- ── 3. social_links ──────────────────────────────────────────
CREATE TABLE public.social_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.card_profiles(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  category        link_category NOT NULL DEFAULT 'social',
  platform        TEXT NOT NULL,
  label           TEXT,
  url             TEXT NOT NULL,
  icon_slug       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,
  click_count     INT NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_links_profile_id ON public.social_links(profile_id);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own social links"
  ON public.social_links FOR ALL USING (auth.uid() = account_id);
CREATE POLICY "Public can read active social links"
  ON public.social_links FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = social_links.profile_id AND cp.is_active = true
    )
  );

-- ── 4. lead_forms ────────────────────────────────────────────
CREATE TABLE public.lead_forms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL UNIQUE REFERENCES public.card_profiles(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  title           TEXT NOT NULL DEFAULT 'Get in Touch',
  subtitle        TEXT,
  button_label    TEXT NOT NULL DEFAULT 'Submit',
  is_active       BOOLEAN NOT NULL DEFAULT true,

  -- [{ "id":"uuid","type":"text|email|phone|select|textarea|checkbox",
  --    "label":"Company","placeholder":"...","required":true,"options":[] }]
  fields          JSONB NOT NULL DEFAULT '[]'::jsonb,

  capture_name    BOOLEAN NOT NULL DEFAULT true,
  capture_email   BOOLEAN NOT NULL DEFAULT true,
  capture_phone   BOOLEAN NOT NULL DEFAULT true,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_lead_forms_updated_at
  BEFORE UPDATE ON public.lead_forms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lead_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own lead forms"
  ON public.lead_forms FOR ALL USING (auth.uid() = account_id);
CREATE POLICY "Public can read active lead forms"
  ON public.lead_forms FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = lead_forms.profile_id AND cp.is_active = true
    )
  );

-- ── 5. card_taps (needed before lead_submissions FK) ─────────
CREATE TABLE public.card_taps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id         UUID NOT NULL REFERENCES public.nfc_cards(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES public.card_profiles(id) ON DELETE SET NULL,

  ip_address      INET,
  country         TEXT,
  region          TEXT,
  city            TEXT,
  latitude        NUMERIC(9,6),
  longitude       NUMERIC(9,6),

  user_agent      TEXT,
  device_type     TEXT,   -- 'mobile' | 'tablet' | 'desktop'
  os              TEXT,   -- 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Other'
  browser         TEXT,

  referrer        TEXT,

  tapped_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_taps_card_id    ON public.card_taps(card_id);
CREATE INDEX idx_card_taps_profile_id ON public.card_taps(profile_id);
CREATE INDEX idx_card_taps_tapped_at  ON public.card_taps(tapped_at DESC);

ALTER TABLE public.card_taps ENABLE ROW LEVEL SECURITY;
-- Users can read taps on their own cards
CREATE POLICY "Users can read own card taps"
  ON public.card_taps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.nfc_cards nc
      WHERE nc.id = card_taps.card_id AND nc.account_id = auth.uid()
    )
  );
-- Public (profile tap page) can insert tap events
CREATE POLICY "Public can insert tap events"
  ON public.card_taps FOR INSERT WITH CHECK (true);

-- ── Trigger: increment nfc_cards.tap_count on new tap ────────
CREATE OR REPLACE FUNCTION public.increment_tap_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.nfc_cards
  SET tap_count = tap_count + 1
  WHERE id = NEW.card_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_increment_tap_count
  AFTER INSERT ON public.card_taps
  FOR EACH ROW EXECUTE FUNCTION public.increment_tap_count();

-- ── 6. lead_submissions ──────────────────────────────────────
CREATE TABLE public.lead_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id         UUID NOT NULL REFERENCES public.lead_forms(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.card_profiles(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  lead_name       TEXT,
  lead_email      TEXT,
  lead_phone      TEXT,
  company         TEXT,

  data            JSONB NOT NULL DEFAULT '{}'::jsonb,

  status          lead_status NOT NULL DEFAULT 'new',
  notes           TEXT,

  tap_id          UUID REFERENCES public.card_taps(id) ON DELETE SET NULL,

  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_submissions_profile_id ON public.lead_submissions(profile_id);
CREATE INDEX idx_lead_submissions_form_id    ON public.lead_submissions(form_id);
CREATE INDEX idx_lead_submissions_account_id ON public.lead_submissions(account_id);

CREATE TRIGGER trg_lead_submissions_updated_at
  BEFORE UPDATE ON public.lead_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own lead submissions"
  ON public.lead_submissions FOR ALL USING (auth.uid() = account_id);
-- Public can insert (submit a lead form)
CREATE POLICY "Public can submit leads"
  ON public.lead_submissions FOR INSERT WITH CHECK (true);

-- ── 7. link_clicks ───────────────────────────────────────────
CREATE TABLE public.link_clicks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id         UUID NOT NULL REFERENCES public.social_links(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.card_profiles(id) ON DELETE CASCADE,
  tap_id          UUID REFERENCES public.card_taps(id) ON DELETE SET NULL,

  clicked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_link_clicks_link_id    ON public.link_clicks(link_id);
CREATE INDEX idx_link_clicks_profile_id ON public.link_clicks(profile_id);

-- Trigger: increment social_links.click_count
CREATE OR REPLACE FUNCTION public.increment_link_click_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.social_links
  SET click_count = click_count + 1
  WHERE id = NEW.link_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_increment_link_click_count
  AFTER INSERT ON public.link_clicks
  FOR EACH ROW EXECUTE FUNCTION public.increment_link_click_count();

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own link clicks"
  ON public.link_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = link_clicks.profile_id AND cp.account_id = auth.uid()
    )
  );
CREATE POLICY "Public can insert link clicks"
  ON public.link_clicks FOR INSERT WITH CHECK (true);

-- ── 8. profile_products ──────────────────────────────────────
CREATE TABLE public.profile_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.card_profiles(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  name            TEXT NOT NULL,
  description     TEXT,
  price_inr       INT,        -- in paise; NULL = price on request
  currency        TEXT NOT NULL DEFAULT 'INR',
  image_url       TEXT,
  link_url        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,

  click_count     INT NOT NULL DEFAULT 0,
  view_count      INT NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profile_products_profile_id ON public.profile_products(profile_id);

CREATE TRIGGER trg_profile_products_updated_at
  BEFORE UPDATE ON public.profile_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profile_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own products"
  ON public.profile_products FOR ALL USING (auth.uid() = account_id);
CREATE POLICY "Public can view active products"
  ON public.profile_products FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = profile_products.profile_id AND cp.is_active = true
    )
  );

-- ── 9. profile_feeds ─────────────────────────────────────────
CREATE TABLE public.profile_feeds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.card_profiles(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  feed_type       feed_type NOT NULL DEFAULT 'text',
  caption         TEXT,
  media_url       TEXT,
  thumbnail_url   TEXT,
  link_url        TEXT,
  link_title      TEXT,
  is_published    BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profile_feeds_profile_id ON public.profile_feeds(profile_id);

ALTER TABLE public.profile_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own feeds"
  ON public.profile_feeds FOR ALL USING (auth.uid() = account_id);
CREATE POLICY "Public can view published feeds"
  ON public.profile_feeds FOR SELECT
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = profile_feeds.profile_id AND cp.is_active = true
    )
  );

-- ── 10. Update nfc_cards ─────────────────────────────────────
-- Add card_nickname; keep tap_count (already exists); drop profile_data JSONB
-- NOTE: profile_data migration runs BEFORE drop (see section 12 below)
ALTER TABLE public.nfc_cards
  ADD COLUMN IF NOT EXISTS card_nickname TEXT;

-- ── 11. Storage Buckets ──────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('profile-avatars',     'profile-avatars',     true),
  ('profile-backgrounds', 'profile-backgrounds', true),
  ('profile-feeds',       'profile-feeds',       true)
ON CONFLICT (id) DO NOTHING;

-- profile-avatars policies
CREATE POLICY "Public read profile avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'profile-avatars');
CREATE POLICY "Auth upload profile avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-avatars');
CREATE POLICY "Auth update profile avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-avatars');
CREATE POLICY "Auth delete profile avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-avatars');

-- profile-backgrounds policies
CREATE POLICY "Public read profile backgrounds"
  ON storage.objects FOR SELECT USING (bucket_id = 'profile-backgrounds');
CREATE POLICY "Auth upload profile backgrounds"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-backgrounds');
CREATE POLICY "Auth update profile backgrounds"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-backgrounds');
CREATE POLICY "Auth delete profile backgrounds"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-backgrounds');

-- profile-feeds policies
CREATE POLICY "Public read profile feeds"
  ON storage.objects FOR SELECT USING (bucket_id = 'profile-feeds');
CREATE POLICY "Auth upload profile feeds"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-feeds');
CREATE POLICY "Auth update profile feeds"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-feeds');
CREATE POLICY "Auth delete profile feeds"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-feeds');

-- ── 12. Migrate existing profile_data JSONB → card_profiles ──
-- Creates one 'active' profile per card from existing JSONB data.
-- Run this BEFORE dropping profile_data column.
INSERT INTO public.card_profiles (
  card_id, account_id, profile_name, display_name, title, bio,
  status, is_active, sort_order
)
SELECT
  nc.id,
  nc.account_id,
  COALESCE(nc.profile_data->>'name', 'My Profile'),
  COALESCE(nc.profile_data->>'name', ''),
  nc.profile_data->>'tagline',
  nc.profile_data->>'bio',
  CASE WHEN nc.status = 'active' THEN 'active'::profile_status ELSE 'draft'::profile_status END,
  nc.status = 'active',
  0
FROM public.nfc_cards nc
WHERE nc.account_id IS NOT NULL
  AND nc.profile_data IS NOT NULL
  AND nc.profile_data != '{}'::jsonb
ON CONFLICT DO NOTHING;

-- ── 13. Drop profile_data column (after migration) ───────────
-- Uncomment only after verifying migration above ran correctly:
-- ALTER TABLE public.nfc_cards DROP COLUMN IF EXISTS profile_data;

-- ── 14. Analytics Views ──────────────────────────────────────
CREATE OR REPLACE VIEW public.v_card_tap_summary
WITH (security_invoker = on) AS
SELECT
  ct.card_id,
  COUNT(*)                                        AS total_taps,
  COUNT(DISTINCT DATE_TRUNC('day', ct.tapped_at)) AS active_days,
  COUNT(*) FILTER (WHERE ct.tapped_at >= NOW() - INTERVAL '30 days') AS taps_30d,
  COUNT(*) FILTER (WHERE ct.tapped_at >= NOW() - INTERVAL '7 days')  AS taps_7d,
  COUNT(DISTINCT ct.ip_address)                   AS unique_visitors,
  MODE() WITHIN GROUP (ORDER BY ct.device_type)   AS top_device_type,
  MODE() WITHIN GROUP (ORDER BY ct.country)       AS top_country
FROM public.card_taps ct
GROUP BY ct.card_id;

CREATE OR REPLACE VIEW public.v_profile_tap_summary
WITH (security_invoker = on) AS
SELECT
  ct.profile_id,
  ct.card_id,
  COUNT(*)                                                              AS total_taps,
  COUNT(*) FILTER (WHERE ct.tapped_at >= NOW() - INTERVAL '30 days')   AS taps_30d,
  COUNT(*) FILTER (WHERE ct.tapped_at >= NOW() - INTERVAL '7 days')    AS taps_7d,
  COUNT(DISTINCT ct.ip_address)                                         AS unique_visitors
FROM public.card_taps ct
WHERE ct.profile_id IS NOT NULL
GROUP BY ct.profile_id, ct.card_id;
