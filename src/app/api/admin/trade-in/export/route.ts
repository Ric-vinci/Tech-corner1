import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { readBankDetails } from "@/lib/payout";
import type { TradeInSubmission } from "@/lib/trade-in/types";

/** Escape a value for CSV (quotes doubled, field wrapped when needed). */
function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Bank payment batch: every accepted, unpaid, bank-transfer submission.
 *
 * Upload the file to your bank's bulk-payment screen, then mark each row paid in
 * the admin. This is what makes the manual bank rail workable at volume — one
 * upload pays everyone, rather than one transfer per customer.
 */
export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("trade_in_submissions")
    .select("*")
    .eq("status", "accepted")
    .is("payout_reference", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[export] load failed:", error);
    return NextResponse.json({ error: "Could not build the batch." }, { status: 500 });
  }

  const rows = ((data ?? []) as TradeInSubmission[]).filter((row) =>
    row.payment_method.toLowerCase().includes("bank"),
  );

  const header = ["submission_id", "payee_name", "sort_code", "account_number", "amount_gbp", "reference", "product"];
  const lines = [header.join(",")];

  for (const row of rows) {
    const bank = readBankDetails(row.payout_details);
    const amount = Number(row.revised_price ?? row.quoted_price ?? 0).toFixed(2);
    lines.push(
      [
        row.id,
        bank.accountName ?? row.customer_name ?? "",
        bank.sortCode ?? "",
        bank.accountNumber ?? "",
        amount,
        // Short, human-readable reference the customer will see on their statement.
        `4GADGETS-${row.id.slice(0, 8).toUpperCase()}`,
        row.product_name,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bank-payouts-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
