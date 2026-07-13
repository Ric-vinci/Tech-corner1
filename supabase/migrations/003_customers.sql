-- Customer accounts for sell-side login

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null unique,
  password_hash text not null,
  first_name text,
  last_name text,
  phone text
);

alter table public.trade_in_submissions
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

create index if not exists customers_email_idx on public.customers(email);
create index if not exists trade_in_submissions_customer_idx on public.trade_in_submissions(customer_id);

alter table public.customers enable row level security;
