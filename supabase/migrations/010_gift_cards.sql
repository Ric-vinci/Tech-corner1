-- Registry of gift cards WE issued (trade-in store credit), so a customer can
-- redeem a one-time code at buy checkout. We store an HMAC of the code (never
-- the plaintext) so a leaked DB can't reveal codes and lookup-by-code is O(1).

create table if not exists public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  gid text not null unique,                 -- Shopify gift card gid
  code_hash text not null unique,           -- HMAC-SHA256(code)
  last4 text,
  customer_id uuid references public.customers(id) on delete set null,
  submission_id uuid,
  initial_amount numeric(10, 2)
);

create index if not exists gift_cards_code_hash_idx on public.gift_cards (code_hash);

alter table public.gift_cards enable row level security;
-- Server uses the service role (bypasses RLS); never exposed to the client.
