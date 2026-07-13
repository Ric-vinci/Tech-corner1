import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { createAdminInvite, listAdminUsers } from "@/lib/admin/admins";
import { sendAdminInviteEmail } from "@/lib/email/admin-invite";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ admins: await listAdminUsers() });
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

  const origin = new URL(request.url).origin;
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
