import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getAdminEmail } from "@/lib/admin/config";

export const metadata = { title: "Admin Login — 4gadgets" };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grey-lightest px-4 py-16">
      <AdminLoginForm defaultEmail={getAdminEmail()} />
    </div>
  );
}
