-- Migration: Add avatar_url to accounts table
-- Date: 2026-07-02

ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS avatar_url TEXT;
