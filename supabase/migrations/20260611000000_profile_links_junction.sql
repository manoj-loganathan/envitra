-- 1. Alter the link_category enum to support all UI categories directly
ALTER TYPE public.link_category ADD VALUE IF NOT EXISTS 'messaging';
ALTER TYPE public.link_category ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE public.link_category ADD VALUE IF NOT EXISTS 'business';
ALTER TYPE public.link_category ADD VALUE IF NOT EXISTS 'content';
ALTER TYPE public.link_category ADD VALUE IF NOT EXISTS 'music';
ALTER TYPE public.link_category ADD VALUE IF NOT EXISTS 'ecommerce';

-- 2. Drop the old policy that depends on social_links.profile_id
DROP POLICY IF EXISTS "Public can read active social links" ON public.social_links;

-- 3. Create the new profile_links junction table
CREATE TABLE IF NOT EXISTS public.profile_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.card_profiles(id) ON DELETE CASCADE,
  link_id         UUID NOT NULL REFERENCES public.social_links(id) ON DELETE CASCADE,
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  click_count     INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, link_id)
);

-- 4. Update Click Tracking trigger function to update profile_links instead of social_links
-- (Do this before dropping social_links.click_count to avoid dependency warnings/errors)
CREATE OR REPLACE FUNCTION public.increment_link_click_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profile_links
  SET click_count = click_count + 1
  WHERE link_id = NEW.link_id AND profile_id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Migrate existing data from social_links into profile_links & deduplicate social_links
DO $$
DECLARE
  r RECORD;
  master_id UUID;
BEGIN
  -- Check if migration has already been run by verifying if profile_id column still exists in social_links
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'social_links' AND column_name = 'profile_id'
  ) THEN
    -- Loop over all existing links
    FOR r IN 
      SELECT id, profile_id, account_id, category, platform, label, url, is_active, sort_order, click_count, created_at 
      FROM public.social_links
    LOOP
      -- Find the master link id (the first one added for this account, platform, and url)
      SELECT id INTO master_id 
      FROM public.social_links
      WHERE account_id = r.account_id AND platform = r.platform AND url = r.url
      ORDER BY created_at ASC, id ASC
      LIMIT 1;

      -- Insert relation into profile_links
      INSERT INTO public.profile_links (profile_id, link_id, sort_order, is_active, click_count, created_at)
      VALUES (r.profile_id, master_id, r.sort_order, r.is_active, r.click_count, r.created_at)
      ON CONFLICT (profile_id, link_id) DO NOTHING;
    END LOOP;

    -- Now delete all duplicate/non-master rows in social_links that are no longer referenced in profile_links
    DELETE FROM public.social_links
    WHERE id NOT IN (
      SELECT DISTINCT link_id FROM public.profile_links
    );
  END IF;
END $$;

-- 6. Drop obsolete columns from social_links table (including icon_slug)
ALTER TABLE public.social_links
  DROP COLUMN IF EXISTS profile_id,
  DROP COLUMN IF EXISTS sort_order,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS click_count,
  DROP COLUMN IF EXISTS icon_slug;

-- 7. Enable Row Level Security (RLS) on profile_links
ALTER TABLE public.profile_links ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies for profile_links
CREATE POLICY "Users can manage own profile links"
  ON public.profile_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = profile_links.profile_id AND cp.account_id = auth.uid()
    )
  );

CREATE POLICY "Public can read active profile links"
  ON public.profile_links FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = profile_links.profile_id AND cp.is_active = true
    )
  );

-- 9. Create the updated public read policy on social_links referencing the junction table
CREATE POLICY "Public can read active social links"
  ON public.social_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_links pl
      JOIN public.card_profiles cp ON cp.id = pl.profile_id
      WHERE pl.link_id = social_links.id AND pl.is_active = true AND cp.is_active = true
    )
  );
