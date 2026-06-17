-- ============================================================
-- Migration: Fix Link Click Count Tracking (Simplified)
-- Date: 2026-06-17
-- ============================================================
-- Root Cause: The junction migration (20260611) replaced the trigger
-- function body to update profile_links.click_count. However the
-- trigger is still attached to link_clicks, so ONE insert = ONE +1.
-- The previous fix accidentally added a second increment path (RPC).
-- This migration ensures there is EXACTLY ONE increment path:
--   link_clicks INSERT → trigger → profile_links.click_count + 1
-- ============================================================

-- 1. Ensure the trigger function correctly updates profile_links.
--    (link_clicks.link_id = social_links.id, which maps to profile_links.link_id)
CREATE OR REPLACE FUNCTION public.increment_link_click_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profile_links
  SET click_count = click_count + 1
  WHERE link_id = NEW.link_id
    AND profile_id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recreate the trigger (idempotent)
DROP TRIGGER IF EXISTS trg_increment_link_click_count ON public.link_clicks;
CREATE TRIGGER trg_increment_link_click_count
  AFTER INSERT ON public.link_clicks
  FOR EACH ROW EXECUTE FUNCTION public.increment_link_click_count();

-- 3. Drop the extra RPC if it was created by a previous migration attempt
--    (it was causing double increments when called alongside the trigger)
DROP FUNCTION IF EXISTS public.increment_profile_link_click(UUID);

-- 4. Ensure anon can insert into link_clicks (public profile tap page)
DROP POLICY IF EXISTS "Public can insert link clicks" ON public.link_clicks;
CREATE POLICY "Public can insert link clicks"
  ON public.link_clicks FOR INSERT WITH CHECK (true);

-- 5. Ensure public can read social_links for active profiles
DROP POLICY IF EXISTS "Public can read active social links" ON public.social_links;
CREATE POLICY "Public can read active social links"
  ON public.social_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_links pl
      JOIN public.card_profiles cp ON cp.id = pl.profile_id
      WHERE pl.link_id = social_links.id
        AND pl.is_active = true
        AND cp.is_active = true
    )
  );

-- 6. Ensure public can read active profile_links
DROP POLICY IF EXISTS "Public can read active profile links" ON public.profile_links;
CREATE POLICY "Public can read active profile links"
  ON public.profile_links FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = profile_links.profile_id AND cp.is_active = true
    )
  );
