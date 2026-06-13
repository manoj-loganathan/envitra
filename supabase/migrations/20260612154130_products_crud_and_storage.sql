-- ============================================================
-- Migration: Products CRUD enhancements and multi-image storage
-- Date: 2026-06-12
-- Description:
--   1. Restructures profile_products table to support multi-images,
--      quantities, ratings, reviews, and enquiry form link.
--   2. Creates product-images storage bucket for file uploads.
-- ============================================================

-- ── Step 1: Update profile_products table columns ──
ALTER TABLE public.profile_products
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS net_quantity INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) CHECK (rating >= 0.00 AND rating <= 5.00),
  ADD COLUMN IF NOT EXISTS review TEXT,
  ADD COLUMN IF NOT EXISTS enquiry_form_id UUID REFERENCES public.lead_forms(id) ON DELETE SET NULL;

-- ── Step 2: Create index for enquiry_form_id for query speed ──
CREATE INDEX IF NOT EXISTS idx_profile_products_enquiry_form_id
  ON public.profile_products(enquiry_form_id);

-- ── Step 3: Create product-images storage bucket ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ── Step 4: Setup storage policies for product-images ──
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Auth upload product images" ON storage.objects;
CREATE POLICY "Auth upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Auth update product images" ON storage.objects;
CREATE POLICY "Auth update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Auth delete product images" ON storage.objects;
CREATE POLICY "Auth delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');
