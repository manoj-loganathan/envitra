-- Supabase Database Schema for Envitra (Modified & Simplified)

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

-- 3. Orders & Order Items
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
  product_name TEXT NOT NULL DEFAULT 'Envitra Smart Card',
  product_type product_type NOT NULL DEFAULT 'custom',
  material TEXT NOT NULL DEFAULT 'Matte PVC',
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

-- 4. NFC Cards Table
CREATE TABLE public.nfc_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
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

-- 5. Admin Panel Tables
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

-- 6. Database Views for Analytics
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

-- 7. Trigger to Automatically Create Account on User Signup
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

-- 8. Storage Buckets & Policies Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-assets', 'order-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Read policy (accessible publicly so cards can render assets)
CREATE POLICY "Public Read Access to Order Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-assets');

-- Insert policy (authenticated users can upload logos/backgrounds)
CREATE POLICY "Authenticated Insert Access to Order Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-assets');

-- Update policy
CREATE POLICY "Authenticated Update Access to Order Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'order-assets');

-- Delete policy
CREATE POLICY "Authenticated Delete Access to Order Assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'order-assets');
