-- ============================================================
-- Migration: Public RPC Analytics & Reactions
-- Date: 2026-06-15
-- ============================================================

-- 1. Increment product views securely
CREATE OR REPLACE FUNCTION public.increment_product_view(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profile_products
  SET view_count = view_count + 1
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Increment product clicks securely
CREATE OR REPLACE FUNCTION public.increment_product_click(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profile_products
  SET click_count = click_count + 1
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Increment feed post reactions securely
CREATE OR REPLACE FUNCTION public.increment_feed_reaction(feed_id UUID, reaction_type TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profile_feeds
  SET reactions = jsonb_set(
    COALESCE(reactions, '{"like": 0, "love": 0, "fire": 0, "clap": 0}'::jsonb),
    ARRAY[reaction_type],
    (COALESCE((COALESCE(reactions, '{"like": 0, "love": 0, "fire": 0, "clap": 0}'::jsonb)->>reaction_type)::int, 0) + 1)::text::jsonb
  )
  WHERE id = feed_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
