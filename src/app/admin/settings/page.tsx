import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";

export const metadata = { title: "Settings — 4gadgets Admin" };

const has = (...keys: string[]) => keys.every((k) => Boolean(process.env[k]));

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-green" : "bg-grey-light"}`} />;
}

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const integrations = [
    { name: "Shopify Admin API", ok: has("SHOPIFY_ADMIN_ACCESS_TOKEN", "SHOPIFY_STORE_DOMAIN"), detail: "Catalogue reads, product creation, gift cards." },
    { name: "Shopify Storefront API", ok: has("SHOPIFY_STOREFRONT_ACCESS_TOKEN"), detail: "Public catalogue reads for the storefront." },
    { name: "Supabase", ok: has("SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_URL"), detail: "Trade-in submissions, events, customers." },
    { name: "Email (SMTP)", ok: has("SMTP_HOST", "SMTP_USER"), detail: "Customer confirmation & status emails." },
    { name: "PayPal Payouts", ok: has("PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"), detail: "Automated trade-in payouts." },
    { name: "PayPal webhook", ok: has("PAYPAL_WEBHOOK_ID"), detail: "Verified async payout settlement." },
  ];

  const settings = [
    { label: "Store-credit bonus", value: `£${process.env.NEXT_PUBLIC_TRADE_IN_STORE_CREDIT_BONUS ?? "15"}`, note: "Added at checkout for store-credit payouts." },
    { label: "Refurb default markup", value: `${process.env.REFURB_DEFAULT_MARKUP_PCT ?? "30"}% or +£${process.env.REFURB_DEFAULT_GBP ?? "10"}`, note: "Applied to cost when a unit is accepted." },
    { label: "PayPal environment", value: process.env.PAYPAL_ENV === "live" ? "Live" : "Sandbox", note: process.env.PAYPAL_ENV === "live" ? "Real payouts." : "Payouts redirect to the sandbox receiver." },
    { label: "Static catalogue fallback", value: process.env.SHOPIFY_USE_STATIC_FALLBACK === "true" ? "On" : "Off", note: "Serve bundled JSON when Shopify is unavailable." },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-grey-dark">
          Integration status and business rules. Values are set via environment variables — signed in as{" "}
          <span className="font-medium text-black">{session.email}</span>.
        </p>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Integrations</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {integrations.map((i) => (
            <div key={i.name} className="flex items-start gap-3 rounded-2xl border border-grey-light bg-pure-white p-4">
              <StatusDot ok={i.ok} />
              <div>
                <div className="font-medium text-black">{i.name}</div>
                <div className="text-xs text-grey-dark">{i.detail}</div>
                <div className={`mt-1 text-xs font-medium ${i.ok ? "text-green" : "text-grey-dark"}`}>
                  {i.ok ? "Connected" : "Not configured"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Business rules</h2>
        <div className="overflow-hidden rounded-2xl border border-grey-light bg-pure-white">
          <table className="min-w-full text-sm">
            <tbody>
              {settings.map((s) => (
                <tr key={s.label} className="border-b border-grey-light last:border-0">
                  <td className="px-5 py-4 font-medium text-black">{s.label}</td>
                  <td className="px-3 py-4 tabular-nums">{s.value}</td>
                  <td className="px-5 py-4 text-xs text-grey-dark">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-grey-dark">
          To change these, edit <code>.env.local</code> and restart the server. Secrets are never shown here.
        </p>
      </div>
    </div>
  );
}
