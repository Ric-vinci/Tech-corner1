import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { setRefurbPrice, setRefurbLive } from "@/lib/shopify/admin-inventory";

type RouteContext = { params: Promise<{ id: string }> };

type Body = {
  /** Shopify variant gid — required to change price. */
  variantId?: string;
  price?: number | string;
  live?: boolean;
};

/** Update one refurb unit: set its resale price and/or publish it to the storefront. */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const productId = decodeURIComponent(id);
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (body.price !== undefined && body.variantId) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: "Price must be zero or more." }, { status: 400 });
      }
      await setRefurbPrice(productId, body.variantId, Number(price.toFixed(2)));
    }

    if (body.live !== undefined) {
      await setRefurbLive(productId, body.live);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/inventory] update failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    );
  }
}
