-- Shipping / contact details captured at trade-in checkout

alter table public.trade_in_submissions
  add column if not exists shipping_address jsonb,
  add column if not exists customer_phone text;
