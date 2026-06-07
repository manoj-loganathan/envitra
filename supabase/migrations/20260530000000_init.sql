-- Supabase Database Schema for Envitra

-- 1. Enums
CREATE TYPE product_type AS ENUM ('solid_color', 'design', 'custom');
CREATE TYPE order_status AS ENUM (
  'pending_payment',
  'payment_failed',
  'pending_production',
  'in_production',
  'dispatched',
  'delivered',
  'cancelled',
  'refunded'
);
CREATE TYPE card_status AS ENUM (
  'provisioned',
  'active',
  'deactivated',
  'reassigned'
);
CREATE TYPE user_plan AS ENUM ('free', 'pro', 'business');

-- 2. Accounts Table
CREATE TABLE public.accounts (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  plan user_plan NOT NULL DEFAULT 'free',
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for Accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own account" ON public.accounts FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own account" ON public.accounts FOR UPDATE USING (auth.uid() = id);

-- 3. Card Products Table
CREATE TABLE public.card_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  product_type product_type NOT NULL,
  price_inr INT NOT NULL, -- in paise (e.g. 99900 for ₹999)
  material TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  available_colors JSONB DEFAULT '[]'::jsonb, -- Array of hex/color details
  image_url TEXT, -- thumbnail or base card visual
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for Card Products
ALTER TABLE public.card_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can select active products" ON public.card_products FOR SELECT USING (is_active = TRUE);

-- Seed some initial Card Products
INSERT INTO public.card_products (name, slug, product_type, price_inr, material, description, available_colors, image_url)
VALUES
  ('Solid Classic', 'solid-classic', 'solid_color', 99900, 'Matte PVC', 'A premium solid colored NFC card with a beautiful matte finish.', '[{"name":"Midnight Black","hex":"#111111"},{"name":"Royal Blue","hex":"#1E3A8A"},{"name":"Emerald Green","hex":"#047857"},{"name":"Deep Purple","hex":"#5B21B6"}]'::jsonb, '/placeholder_solid.png'),
  ('Eco Bamboo', 'eco-bamboo', 'solid_color', 149900, 'Sustainably Harvested Bamboo', 'Handcrafted wood card from natural bamboo. Eco-friendly and unique grain.', '[{"name":"Natural Bamboo","hex":"#D5C4A1"}]'::jsonb, '/placeholder_bamboo.png'),
  ('Botanica Design', 'botanica-design', 'design', 129900, 'Recycled PVC', 'Modern botanical aesthetic with abstract plant outline shapes.', '[]'::jsonb, '/placeholder_botanica.png'),
  ('Cyberpunk Design', 'cyberpunk-design', 'design', 129900, 'Recycled PVC', 'Neon accent lines and circuit-inspired details for a high-tech style.', '[]'::jsonb, '/placeholder_cyber.png'),
  ('Fully Custom Card', 'fully-custom', 'custom', 199900, 'Premium Recycled PVC', 'Upload your background graphics, brand logos, custom texts and layout.', '[]'::jsonb, '/placeholder_custom.png');

-- 4. Orders & Order Items
CREATE SEQUENCE order_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  seq_val INT;
  year_val TEXT;
BEGIN
  SELECT nextval('order_number_seq') INTO seq_val;
  SELECT to_char(NOW(), 'YYYY') INTO year_val;
  RETURN 'ENV-' || year_val || '-' || seq_val;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT public.generate_order_number(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending_payment',
  total_inr INT NOT NULL, -- in paise
  subtotal_inr INT NOT NULL,
  gst_inr INT NOT NULL,
  plan_charge_inr INT NOT NULL DEFAULT 0,
  shipping_address JSONB NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  invoice_number TEXT UNIQUE,
  invoice_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  dispatched_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  courier_name TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  card_product_id UUID REFERENCES public.card_products(id) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  price_inr INT NOT NULL, -- in paise
  personalisation JSONB NOT NULL, -- json containing name, tagline, background, logo, color, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for Orders and Order Items
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own orders" ON public.orders FOR SELECT USING (auth.uid() = account_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = account_id);
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE USING (auth.uid() = account_id);

CREATE POLICY "Users can select own order items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.account_id = auth.uid()
  )
);
CREATE POLICY "Users can create own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.account_id = auth.uid()
  )
);

-- 5. NFC Cards Table
CREATE TABLE public.nfc_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID UNIQUE REFERENCES public.order_items(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  card_url TEXT NOT NULL,
  qr_code_url TEXT,
  status card_status NOT NULL DEFAULT 'provisioned',
  profile_data JSONB DEFAULT '{}'::jsonb,
  tap_count INT DEFAULT 0,
  provisioned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE
);

-- RLS for NFC Cards
ALTER TABLE public.nfc_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active card profiles by slug" ON public.nfc_cards FOR SELECT USING (status = 'active');
CREATE POLICY "Users can select own cards" ON public.nfc_cards FOR SELECT USING (auth.uid() = account_id);
CREATE POLICY "Users can update own cards" ON public.nfc_cards FOR UPDATE USING (auth.uid() = account_id);

-- 6. Admin Panel Tables
CREATE TABLE public.admin_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS for admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin service role can do everything" ON public.admin_users USING (true);

CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- e.g. 'new_order', 'payment_failed', 'card_setup_complete'
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin service role can do everything on notifications" ON public.admin_notifications USING (true);

-- 7. Database Views for Analytics
CREATE OR REPLACE VIEW public.v_revenue_summary
WITH (security_invoker = on) AS
SELECT
  DATE_TRUNC('day', paid_at) AS day_date,
  COUNT(id) AS total_orders,
  SUM(total_inr) AS daily_revenue_paise,
  SUM(plan_charge_inr) AS daily_plan_revenue_paise
FROM public.orders
WHERE status IN ('pending_production', 'in_production', 'dispatched', 'delivered')
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW public.v_order_summary
WITH (security_invoker = on) AS
SELECT
  status,
  COUNT(id) AS status_count
FROM public.orders
GROUP BY status;

-- 8. Trigger to Automatically Create Account on User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (id, email, full_name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
