import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { getAdminEmail } from "@/lib/admin/config";
import { listAdminUsers, type AdminUser } from "@/lib/admin/admins";
import AdminTeamManager from "@/components/admin/AdminTeamManager";

export const metadata = { title: "Team — 4gadgets Admin" };

export default async function AdminTeamPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  let admins: AdminUser[] = [];
  try {
    admins = await listAdminUsers();
  } catch {
    // Table missing until migration 011 — surface an empty list; the invite
    // action returns a clear "run migration 011" message.
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-grey-dark">
          Invite teammates to the admin. Signed in as <span className="font-medium text-black">{session.email}</span>.
        </p>
      </div>

      <AdminTeamManager ownerEmail={getAdminEmail()} currentEmail={session.email} initialAdmins={admins} />
    </div>
  );
}
