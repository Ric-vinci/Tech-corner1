import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/customer/password";
import { requireCustomerSession } from "@/lib/customer/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    firstName?: string;
    lastName?: string;
    changeEmail?: boolean;
    email?: string;
    changePassword?: boolean;
    currentPassword?: string;
    password?: string;
    passwordConfirmation?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: loadError } = await supabase
    .from("customers")
    .select("id, email, password_hash")
    .eq("id", session.customerId)
    .maybeSingle();

  if (loadError || !existing) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const updates: Record<string, string> = {
    first_name: firstName,
    last_name: lastName,
    updated_at: new Date().toISOString(),
  };

  if (body.changeEmail) {
    const email = body.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: duplicate } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .neq("id", session.customerId)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    updates.email = email;
  }

  if (body.changePassword) {
    const currentPassword = body.currentPassword ?? "";
    const password = body.password ?? "";
    const passwordConfirmation = body.passwordConfirmation ?? "";

    if (!currentPassword || !verifyPassword(currentPassword, existing.password_hash)) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (password !== passwordConfirmation) {
      return NextResponse.json({ error: "Password confirmation must match" }, { status: 400 });
    }

    updates.password_hash = hashPassword(password);
  }

  const { data, error } = await supabase
    .from("customers")
    .update(updates)
    .eq("id", session.customerId)
    .select("id, email, first_name, last_name, phone")
    .single();

  if (error) {
    console.error("[customer/profile] update failed:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
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
