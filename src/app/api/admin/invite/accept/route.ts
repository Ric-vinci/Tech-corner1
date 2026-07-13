import { NextResponse } from "next/server";
import { acceptAdminInvite } from "@/lib/admin/admins";
import { createAdminSessionToken, setAdminSessionCookie } from "@/lib/admin/session";

export async function POST(request: Request) {
  let body: { email?: string; token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const token = body.token?.trim();
  const password = body.password ?? "";
  if (!email || !token) {
    return NextResponse.json({ error: "This invite link is invalid." }, { status: 400 });
  }

  const result = await acceptAdminInvite(email, token, password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  // Log them straight in.
  const sessionToken = createAdminSessionToken(result.email);
  if (sessionToken) await setAdminSessionCookie(sessionToken);

  return NextResponse.json({ success: true });
}
