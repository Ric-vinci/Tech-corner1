"use client";

import type { ReactNode } from "react";
import CustomerAccountNav, { type AccountNavKey } from "@/components/customer/CustomerAccountNav";

type Props = {
  active: AccountNavKey;
  children: ReactNode;
};

export default function CustomerAccountLayout({ active, children }: Props) {
  async function handleSignOut() {
    await fetch("/api/customer/logout", { method: "POST" });
    window.location.href = "/sell-my";
  }

  return (
    <div className="columns">
      <CustomerAccountNav active={active} onSignOut={handleSignOut} />
      <div className="column main">{children}</div>
    </div>
  );
}
