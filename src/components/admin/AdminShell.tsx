import type { ReactNode } from "react";
import AdminNav from "@/components/admin/AdminNav";
import SignOutButton from "@/components/admin/SignOutButton";

function LogoMark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green font-heading text-xs font-extrabold text-pure-white">
      TC
    </span>
  );
}

type Props = {
  email: string;
  children: ReactNode;
};

export default function AdminShell({ email, children }: Props) {
  return (
    <div className="min-h-screen bg-grey-lightest lg:flex">
      {/* Sidebar */}
      <aside className="shrink-0 bg-black text-pure-white lg:sticky lg:top-0 lg:h-screen lg:w-64">
        <div className="flex items-center gap-3 px-5 py-5">
          <LogoMark />
          <div className="leading-tight">
            <div className="font-heading text-sm font-semibold">Tech Corner</div>
            <div className="text-xs text-grey-light/70">Trade-in admin</div>
          </div>
        </div>

        <AdminNav />
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-grey-light bg-pure-white/85 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-5 py-3 lg:px-8">
            <span className="text-sm text-grey-dark">
              Signed in as <span className="font-medium text-black">{email}</span>
            </span>
            <SignOutButton />
          </div>
        </header>

        <main className="px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
