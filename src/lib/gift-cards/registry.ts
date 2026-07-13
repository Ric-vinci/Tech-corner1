import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Gift-card code registry. We HMAC each issued code with a server secret and
 * store only the hash, so:
 *   - a leaked DB can't reveal codes and can't be brute-forced without the secret;
 *   - redemption is an O(1) indexed lookup by hash (the customer proves possession
 *     by typing the code, like a password).
 */
function hashSecret(): string {
  return process.env.GIFT_CARD_HASH_SECRET || process.env.ADMIN_SESSION_SECRET || "tc3-gift-card-fallback-secret";
}

/** Deterministic HMAC of a normalised code (uppercased, stripped of spaces/dashes). */
export function hashGiftCode(code: string): string {
  const normalised = code.replace(/[\s-]/g, "").toUpperCase();
  return createHmac("sha256", hashSecret()).update(normalised).digest("hex");
}

/** Record a gift card we just issued so its one-time code can later be redeemed. */
export async function recordIssuedGiftCard(input: {
  gid: string;
  code: string;
  last4?: string | null;
  customerId?: string | null;
  submissionId?: string | null;
  amount?: number | null;
}): Promise<void> {
  try {
    await getSupabaseAdmin()
      .from("gift_cards")
      .upsert(
        {
          gid: input.gid,
          code_hash: hashGiftCode(input.code),
          last4: input.last4 ?? input.code.replace(/[\s-]/g, "").slice(-4),
          customer_id: input.customerId ?? null,
          submission_id: input.submissionId ?? null,
          initial_amount: input.amount ?? null,
        },
        { onConflict: "gid" },
      );
  } catch (err) {
    // Non-fatal: the payout itself already succeeded. Log for reconciliation.
    console.error("[gift-cards] recordIssuedGiftCard failed:", err);
  }
}

/** Resolve a typed code to the gift card's gid (or null). Constant-time on the hash. */
export async function findGiftCardGidByCode(code: string): Promise<string | null> {
  const clean = code.replace(/[\s-]/g, "");
  if (clean.length < 4) return null;
  const hash = hashGiftCode(code);
  try {
    const { data } = await getSupabaseAdmin().from("gift_cards").select("gid, code_hash").eq("code_hash", hash).limit(1).maybeSingle();
    if (!data) return null;
    // Defensive constant-time compare (the indexed eq already matched, but avoid
    // any chance of a non-exact match slipping through).
    const a = Buffer.from(hash);
    const b = Buffer.from(data.code_hash);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return data.gid;
  } catch {
    return null;
  }
}
