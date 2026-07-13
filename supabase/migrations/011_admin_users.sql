-- Additional admins, invited by email by an existing admin. The env ADMIN_EMAIL
-- is still the built-in "owner" account (not stored here); this table holds the
-- extra admins. A pending admin has an HMAC'd invite token and no password yet;
-- once they accept, we store a scrypt password hash and mark them active.

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null unique,
  password_hash text,                        -- scrypt "salt:hash"; null until accepted
  invite_token_hash text,                    -- HMAC-SHA256(invite token); null once accepted
  invite_expires_at timestamptz,
  invited_by text,                           -- email of the admin who sent the invite
  status text not null default 'invited',    -- 'invited' | 'active'
  accepted_at timestamptz
);

create index if not exists admin_users_email_idx on public.admin_users (email);

alter table public.admin_users enable row level security;
-- Server uses the service role (bypasses RLS); never exposed to the client.
