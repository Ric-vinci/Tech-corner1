import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin/session";

export const metadata = { title: "Trade-in Admin — 4gadgets" };

/**
 * Signed-in admin pages get the sidebar shell. /admin/login renders bare,
 * since there is no session yet.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session) return <>{children}</>;

  return <AdminShell email={session.email}>{children}</AdminShell>;
}
