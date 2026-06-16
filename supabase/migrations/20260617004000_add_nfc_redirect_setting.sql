-- Migration: Add nfc_redirect_to_dashboard setting to accounts table
-- Date: 2026-06-17

ALTER TABLE public.accounts 
ADD COLUMN nfc_redirect_to_dashboard BOOLEAN NOT NULL DEFAULT FALSE;
