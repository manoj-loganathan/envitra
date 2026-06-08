-- ── ALTER vcard_details TABLE FOR FULL STANDARD VCARD SUPPORT ──
ALTER TABLE public.vcard_details
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS socials jsonb NOT NULL DEFAULT '[]'::jsonb;
