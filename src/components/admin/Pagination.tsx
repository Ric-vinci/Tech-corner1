import Link from "next/link";

/**
 * Numbered page navigation. Shows first/last, the current page's neighbours, and
 * … gaps — so it stays compact whether there are 3 pages or 300.
 */
export default function Pagination({
  basePath,
  page,
  totalPages,
  params = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  /** Extra query params to preserve (category, q, status…). */
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  // Build the window of page numbers with … gaps.
  const pages: (number | "…")[] = [];
  const push = (p: number) => pages.push(p);
  const window = 1; // neighbours on each side of the current page
  const candidates = new Set<number>([1, totalPages, page]);
  for (let i = 1; i <= window; i++) {
    candidates.add(page - i);
    candidates.add(page + i);
  }
  const sorted = [...candidates].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) pages.push("…");
    push(p);
    prev = p;
  }

  const cell =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition";

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <Link
        href={href(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`${cell} border border-grey-light ${page === 1 ? "pointer-events-none opacity-40" : "hover:border-grey-dark"}`}
      >
        ← Prev
      </Link>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-grey-dark">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${cell} ${p === page ? "bg-black text-pure-white" : "border border-grey-light text-grey-dark hover:border-grey-dark hover:text-black"}`}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        href={href(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={`${cell} border border-grey-light ${page === totalPages ? "pointer-events-none opacity-40" : "hover:border-grey-dark"}`}
      >
        Next →
      </Link>
    </nav>
  );
}
