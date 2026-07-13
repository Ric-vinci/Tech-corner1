import type { TradeInStatus } from "./status";
import type { ShippingAddress } from "@/lib/checkout/shipping-address";

export type TradeInSubmission = {
  id: string;
  created_at: string;
  updated_at: string;
  shopify_product_id: string | null;
  shopify_variant_id: string | null;
  shopify_inventory_product_id: string | null;
  product_name: string;
  product_slug: string | null;
  category: string | null;
  condition: string;
  return_pack: string | null;
  payment_method: string;
  quantity: number;
  quoted_price: number;
  revised_price: number | null;
  imei: string | null;
  confirm_account: boolean;
  confirm_unlocked: boolean;
  confirm_payment: boolean;
  status: TradeInStatus;
  customer_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  shipping_address: ShippingAddress | null;
  payout_details: Record<string, unknown> | null;
  admin_notes: string | null;
  tracking_number: string | null;
  payout_reference: string | null;
  // Inspection / refurbishment details (migration 006), entered by staff.
  grade: string | null;
  battery_health: number | null;
  colour: string | null;
  storage: string | null;
  inspection_photos: string[] | null;
  inspection_notes: string | null;
  inspected_at: string | null;
  inspected_by: string | null;
  payout_provider: string | null;
  payout_status: string | null;
  payout_error: string | null;
  payout_amount: number | null;
  payout_message: string | null;
  paid_at: string | null;
};

export type TradeInEvent = {
  id: string;
  submission_id: string;
  created_at: string;
  event_type: string;
  note: string | null;
  actor_email: string | null;
};
