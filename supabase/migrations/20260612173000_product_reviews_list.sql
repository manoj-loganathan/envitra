-- ============================================================
-- Migration: Add product reviews table and aggregate rating triggers
-- Date: 2026-06-12
-- Description:
--   1. Creates profile_product_reviews table.
--   2. Setup RLS rules for reviews.
--   3. Migrates existing reviews/ratings from profile_products.
--   4. Creates aggregate rating calculation trigger on profile_products.
-- ============================================================

-- ── Step 1: Create profile_product_reviews table ──
CREATE TABLE IF NOT EXISTS public.profile_product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  reviewer_name TEXT NOT NULL DEFAULT 'Anonymous',
  rating NUMERIC(3, 2) NOT NULL CHECK (rating >= 0.00 AND rating <= 5.00),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT profile_product_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT profile_product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.profile_products(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_profile_product_reviews_product_id 
  ON public.profile_product_reviews(product_id);

-- ── Step 2: Setup RLS policies ──
ALTER TABLE public.profile_product_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view reviews
DROP POLICY IF EXISTS "Public read product reviews" ON public.profile_product_reviews;
CREATE POLICY "Public read product reviews" 
  ON public.profile_product_reviews FOR SELECT USING (true);

-- Policy: Anyone can insert reviews
DROP POLICY IF EXISTS "Allow public insert of reviews" ON public.profile_product_reviews;
CREATE POLICY "Allow public insert of reviews" 
  ON public.profile_product_reviews FOR INSERT WITH CHECK (true);

-- Policy: Product owners can manage (update/delete) reviews
DROP POLICY IF EXISTS "Allow authenticated manage of reviews" ON public.profile_product_reviews;
CREATE POLICY "Allow authenticated manage of reviews" 
  ON public.profile_product_reviews FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profile_products p
      WHERE p.id = product_id AND p.account_id = auth.uid()
    )
  );

-- ── Step 3: Migrate existing single rating & review data ──
INSERT INTO public.profile_product_reviews (product_id, rating, review, reviewer_name)
SELECT id, rating, review, 'Featured Client'
FROM public.profile_products
WHERE rating IS NOT NULL OR (review IS NOT NULL AND review <> '')
ON CONFLICT DO NOTHING;

-- ── Step 4: Setup triggers to aggregate average ratings ──
CREATE OR REPLACE FUNCTION public.fn_recalculate_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.profile_products
    SET rating = (
      SELECT ROUND(AVG(rating), 2)
      FROM public.profile_product_reviews
      WHERE product_id = OLD.product_id
    )
    WHERE id = OLD.product_id;
    RETURN OLD;
  ELSE
    UPDATE public.profile_products
    SET rating = (
      SELECT ROUND(AVG(rating), 2)
      FROM public.profile_product_reviews
      WHERE product_id = NEW.product_id
    )
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalculate_product_rating ON public.profile_product_reviews;
CREATE TRIGGER trg_recalculate_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.profile_product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_recalculate_product_rating();
