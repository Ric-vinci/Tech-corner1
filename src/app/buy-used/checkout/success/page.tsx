/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import StoreShell from "@/components/layout/StoreShell";
import { getCustomerSession } from "@/lib/customer/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { bankDetails, bankReference } from "@/lib/buy-payment/bank";

export const metadata = { title: "Order Confirmed — 4gadgets" };

type Props = { searchParams: Promise<{ ref?: string }> };

const money = (v: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(v);
const orderNumber = (id: string) => id.replace(/-/g, "").slice(0, 6).toUpperCase();

type BuyOrder = {
  id: string;
  total: number;
  paymentMethod: string | null;
  paymentStatus: string | null;
  items: { productName: string; image: string; colour: string | null; storage: string | null; grade: string | null; price: number; quantity: number }[];
};

async function loadOrder(id: string | undefined): Promise<BuyOrder | null> {
  if (!id) return null;
  const session = await getCustomerSession();
  if (!session?.email) return null;
  const { data } = await getSupabaseAdmin()
    .from("buy_orders")
    .select("id,total,items,customer_email,payment_method,payment_status")
    .eq("id", id)
    .single();
  if (!data || data.customer_email !== session.email) return null;
  return {
    id: data.id,
    total: Number(data.total),
    paymentMethod: data.payment_method ?? null,
    paymentStatus: data.payment_status ?? null,
    items: (data.items ?? []) as BuyOrder["items"],
  };
}

const NEXT_STEPS = [
  { title: "1. Order Confirmed", text: "We've received your order and payment details. A confirmation email is on its way." },
  { title: "2. Dispatched", text: "Your device is picked, tested once more and dispatched — free next-day delivery on orders before 3pm." },
  { title: "3. Delivered", text: "Enjoy your refurbished device, covered by a 12-month warranty and 30-day free returns." },
];

export default async function BuyCheckoutSuccessPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  const order = await loadOrder(ref);
  const reference = order ? orderNumber(order.id) : ref ? orderNumber(ref) : null;

  return (
    <StoreShell store="buy" variant="checkout">
      <main id="maincontent" className="page-main checkout-success">
        <div className="container relative z-10 py-6 md:py-10">
          <div className="bg-blue rounded-lg px-4 pt-16 pb-16 md:p-10 flex flex-col md:flex-row text-center md:text-left relative overflow-hidden">
            <div className="absolute z-0 bottom-0 left-0 h-full w-full md:w-auto flex items-stretch pointer-events-none">
              <img src="/images/confetti-blue.gif" alt="" width={500} height={500} />
            </div>

            <div className="md:w-1/2 md:p-8 text-white relative z-10">
              <img className="mx-auto md:mx-0 md:-mt-4 md:-ml-4" src="/images/tick-blue-once.gif" alt="" width={100} height={100} />
              <div className="text-3xl md:text-4xl font-semibold mt-auto">Order Confirmed!</div>
              {reference && (
                <div className="mt-4 text-lg font-medium">Your order number is <span className="font-bold">#{reference}</span></div>
              )}
              <div className="mt-4 text-lg md:text-base opacity-75">
                Thanks for shopping with us — your order details are {order ? "to the right" : "on their way by email"}.
              </div>
              <div className="mt-4">
                <Link href="/buy-used/mobile-phones" className="btn btn-tertiary">Continue Shopping</Link>
              </div>
            </div>

            {order && (
              <div className="w-full md:w-1/2 pt-8 md:p-8 relative z-10">
                <div className="bg-white rounded-2xl p-6 md:p-8 text-left">
                  <div className="text-2xl font-medium">Your order</div>
                  {order.items.map((it, i) => (
                    <div key={i} className="border-t mt-4 pt-4 flex items-center">
                      <div className="w-12 shrink-0">
                        {it.image ? <img src={it.image} alt="" className="w-full object-contain" /> : <div className="w-12 h-12 rounded bg-grey-lighter" />}
                      </div>
                      <div className="pl-4 flex-1 min-w-0">
                        <div className="truncate">{it.productName}</div>
                        <div className="text-xs text-grey-dark">{[it.colour, it.grade, it.storage].filter(Boolean).join(" · ")}{it.quantity > 1 ? ` ×${it.quantity}` : ""}</div>
                      </div>
                      <div className="ml-auto pl-4 font-bold">{money(it.price * it.quantity)}</div>
                    </div>
                  ))}
                  <div className="border-t mt-4 pt-4 flex justify-between font-semibold">
                    <span>Order Total</span><span>{money(order.total)}</span>
                  </div>

                  {/* Payment status / bank transfer instructions */}
                  {order.paymentMethod === "bank" ? (
                    <div className="mt-4 rounded-xl bg-grey-lightest p-4 text-sm">
                      <p className="font-medium text-black">Pay by bank transfer</p>
                      <p className="mt-1 text-grey-dark">Please transfer <strong>{money(order.total)}</strong>, quoting reference <strong>{bankReference(order.id)}</strong>. We&apos;ll dispatch once it clears.</p>
                      <dl className="mt-2 space-y-0.5 text-grey-dark">
                        <div className="flex justify-between"><dt>Account name</dt><dd className="font-medium text-black">{bankDetails().accountName}</dd></div>
                        <div className="flex justify-between"><dt>Sort code</dt><dd className="font-medium text-black">{bankDetails().sortCode}</dd></div>
                        <div className="flex justify-between"><dt>Account number</dt><dd className="font-medium text-black">{bankDetails().accountNumber}</dd></div>
                      </dl>
                    </div>
                  ) : (
                    <div className={`mt-4 rounded-xl p-3 text-sm font-medium ${order.paymentStatus === "paid" ? "bg-green-light text-green" : "bg-amber-50 text-amber-700"}`}>
                      {order.paymentStatus === "paid"
                        ? `Payment received${order.paymentMethod === "gift_card" ? " — paid with gift card" : order.paymentMethod === "paypal" ? " via PayPal" : ""}. ✓`
                        : "Awaiting payment confirmation."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl shadow-sm bg-white p-6 lg:p-12 mt-6">
            <div className="font-medium text-lg">What happens next?</div>
            <div className="flex flex-col md:flex-row items-stretch mt-6 -mx-2">
              {NEXT_STEPS.map(({ title, text }) => (
                <div key={title} className="flex items-start basis-0 flex-grow p-2">
                  <div className="rounded-full bg-blue/10 basis-11 w-11 h-11 shrink-0 flex items-center justify-center text-blue font-bold">{title[0]}</div>
                  <div className="ml-4 basis-0 flex-grow">
                    <div className="text-lg">{title}</div>
                    <div className="text-sm text-grey-dark">{text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </StoreShell>
  );
}
