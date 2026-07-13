-- Trade-in workflow extensions (admin review, shipping, inventory link)

alter table public.trade_in_submissions
  add column if not exists revised_price numeric(10, 2),
  add column if not exists admin_notes text,
  add column if not exists tracking_number text,
  add column if not exists payout_reference text,
  add column if not exists shopify_inventory_product_id text;

alter table public.trade_in_events
  add column if not exists actor_email text;

create index if not exists trade_in_submissions_created_at_idx on public.trade_in_submissions(created_at desc);
create index if not exists trade_in_events_submission_id_idx on public.trade_in_events(submission_id, created_at desc);
