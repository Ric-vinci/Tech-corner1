-- Payment tracking for buy orders (customer pays us): bank / paypal / gift_card.
alter table public.buy_orders
  add column if not exists payment_method text,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_reference text,
  add column if not exists paid_at timestamptz;
