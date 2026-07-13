import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/customer/password";
import { createCustomerSessionToken, setCustomerSessionCookie } from "@/lib/customer/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: customer, error } = await supabase
      .from("customers")
      .select("id, email, password_hash, first_name, last_name")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    if (!customer || !verifyPassword(password, customer.password_hash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = createCustomerSessionToken(customer.id, customer.email);
    if (!token) return NextResponse.json({ error: "Session not configured" }, { status: 503 });

    await setCustomerSessionCookie(token);
    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
      },
    });
  } catch (error) {
    console.error("[customer/login] failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
