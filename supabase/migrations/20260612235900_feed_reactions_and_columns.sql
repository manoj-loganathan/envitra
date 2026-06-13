-- ============================================================
-- Migration: Add reactions column to profile_feeds table
-- Date: 2026-06-12
-- ============================================================

ALTER TABLE public.profile_feeds
  ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '{"like": 0, "love": 0, "fire": 0, "clap": 0}'::jsonb;
