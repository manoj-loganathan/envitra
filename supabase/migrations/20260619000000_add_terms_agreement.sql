-- Add agreed_to_terms to public.accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN NOT NULL DEFAULT FALSE;

-- Update handle_new_user trigger function to populate agreed_to_terms from metadata or OAuth provider check
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (id, email, full_name, plan, agreed_to_terms)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'free',
    COALESCE(
      (NEW.raw_user_meta_data->>'agreed_to_terms')::boolean,
      (NEW.raw_user_meta_data->>'provider' IS NOT NULL),
      (NEW.raw_user_meta_data->>'iss' IS NOT NULL),
      FALSE
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
