import { getSupabaseAdmin } from "@/lib/supabase/server";

type TradeInQuery = {
  customerId: string;
  customerEmail: string;
};

async function queryTradeIns(column: "customer_id" | "customer_email", value: string) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from("trade_in_submissions")
    .select("*")
    .eq(column, value)
    .order("created_at", { ascending: false })
    .limit(50);
}

export async function fetchCustomerTradeIns({ customerId, customerEmail }: TradeInQuery) {
  const email = customerEmail.trim().toLowerCase();

  const byCustomerId = await queryTradeIns("customer_id", customerId);
  if (!byCustomerId.error) {
    return byCustomerId.data ?? [];
  }

  const byEmail = await queryTradeIns("customer_email", email);
  if (!byEmail.error) {
    return byEmail.data ?? [];
  }

  return [];
}
