-- Migration: Remove unique constraint on order_item_id in nfc_cards table
-- Date: 2026-06-20
-- Description:
--   Drops the unique constraint on the order_item_id column in the nfc_cards table.
--   This allows multiple cards to be provisioned under a single order item when quantity > 1.

ALTER TABLE public.nfc_cards DROP CONSTRAINT IF EXISTS nfc_cards_order_item_id_key;
