import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/customer/password";
import { createCustomerSessionToken, setCustomerSessionCookie } from "@/lib/customer/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: { email?: string; password?: string; firstName?: string; lastName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Email and password (min 8 chars) are required" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from("customers").select("id").eq("email", email).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("customers")
      .insert({
        email,
        password_hash: hashPassword(password),
        first_name: body.firstName?.trim() || null,
        last_name: body.lastName?.trim() || null,
      })
      .select("id, email, first_name, last_name")
      .single();

    if (error) throw error;

    const token = createCustomerSessionToken(data.id, data.email);
    if (!token) return NextResponse.json({ error: "Session not configured" }, { status: 503 });

    await setCustomerSessionCookie(token);
    return NextResponse.json({
      customer: {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
      },
    });
  } catch (error) {
    console.error("[customer/register] failed:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
