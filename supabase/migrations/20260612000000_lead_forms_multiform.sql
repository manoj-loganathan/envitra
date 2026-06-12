-- ============================================================
-- Migration: Multi-Form Lead System
-- Date: 2026-06-12
-- Description:
--   1. Removes UNIQUE(profile_id) from lead_forms to allow
--      multiple forms per profile.
--   2. Adds partial unique index: only ONE active form per profile.
--   3. Adds form_name, duplicated_from_id, product_ids columns.
--   4. Updates lead_submissions to track form_name snapshot and
--      product_id, and changes form_id FK to SET NULL on delete.
--   5. Creates lead-attachments storage bucket for file uploads.
-- ============================================================

-- ── Step 1: Drop the existing UNIQUE constraint on profile_id ──
-- The original migration created: profile_id UUID NOT NULL UNIQUE
-- We must drop the implicit unique index before adding our partial one.
ALTER TABLE public.lead_forms
  DROP CONSTRAINT IF EXISTS lead_forms_profile_id_key;

-- ── Step 2: Add new columns to lead_forms ────────────────────
ALTER TABLE public.lead_forms
  ADD COLUMN IF NOT EXISTS form_name          TEXT NOT NULL DEFAULT 'Lead Form',
  ADD COLUMN IF NOT EXISTS duplicated_from_id UUID REFERENCES public.lead_forms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_ids        JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ── Step 3: Partial unique index — only one ACTIVE form per profile ──
-- This enforces that among all forms for a profile, at most one
-- can have is_active = true at any given time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_form_per_profile
  ON public.lead_forms(profile_id)
  WHERE is_active = true;

-- ── Step 4: Regular index for performance (non-unique) ──────
CREATE INDEX IF NOT EXISTS idx_lead_forms_profile_id
  ON public.lead_forms(profile_id);

CREATE INDEX IF NOT EXISTS idx_lead_forms_account_id
  ON public.lead_forms(account_id);

-- ── Step 5: Update lead_submissions schema ───────────────────
-- Change form_id FK to SET NULL on delete (submissions survive form deletion)
ALTER TABLE public.lead_submissions
  DROP CONSTRAINT IF EXISTS lead_submissions_form_id_fkey;

ALTER TABLE public.lead_submissions
  ADD CONSTRAINT lead_submissions_form_id_fkey
    FOREIGN KEY (form_id) REFERENCES public.lead_forms(id) ON DELETE SET NULL;

-- Allow form_id to be nullable now (submissions can outlive their form)
ALTER TABLE public.lead_submissions
  ALTER COLUMN form_id DROP NOT NULL;

-- Add form_name snapshot (preserved even after form deletion)
ALTER TABLE public.lead_submissions
  ADD COLUMN IF NOT EXISTS form_name  TEXT,
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.profile_products(id) ON DELETE SET NULL;

-- Index for product_id filtering
CREATE INDEX IF NOT EXISTS idx_lead_submissions_product_id
  ON public.lead_submissions(product_id);

-- ── Step 6: Update existing RLS policy on lead_forms ─────────
-- The existing policy allows single form, update to support multi-form
-- (Policy logic doesn't change since it's account_id based, just verify)
-- No changes needed to existing policies — they already use account_id.

-- Update public read policy to allow reading any active form
DROP POLICY IF EXISTS "Public can read active lead forms" ON public.lead_forms;
CREATE POLICY "Public can read active lead forms"
  ON public.lead_forms FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = lead_forms.profile_id AND cp.is_active = true
    )
  );

-- ── Step 7: Storage bucket for lead file attachments ────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-attachments', 'lead-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Lead attachments: authenticated users can manage files
CREATE POLICY "Auth users can upload lead attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lead-attachments');

CREATE POLICY "Auth users can read lead attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lead-attachments');

CREATE POLICY "Auth users can delete lead attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lead-attachments');

-- ── Step 8: Helper function to atomically activate a form ────
-- This function sets is_active=true for the given form and
-- false for all other forms of the same profile_id.
CREATE OR REPLACE FUNCTION public.activate_lead_form(
  p_form_id    UUID,
  p_profile_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Deactivate all other forms for this profile
  UPDATE public.lead_forms
  SET    is_active = false
  WHERE  profile_id = p_profile_id
    AND  id <> p_form_id;

  -- Activate the target form
  UPDATE public.lead_forms
  SET    is_active = true
  WHERE  id = p_form_id
    AND  profile_id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Step 9: Drop legacy built-in fields ───────────────────────
ALTER TABLE public.lead_forms
  DROP COLUMN IF EXISTS capture_name,
  DROP COLUMN IF EXISTS capture_email,
  DROP COLUMN IF EXISTS capture_phone;

ALTER TABLE public.lead_submissions
  DROP COLUMN IF EXISTS lead_name,
  DROP COLUMN IF EXISTS lead_email,
  DROP COLUMN IF EXISTS lead_phone,
  DROP COLUMN IF EXISTS company,
  DROP COLUMN IF EXISTS notes;

