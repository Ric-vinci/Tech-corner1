import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { revokeAdminUser } from "@/lib/admin/admins";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await revokeAdminUser(id);
  if (!ok) return NextResponse.json({ error: "Could not remove that admin." }, { status: 500 });
  return NextResponse.json({ success: true });
}
