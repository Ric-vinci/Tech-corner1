import "server-only";
import { adminRequest } from "@/lib/shopify/admin-client";

/**
 * Shopify only supports cursor pagination, but the admin wants numbered pages.
 * This resolves the `after` cursor for the start of an arbitrary page by walking
 * the (lightweight, cursor-only) product connection in 250-item chunks until it
 * reaches the page boundary. Page 1 needs no cursor.
 *
 * For page N that's ceil((N-1)·pageSize / 250) cheap queries — one for the first
 * ten 25-item pages, and it scales linearly for deeper pages.
 */
export async function afterCursorForPage(opts: {
  query: string;
  page: number;
  pageSize: number;
  sortKey: string;
  reverse?: boolean;
}): Promise<string | null> {
  if (opts.page <= 1) return null;

  const targetIndex = (opts.page - 1) * opts.pageSize - 1; // 0-based index of the last item on the previous page
  const CURSOR_QUERY = `
    query PageCursors($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys!, $reverse: Boolean!) {
      products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
        edges { cursor }
        pageInfo { hasNextPage }
      }
    }
  `;

  type CursorResponse = {
    products: { edges: { cursor: string }[]; pageInfo: { hasNextPage: boolean } };
  };

  let after: string | null = null;
  let collected = 0;
  let cursor: string | null = null;

  while (collected <= targetIndex) {
    const need = Math.min(250, targetIndex - collected + 1);
    const data: CursorResponse = await adminRequest<CursorResponse>(
      CURSOR_QUERY,
      { first: need, after, query: opts.query, sortKey: opts.sortKey, reverse: opts.reverse ?? false },
      { noStore: true },
    );

    const edges: { cursor: string }[] = data.products.edges;
    if (edges.length === 0) break;
    collected += edges.length;
    cursor = edges[edges.length - 1].cursor;
    after = cursor;
    if (!data.products.pageInfo.hasNextPage) break;
  }

  return cursor;
}

/** Total product count for a search query (for computing the number of pages). */
export async function countProducts(query: string): Promise<number> {
  const data = await adminRequest<{ productsCount: { count: number } }>(
    `query Count($query: String!) { productsCount(query: $query) { count } }`,
    { query },
    { noStore: true },
  );
  return data.productsCount.count;
}
