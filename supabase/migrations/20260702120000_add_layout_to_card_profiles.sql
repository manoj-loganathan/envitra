-- Migration: Add layout and layout_theme columns to public.card_profiles table
-- Date: 2026-07-02

ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS layout TEXT DEFAULT 'classic';
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS layout_theme TEXT DEFAULT 'purple';
