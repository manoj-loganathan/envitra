-- ============================================================
-- Migration: Update public RLS select policies for cards and profiles
-- Date: 2026-06-16
-- Description:
--   Updates SELECT policies for cards, profiles, social links,
--   vCard details, products, feeds, and lead forms to check 
--   'status != draft' instead of strictly requiring 'is_active = true' 
--   or 'status = active'. This allows public access to fallback profiles,
--   ready-to-activate setup states, and deactivated profiles while not logged in.
-- ============================================================

-- 1. nfc_cards: Allow anyone to read card status by slug (needed for suspended/activation wizards)
DROP POLICY IF EXISTS "Anyone can read active card profiles by slug" ON public.nfc_cards;
CREATE POLICY "Anyone can read card profiles by slug" 
  ON public.nfc_cards FOR SELECT 
  USING (true);

-- 2. accounts: Allow public to select plan columns for subscription verification
DROP POLICY IF EXISTS "Public can read account plans" ON public.accounts;
CREATE POLICY "Public can read account plans" 
  ON public.accounts FOR SELECT 
  USING (true);

-- 3. card_profiles: Allow reading published profiles (both active and deactivated fallback profiles)
DROP POLICY IF EXISTS "Public can read active profiles" ON public.card_profiles;
CREATE POLICY "Public can read active profiles" 
  ON public.card_profiles FOR SELECT 
  USING (status != 'draft');

-- 4. vcard_details: Allow reading public vCard details for any published profiles
DROP POLICY IF EXISTS "Public can read vcard for active profiles" ON public.vcard_details;
CREATE POLICY "Public can read vcard for active profiles" 
  ON public.vcard_details FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.card_profiles cp 
      WHERE cp.id = vcard_details.profile_id AND cp.status != 'draft'
    )
  );

-- 5. profile_links: Allow reading active junction links for any published profiles
DROP POLICY IF EXISTS "Public can read active profile links" ON public.profile_links;
CREATE POLICY "Public can read active profile links" 
  ON public.profile_links FOR SELECT 
  USING (
    is_active = true AND 
    EXISTS (
      SELECT 1 FROM public.card_profiles cp 
      WHERE cp.id = profile_links.profile_id AND cp.status != 'draft'
    )
  );

-- 6. social_links: Allow reading target platform urls for active profile links
DROP POLICY IF EXISTS "Public can read active social links" ON public.social_links;
CREATE POLICY "Public can read active social links" 
  ON public.social_links FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_links pl
      JOIN public.card_profiles cp ON cp.id = pl.profile_id
      WHERE pl.link_id = social_links.id AND pl.is_active = true AND cp.status != 'draft'
    )
  );

-- 7. profile_products: Allow reading catalog products for published profiles
DROP POLICY IF EXISTS "Public can view active products" ON public.profile_products;
CREATE POLICY "Public can view active products" 
  ON public.profile_products FOR SELECT 
  USING (
    is_active = true AND 
    EXISTS (
      SELECT 1 FROM public.card_profiles cp 
      WHERE cp.id = profile_products.profile_id AND cp.status != 'draft'
    )
  );

-- 8. profile_feeds: Allow reading activity posts for published profiles
DROP POLICY IF EXISTS "Public can view published feeds" ON public.profile_feeds;
CREATE POLICY "Public can view published feeds" 
  ON public.profile_feeds FOR SELECT 
  USING (
    is_published = true AND 
    EXISTS (
      SELECT 1 FROM public.card_profiles cp 
      WHERE cp.id = profile_feeds.profile_id AND cp.status != 'draft'
    )
  );

-- 9. lead_forms: Allow reading public lead forms for published profiles
DROP POLICY IF EXISTS "Public can read active lead forms" ON public.lead_forms;
CREATE POLICY "Public can read active lead forms" 
  ON public.lead_forms FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.card_profiles cp 
      WHERE cp.id = lead_forms.profile_id AND cp.status != 'draft'
    )
  );

-- 10. Enable Supabase Realtime for database tables to trigger instant client-side updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'nfc_cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nfc_cards;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'card_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.card_profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'vcard_details'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vcard_details;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'profile_links'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_links;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'social_links'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_links;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'profile_products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_products;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'profile_product_reviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_product_reviews;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'profile_feeds'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_feeds;
  END IF;
END $$;
