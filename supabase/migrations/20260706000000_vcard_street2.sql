-- ── ADD street2 COLUMN TO vcard_details ──
-- Adds a second street address line for fuller postal address support.
ALTER TABLE public.vcard_details
  ADD COLUMN IF NOT EXISTS street2 text;
