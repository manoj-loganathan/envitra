-- Migration: Add primary_profile column to public.card_profiles and triggers
-- Date: 2026-06-06

-- 1. Add primary_profile column
ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS primary_profile BOOLEAN NOT NULL DEFAULT false;

-- 2. Create index to enforce single primary profile per card
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_per_card 
  ON public.card_profiles(card_id) 
  WHERE (primary_profile = true);

-- 3. Trigger/Function to enforce single primary profile, auto-set first profile to primary, and handle single active profile
CREATE OR REPLACE FUNCTION public.handle_primary_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent infinite recursion
  IF PG_TRIGGER_DEPTH() > 1 THEN
    RETURN NEW;
  END IF;

  -- If this is the first profile for the card, it MUST be primary
  IF NOT EXISTS (
    SELECT 1 FROM public.card_profiles
    WHERE card_id = NEW.card_id AND id != NEW.id
  ) THEN
    NEW.primary_profile := true;
  END IF;

  -- If the new/updated row is set as primary, unset other primary profiles for the card
  IF NEW.primary_profile = true THEN
    UPDATE public.card_profiles
    SET primary_profile = false
    WHERE card_id = NEW.card_id AND id != NEW.id AND primary_profile = true;
  ELSE
    -- If setting primary_profile to false, check if there's any other primary profile
    -- If there's no other primary profile, we cannot unset this one (must have exactly one primary profile)
    IF NOT EXISTS (
      SELECT 1 FROM public.card_profiles
      WHERE card_id = NEW.card_id AND id != NEW.id AND primary_profile = true
    ) THEN
      NEW.primary_profile := true;
    END IF;
  END IF;

  -- If this profile is active, unset other active profiles for the same card
  IF NEW.is_active = true THEN
    UPDATE public.card_profiles
    SET is_active = false
    WHERE card_id = NEW.card_id AND id != NEW.id AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_handle_primary_profile
  BEFORE INSERT OR UPDATE OF primary_profile, is_active ON public.card_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_primary_profile();

-- 4. Set existing profiles as primary (first one per card)
WITH ranked_profiles AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY card_id ORDER BY created_at ASC) as rn
  FROM public.card_profiles
)
UPDATE public.card_profiles
SET primary_profile = true
WHERE id IN (SELECT id FROM ranked_profiles WHERE rn = 1);
