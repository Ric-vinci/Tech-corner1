import { NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/customer/session";
import { getStoreCreditBalance } from "@/lib/buy-payment/store-credit";

/** The signed-in customer's available store credit (their own trade-in gift cards). */
export async function GET() {
  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return NextResponse.json({ balance: 0 }, { status: 401 });
  }
  try {
    const balance = await getStoreCreditBalance(session.customerId);
    return NextResponse.json({ balance });
  } catch {
    return NextResponse.json({ balance: 0 });
  }
}
