import Link from "next/link";
import { ADMIN_CATEGORIES } from "@/lib/admin/categories";

/**
 * Category (+ optional status) pills and a search box, as plain GET links/form so
 * the list stays server-rendered and paginated — the pattern that scales when the
 * catalogue grows to thousands of devices across five categories.
 */
export default function AdminFilterBar({
  basePath,
  category,
  status,
  search,
  showStatus = false,
}: {
  basePath: string;
  category?: string;
  status?: string;
  search?: string;
  showStatus?: boolean;
}) {
  const href = (params: Record<string, string | undefined>) => {
    const merged = { category, status, q: search, ...params };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) qs.set(k, v);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition ${
      active ? "bg-black text-pure-white" : "bg-grey-lighter text-grey-dark hover:bg-grey-light"
    }`;

  return (
    <div className="space-y-3 rounded-2xl border border-grey-light bg-pure-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium uppercase tracking-wide text-grey-dark">Category</span>
        <Link href={href({ category: undefined, after: undefined })} className={pill(!category)}>
          All
        </Link>
        {ADMIN_CATEGORIES.map((c) => (
          <Link key={c.key} href={href({ category: c.key, after: undefined })} className={pill(category === c.key)}>
            {c.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {showStatus && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-grey-dark">Status</span>
            <Link href={href({ status: undefined, after: undefined })} className={pill(!status)}>
              All
            </Link>
            <Link href={href({ status: "live", after: undefined })} className={pill(status === "live")}>
              Live
            </Link>
            <Link href={href({ status: "draft", after: undefined })} className={pill(status === "draft")}>
              Draft
            </Link>
          </div>
        )}

        <form method="GET" action={basePath} className="ml-auto flex items-center gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={search ?? ""}
            placeholder="Search device…"
            className="h-9 w-52 rounded-lg border border-grey-light bg-grey-lightest px-3 text-sm outline-none focus:border-black focus:bg-pure-white"
          />
          <button type="submit" className="h-9 rounded-lg border border-grey-light px-3 text-sm font-medium hover:border-grey-dark">
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
