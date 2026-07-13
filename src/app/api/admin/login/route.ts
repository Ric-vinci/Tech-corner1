import { NextResponse } from "next/server";
import { getAdminEmail, getAdminPassword, isAdminAuthConfigured } from "@/lib/admin/config";
import { createAdminSessionToken, setAdminSessionCookie } from "@/lib/admin/session";
import { verifyAdminCredentials } from "@/lib/admin/admins";

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json({ error: "Admin auth is not configured" }, { status: 503 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // The env owner account, or any active invited admin (DB, scrypt-verified).
  const isOwner = email === getAdminEmail() && password === getAdminPassword();
  const authedEmail = isOwner ? email : await verifyAdminCredentials(email, password);
  if (!authedEmail) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = createAdminSessionToken(authedEmail);
  if (!token) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  await setAdminSessionCookie(token);
  return NextResponse.json({ success: true });
}
