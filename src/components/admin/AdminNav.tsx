"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type NavItem = { href: string; label: string; icon: string; step?: number; match?: (path: string, qs: string) => boolean };
type NavSection = { title: string; hint?: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: "grid", match: (p) => p === "/admin" }],
  },
  {
    title: "Pipeline",
    hint: "A device moves down these steps",
    items: [
      { href: "/admin/trade-ins?queue=trade-in", label: "Trade-In Queue", icon: "inbox", step: 1, match: (p, qs) => p.startsWith("/admin/trade-ins") && qs.includes("queue=trade-in") },
      { href: "/admin/trade-ins?queue=inspection", label: "Inspection Queue", icon: "search", step: 2, match: (p, qs) => qs.includes("queue=inspection") },
      { href: "/admin/trade-ins?queue=refurbishment", label: "Refurbishment Queue", icon: "wrench", step: 3, match: (p, qs) => qs.includes("queue=refurbishment") },
      { href: "/admin/inventory?status=draft", label: "Ready for Sale", icon: "check", step: 4, match: (p, qs) => p.startsWith("/admin/inventory") && qs.includes("status=draft") },
      { href: "/admin/inventory?status=live", label: "Live on Store", icon: "cloud", step: 5, match: (p, qs) => p.startsWith("/admin/inventory") && qs.includes("status=live") },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "bag", match: (p) => p.startsWith("/admin/orders") },
      { href: "/admin/pricing", label: "Pricing", icon: "tag", match: (p) => p.startsWith("/admin/pricing") },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/customers", label: "Customers", icon: "users", match: (p) => p.startsWith("/admin/customers") },
      { href: "/admin/team", label: "Team", icon: "userPlus", match: (p) => p.startsWith("/admin/team") },
      { href: "/admin/reports", label: "Reports", icon: "chart", match: (p) => p.startsWith("/admin/reports") },
      { href: "/admin/settings", label: "Settings", icon: "gear", match: (p) => p.startsWith("/admin/settings") },
    ],
  },
];

const ICONS: Record<string, string> = {
  grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  inbox: "M4 13h4l2 3h4l2-3h4M4 13 6 5h12l2 8M4 13v6h16v-6",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm10 17-5-5",
  wrench: "M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2 2.5-2.5Z",
  check: "m5 13 4 4L19 7",
  cloud: "M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.5 3.5 0 0 1 17 18H7Z",
  tag: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z",
  bag: "M6 7h12l1 13H5L6 7Zm3 0a3 3 0 0 1 6 0",
  users: "M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  userPlus: "M15 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M8.5 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 8v6M22 11h-6",
  chart: "M4 20V10m6 10V4m6 16v-6",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3-2-.5.8-1.9-1.4-1.4-1.9.8L12 6l-.5-2h-2L9 6l-1.9-.8-1.4 1.4.8 1.9L4.5 10l-2 .5v2l2 .5-.8 1.9 1.4 1.4 1.9-.8.6 1.4.5 2h2l.5-2 1.9.8 1.4-1.4-.8-1.9 1.4-.6 2-.5v-2Z",
};

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
      <path d={ICONS[name] ?? ICONS.grid} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminNav() {
  const pathname = usePathname();
  const qs = useSearchParams().toString();

  return (
    <nav className="space-y-5 px-3 pb-5 lg:pb-0">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-grey-light/50">
            {section.title}
          </div>
          {section.hint && <div className="px-3 pb-1 text-[10px] text-grey-light/40">{section.hint}</div>}
          <div className="mt-1 space-y-1">
            {section.items.map((item) => {
              const active = item.match ? item.match(pathname, qs) : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? "bg-white/15 text-pure-white" : "text-grey-light/90 hover:bg-white/10 hover:text-pure-white"
                  }`}
                >
                  {item.step ? (
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${active ? "bg-white/25" : "bg-white/10"}`}>
                      {item.step}
                    </span>
                  ) : (
                    <Icon name={item.icon} />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
