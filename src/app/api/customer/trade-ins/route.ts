import { NextResponse } from "next/server";
import { fetchCustomerTradeIns } from "@/lib/customer/trade-ins";
import { getCustomerSession } from "@/lib/customer/session";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissions = await fetchCustomerTradeIns({
    customerId: session.customerId,
    customerEmail: session.email,
  });

  return NextResponse.json({ submissions });
}
