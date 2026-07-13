import Link from "next/link";
import type { FilterGroup } from "@/data/types";

export default function FilterSidebar({ groups }: { groups: FilterGroup[] }) {
  if (!groups.length) return null;

  return (
    <aside className="catalog-sidebar">
      <div className="rounded-2xl border border-grey-light bg-pure-white p-5">
        <h2 className="mb-4 font-heading text-base font-semibold">Shop By</h2>
        {groups.map((group) => (
          <div key={group.title} className="mb-5 last:mb-0">
            <h3 className="mb-2 text-sm font-medium text-grey-dark">{group.title}</h3>
            <ul className="space-y-1.5">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="block py-1 text-sm transition hover:text-mode-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
