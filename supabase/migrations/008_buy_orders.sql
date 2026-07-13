-- Buy-side orders (customers purchasing refurbished devices). Separate from the
-- trade-in tables. Items are stored inline as jsonb (one order, many lines).

create table if not exists public.buy_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_email text,
  customer_name text,
  shipping_address jsonb,
  items jsonb not null,
  total numeric(10, 2) not null,
  status text not null default 'pending_payment'
);

alter table public.buy_orders enable row level security;
-- Server uses the service role (bypasses RLS); no public policies by design.
