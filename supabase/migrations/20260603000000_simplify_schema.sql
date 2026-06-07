-- Migration: Simplify schema, remove card_products and customize order_items & storage

-- 1. Drop foreign key constraint on order_items referencing card_products
ALTER TABLE IF EXISTS public.order_items 
  DROP CONSTRAINT IF EXISTS order_items_card_product_id_fkey;

-- 2. Drop the column card_product_id and add direct product descriptors
ALTER TABLE IF EXISTS public.order_items 
  DROP COLUMN IF EXISTS card_product_id;

ALTER TABLE IF EXISTS public.order_items
  ADD COLUMN IF NOT EXISTS product_name TEXT NOT NULL DEFAULT 'Envitra Smart Card',
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'solid_color',
  ADD COLUMN IF NOT EXISTS material TEXT NOT NULL DEFAULT 'Matte PVC';

-- 3. Drop card_products table
DROP TABLE IF EXISTS public.card_products;

-- 4. Create public storage bucket for order images/logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-assets', 'order-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for order-assets
CREATE POLICY "Public Access to Order Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-assets');

CREATE POLICY "Authenticated Upload to Order Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-assets');

CREATE POLICY "Owner Update Order Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'order-assets');

CREATE POLICY "Owner Delete Order Assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'order-assets');
