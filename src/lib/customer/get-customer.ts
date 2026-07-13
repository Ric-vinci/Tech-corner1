import { getSupabaseAdmin } from "@/lib/supabase/server";
import { fetchCustomerTradeIns } from "@/lib/customer/trade-ins";

export type CustomerProfile = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
};

export async function getCustomerProfile(customerId: string): Promise<CustomerProfile | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("customers")
    .select("id, email, first_name, last_name, phone")
    .eq("id", customerId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
  };
}

export async function getCustomerTradeIns(customerId: string, customerEmail: string) {
  return fetchCustomerTradeIns({ customerId, customerEmail });
}

export function customerDisplayName(customer: CustomerProfile): string {
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
  return name || customer.email;
}

export function customerInitials(customer: CustomerProfile): string {
  const first = customer.firstName?.trim();
  const last = customer.lastName?.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (last) return last.slice(0, 2).toUpperCase();
  return customer.email.slice(0, 2).toUpperCase();
}
