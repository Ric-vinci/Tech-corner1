-- Inspection / refurbishment details entered by warehouse staff.
-- Captured on the trade-in detail page once a device has arrived; feeds the
-- Shopify resale product (grade, colour, storage) when it is published.

alter table public.trade_in_submissions
  add column if not exists grade text,
  add column if not exists battery_health integer,
  add column if not exists colour text,
  add column if not exists storage text,
  add column if not exists inspection_photos jsonb,
  add column if not exists inspection_notes text,
  add column if not exists inspected_at timestamptz,
  add column if not exists inspected_by text;
