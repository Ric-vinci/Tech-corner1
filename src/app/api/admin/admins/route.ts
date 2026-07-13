import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { createAdminInvite, listAdminUsers } from "@/lib/admin/admins";
import { sendAdminInviteEmail } from "@/lib/email/admin-invite";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ admins: await listAdminUsers() });
}

/**
 * The public site origin for the invite link. Prefer NEXT_PUBLIC_SITE_URL (set to
 * the deployed URL), then the forwarded host (correct behind Vercel's proxy),
 * then the raw request origin as a last resort.
 */
function siteOrigin(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (envUrl) return envUrl;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const origin = siteOrigin(request);
  const result = await createAdminInvite(email, session.email, origin);
  if (!result.ok) {
    const isSchema = /admin_users|relation|column/.test(result.error);
    return NextResponse.json(
      { error: isSchema ? "Run supabase/migrations/011 in Supabase." : result.error },
      { status: 400 },
    );
  }

  const emailed = await sendAdminInviteEmail({ to: result.email, invitedBy: session.email, inviteUrl: result.inviteUrl });
  return NextResponse.json({ success: true, emailed, inviteUrl: result.inviteUrl });
}
