-- Payouts: gift card (store credit), bank transfer, PayPal.
--
-- payout_status lifecycle:
--   processing -> paid          (success)
--   processing -> failed        (provider rejected; safe to retry)
--   processing -> unclaimed     (PayPal: recipient has no account; funds return after 30d)

alter table public.trade_in_submissions
  add column if not exists payout_provider text,
  add column if not exists payout_status text,
  add column if not exists payout_error text,
  add column if not exists payout_amount numeric(10, 2),
  add column if not exists payout_message text,
  add column if not exists paid_at timestamptz;

-- A payout reference can only ever belong to one submission. Combined with the
-- application-level guard (refuse when payout_reference is already set), this
-- makes double-paying a submission impossible even under concurrent requests.
create unique index if not exists trade_in_submissions_payout_reference_key
  on public.trade_in_submissions (payout_reference)
  where payout_reference is not null;

create index if not exists trade_in_submissions_payout_status_idx
  on public.trade_in_submissions (payout_status);
