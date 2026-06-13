-- ============================================================
-- Migration: Add media_urls JSONB column to profile_feeds table
-- Date: 2026-06-13
-- ============================================================

ALTER TABLE public.profile_feeds
  ADD COLUMN IF NOT EXISTS media_urls JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Populate media_urls with existing single media_url if present
UPDATE public.profile_feeds
SET media_urls = jsonb_build_array(media_url)
WHERE media_url IS NOT NULL AND media_urls = '[]'::jsonb;
