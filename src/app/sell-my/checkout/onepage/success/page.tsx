/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import StoreShell from "@/components/layout/StoreShell";
import { getCustomerSession } from "@/lib/customer/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { fetchSellProductFromShopify } from "@/lib/shopify/catalog";
import type { TradeInSubmission } from "@/lib/trade-in/types";

export const metadata = { title: "Trade In Confirmed — 4gadgets" };

type Props = {
  searchParams: Promise<{ refs?: string }>;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);

/** Submission ids are uuids; show a short, stable reference as the order number. */
const orderNumber = (id: string) => id.replace(/-/g, "").slice(0, 6).toUpperCase();

const titleCase = (value: string) =>
  value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());

function GetSalesPackIcon() {
  return (
    <svg className="block m-auto" width="29" height="15" viewBox="0 0 29 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20.1703 8.33826L19.7085 8.99148L20.1703 9.31802L20.6322 8.99148L20.1703 8.33826ZM8.60369 3.29679C9.04552 3.29679 9.40369 2.93861 9.40369 2.49679C9.40369 2.05496 9.04552 1.69679 8.60369 1.69679L8.60369 3.29679ZM6.43495 1.69679C5.99312 1.69679 5.63495 2.05496 5.63495 2.49679C5.63495 2.93861 5.99312 3.29679 6.43495 3.29679V1.69679ZM8.60369 8.40807C9.04552 8.40807 9.40369 8.0499 9.40369 7.60807C9.40369 7.16625 9.04552 6.80807 8.60369 6.80807V8.40807ZM1.59961 6.80807C1.15778 6.80807 0.799609 7.16625 0.799609 7.60807C0.799609 8.0499 1.15778 8.40807 1.59961 8.40807V6.80807ZM8.60369 13.5194C9.04552 13.5194 9.40369 13.1612 9.40369 12.7194C9.40369 12.2775 9.04552 11.9194 8.60369 11.9194V13.5194ZM4.25939 11.9194C3.81756 11.9194 3.45939 12.2775 3.45939 12.7194C3.45939 13.1612 3.81756 13.5194 4.25939 13.5194V11.9194ZM14.387 2.5666H25.9536V0.966602H14.387V2.5666ZM25.9536 2.5666C26.2995 2.5666 26.5995 2.85803 26.5995 3.22697H28.1995C28.1995 1.98951 27.1982 0.966602 25.9536 0.966602V2.5666ZM26.5995 3.22697V11.9892H28.1995V3.22697H26.5995ZM26.5995 11.9892C26.5995 12.3581 26.2995 12.6495 25.9536 12.6495V14.2495C27.1982 14.2495 28.1995 13.2266 28.1995 11.9892H26.5995ZM25.9536 12.6495H14.387V14.2495H25.9536V12.6495ZM14.387 12.6495C14.0412 12.6495 13.7412 12.3581 13.7412 11.9892H12.1412C12.1412 13.2266 13.1424 14.2495 14.387 14.2495V12.6495ZM13.7412 11.9892V3.22697H12.1412V11.9892H13.7412ZM13.7412 3.22697C13.7412 2.85803 14.0412 2.5666 14.387 2.5666V0.966602C13.1424 0.966602 12.1412 1.98951 12.1412 3.22697H13.7412ZM26.9376 2.57375L19.7085 7.68504L20.6322 8.99148L27.8613 3.88019L26.9376 2.57375ZM20.6322 7.68504L13.403 2.57375L12.4793 3.88019L19.7085 8.99148L20.6322 7.68504ZM8.60369 1.69679L6.43495 1.69679V3.29679L8.60369 3.29679L8.60369 1.69679ZM8.60369 6.80807H1.59961V8.40807H8.60369V6.80807ZM8.60369 11.9194H4.25939V13.5194H8.60369V11.9194Z"
        fill="#1EB16D"
      />
    </svg>
  );
}

function PostDeviceIcon() {
  return (
    <svg className="block m-auto" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.1877 0.810822L17.9428 1.0751C18.0443 0.785032 17.9707 0.462446 17.7534 0.245136C17.5361 0.0278258 17.2135 -0.0457895 16.9234 0.0557348L17.1877 0.810822ZM11.5022 17.0552L10.7711 17.3801C10.9044 17.6798 11.2071 17.8679 11.5348 17.8545C11.8625 17.8411 12.1489 17.629 12.2573 17.3194L11.5022 17.0552ZM0.943359 6.49634L0.679079 5.74126C0.369479 5.84962 0.157395 6.13599 0.144024 6.46373C0.130653 6.79147 0.318704 7.09417 0.618449 7.22739L0.943359 6.49634ZM16.622 0.245136L7.68763 9.17953L8.819 10.3109L17.7534 1.37651L16.622 0.245136ZM16.4326 0.546541L10.7471 16.7909L12.2573 17.3194L17.9428 1.0751L16.4326 0.546541ZM12.2332 16.7303L8.98436 9.4203L7.52227 10.0701L10.7711 17.3801L12.2332 16.7303ZM8.57823 9.01416L1.26827 5.76529L0.618449 7.22739L7.9284 10.4763L8.57823 9.01416ZM1.20764 7.25143L17.452 1.56591L16.9234 0.0557348L0.679079 5.74126L1.20764 7.25143Z"
        fill="#1EB16D"
      />
    </svg>
  );
}

