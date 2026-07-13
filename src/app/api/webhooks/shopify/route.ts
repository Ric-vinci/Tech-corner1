import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { invalidateCollectionsCache } from "@/lib/shopify/collections";

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET ?? "";

export async function POST(request: Request) {
  if (WEBHOOK_SECRET) {
    const hmac = request.headers.get("x-shopify-hmac-sha256");
    if (!hmac) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const topic = request.headers.get("x-shopify-topic") ?? "";

  try {
    const body = await request.json();

    if (topic.includes("products") || topic.includes("collections")) {
      invalidateCollectionsCache();
      revalidatePath("/sell-my/mobile/[brand]", "page");
      revalidatePath("/sell-my/mobile", "page");
      revalidatePath("/buy-used/[...slug]", "page");
      revalidatePath("/");
    }

    if (body?.handle) {
      revalidatePath(`/sell-my/${body.handle}.html`);
      revalidatePath(`/buy-used/${body.handle}.html`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhook] shopify error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
