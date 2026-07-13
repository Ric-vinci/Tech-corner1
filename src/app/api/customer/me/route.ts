import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ customer: null });
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("customers")
    .select("id, email, first_name, last_name, phone")
    .eq("id", session.customerId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ customer: null });
  }

  return NextResponse.json({
    customer: {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
    },
  });
}