function GetPaidIcon() {
  return (
    <svg className="block m-auto" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.26 8.52h14.27a4.2 4.2 0 0 1 4.2 4.2v4.81a4.2 4.2 0 0 1-4.2 4.2H5.46a4.2 4.2 0 0 1-4.2-4.2V8.52Z"
        stroke="#1EB16D"
        strokeWidth="1.6"
      />
      <circle cx="16.2" cy="15.1" r="1.5" fill="#1EB16D" />
      <path d="M4.2 8.1 14.6 2.2" stroke="#1EB16D" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const NEXT_STEPS = [
  {
    Icon: GetSalesPackIcon,
    title: "1. Get A Sales Pack",
    text: "Get your pack on the same day or print our free postage labels yourself.",
  },
  {
    Icon: PostDeviceIcon,
    title: "2. Post Your Device",
    text: "Send us your device in any condition using our pre-paid postage or ship it yourself.",
  },
  {
    Icon: GetPaidIcon,
    title: "3. Get Paid!",
    text: "Receive your payment fast and easily. This usually takes 2 days.",
  },
];

/** Only ever show submissions belonging to the signed-in customer. */
async function loadSubmissions(ids: string[]): Promise<TradeInSubmission[]> {
  if (!ids.length) return [];
  const session = await getCustomerSession();
  if (!session?.email) return [];

  const { data } = await getSupabaseAdmin().from("trade_in_submissions").select("*").in("id", ids);
  const rows = (data ?? []) as TradeInSubmission[];
  return rows.filter((row) => row.customer_email === session.email);
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { refs } = await searchParams;
  const ids = refs?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  const submissions = await loadSubmissions(ids);

  const images = await Promise.all(
    submissions.map(async (row) => {
      if (!row.product_slug) return null;
      try {
        const product = await fetchSellProductFromShopify(row.product_slug);
        return product?.image ?? null;
      } catch {
        return null;
      }
    }),
  );

  const total = submissions.reduce(
    (sum, row) => sum + Number(row.revised_price ?? row.quoted_price ?? 0),
    0,
  );
  const reference = submissions[0] ? orderNumber(submissions[0].id) : null;

  const details = (
    <div className="bg-white rounded-2xl p-6 md:p-8 text-left">
      <div className="text-2xl font-medium">Thanks for trading in your device</div>
      <div className="mt-4 text-grey-dark">
        The <span className="font-semibold">{money(total)}</span> will be sent to your account once
        we&apos;ve received your device.
      </div>

      {submissions.map((row, index) => (
        <div key={row.id} className="border-t mt-4 pt-4 flex">
          <div className="flex items-center">
            <div className="w-12 shrink-0">
              {images[index] ? (
                <img src={images[index]!} alt="" className="w-full" loading="lazy" />
              ) : (
                <div className="w-12 h-12 rounded bg-grey-lighter" />
              )}
            </div>
            <div className="pl-4">
              <div>{row.product_name}</div>
              <div className="text-xs text-grey-dark">We&apos;ll pay you</div>
              <div className="text-green font-bold">
                {money(Number(row.revised_price ?? row.quoted_price ?? 0))}
              </div>
            </div>
          </div>
          <div className="ml-auto pl-4">
            <ul className="tick-list flex flex-col text-sm">
              <li className="m-0">{titleCase(row.condition)}</li>
              <li className="m-0">Payment by {titleCase(row.payment_method)}</li>
            </ul>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <StoreShell store="sell" variant="checkout">
      <main id="maincontent" className="page-main checkout-success">
        <div className="container relative z-10 py-6 md:py-10">
          <div className="bg-blue rounded-lg px-4 pt-16 pb-16 md:p-10 flex flex-col md:flex-row text-center md:text-left relative overflow-hidden">
            <div className="absolute z-0 bottom-0 left-0 h-full w-full md:w-auto flex items-stretch pointer-events-none">
              <img src="/images/confetti-blue.gif" alt="" width={500} height={500} />
            </div>
            <div className="absolute z-0 bottom-0 right-0 h-full items-stretch hidden lg:flex pointer-events-none">
              <img src="/images/confetti-blue.gif" alt="" width={500} height={500} />
            </div>

            <div className="md:w-1/2 md:p-8 text-white relative z-10">
              <div className="relative z-10">
                <img
                  className="mx-auto md:mx-0 md:-mt-4 md:-ml-4"
                  src="/images/tick-blue-once.gif"
                  alt=""
                  width={100}
                  height={100}
                />
              </div>
              <div className="text-3xl md:text-4xl font-semibold mt-auto">Trade In Confirmed!</div>
              {reference && (
                <div className="mt-4 text-lg font-medium">
                  Your order number is <span className="font-bold">#{reference}</span>
                </div>
              )}
              <div className="hidden md:block mt-4 text-lg md:text-base opacity-75">
                Thank you for trading in with us, your trade in details can be found to the right.
              </div>
              <div className="md:hidden mt-4 text-lg md:text-base opacity-75">
                Thank you for trading in with us, your trade in details can be found below.
              </div>
              <div className="mt-4">
                <Link href="/sell-my/sales/order/history" className="btn btn-tertiary">
                  Track my Order
                </Link>
              </div>
            </div>

            <div className="w-full md:w-1/2 pt-8 md:p-8 relative z-10">{details}</div>
          </div>

          <div className="rounded-2xl shadow-sm bg-white p-6 lg:p-12 mt-6">
            <div className="hidden md:block font-medium text-lg">
              What Happens Next With My Trade In?
            </div>
            <div className="md:hidden font-medium text-lg">What Happens Next?</div>

            <div className="flex flex-col md:flex-row items-stretch mt-6 -mx-2">
              {NEXT_STEPS.map(({ Icon, title, text }) => (
                <div key={title} className="flex items-start basis-0 flex-grow p-2">
                  <div className="rounded-full bg-green-light basis-11 w-11 h-11 shrink-0 flex">
                    <Icon />
                  </div>
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
