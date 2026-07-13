-- Product category for each trade-in, so the admin pipeline can be filtered by
-- category (mobile / tablets / game-consoles / smart-watches / cameras) the same
-- way the customer website is. Captured at checkout from the product's sell href.

alter table public.trade_in_submissions
  add column if not exists category text;

-- Existing rows predate categorisation and are all phones.
update public.trade_in_submissions set category = 'mobile' where category is null;
