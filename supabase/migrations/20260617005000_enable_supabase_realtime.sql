-- Migration: Enable Realtime Replication for Envitra Core Tables
-- Date: 2026-06-17

DO $$
DECLARE
  t_name TEXT;
  tables_to_add TEXT[] := ARRAY[
    'accounts',
    'nfc_cards',
    'card_profiles',
    'vcard_details',
    'profile_links',
    'profile_products',
    'profile_feeds',
    'lead_forms',
    'lead_submissions'
  ];
BEGIN
  FOREACH t_name IN ARRAY tables_to_add LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON pr.prpubid = p.oid
      WHERE p.pubname = 'supabase_realtime' AND c.relname = t_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t_name);
    END IF;
  END LOOP;
END $$;
