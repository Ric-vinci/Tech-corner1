-- Stock bookkeeping for buy orders.
--
-- A device is taken out of stock when the order is created (so it can't be sold
-- twice during a PayPal approval window or while a bank transfer is pending) and
-- put back if the payment never arrives or is refunded. Without these flags the
-- capture path decremented a second time, and a refund could restore twice.
alter table public.buy_orders
  add column if not exists stock_taken boolean not null default false,
  add column if not exists stock_released boolean not null default false,
  add column if not exists cancelled_at timestamptz;

-- The abandoned-order sweeper scans unpaid orders by age.
create index if not exists buy_orders_unpaid_idx
  on public.buy_orders (payment_status, created_at);

-- Existing paid orders already had their stock taken; mark them so a later
-- refund releases exactly once instead of being treated as never-taken.
update public.buy_orders set stock_taken = true where payment_status = 'paid' and stock_taken = false;
