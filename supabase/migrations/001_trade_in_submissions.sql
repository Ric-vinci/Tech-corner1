-- Trade-in submissions (PII + workflow). Catalog lives in Shopify only.

create table if not exists public.trade_in_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  shopify_product_id text,
  shopify_variant_id text,
  product_name text not null,
  product_slug text,
  condition text not null,
  return_pack text,
  payment_method text not null,
  quantity integer not null default 1,
  quoted_price numeric(10, 2) not null,
  imei text,
  confirm_account boolean not null default false,
  confirm_unlocked boolean not null default false,
  confirm_payment boolean not null default false,
  status text not null default 'submitted',
  customer_email text,
  customer_name text,
  payout_details jsonb
);

create table if not exists public.trade_in_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.trade_in_submissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  event_type text not null,
  note text
);

create index if not exists trade_in_submissions_status_idx on public.trade_in_submissions(status);
create index if not exists trade_in_submissions_shopify_product_idx on public.trade_in_submissions(shopify_product_id);

alter table public.trade_in_submissions enable row level security;
alter table public.trade_in_events enable row level security;

-- Service role bypasses RLS; anon cannot read submissions.
