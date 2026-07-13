import Link from "next/link";
import {
  formatGbp,
  formatOrderDate,
  formatOrderNumber,
  formatOrderStatus,
} from "@/components/customer/customer-ui";
import CustomerAccountLayout from "@/components/customer/CustomerAccountLayout";
import StoreShell from "@/components/layout/StoreShell";
import { getCustomerTradeIns } from "@/lib/customer/get-customer";
import { requireCustomerAccount } from "@/lib/customer/require-account";
import { customerDisplayName, customerInitials } from "@/lib/customer/get-customer";
import { getStoreCreditBalance } from "@/lib/buy-payment/store-credit";

export const metadata = { title: "My Account — 4gadgets" };

export default async function CustomerAccountRoute() {
  const { session, customer } = await requireCustomerAccount("/sell-my/customer/account");
  const [submissions, storeCredit] = await Promise.all([
    getCustomerTradeIns(session.customerId, customer.email),
    getStoreCreditBalance(session.customerId).catch(() => 0),
  ]);
  const recentSubmissions = submissions.slice(0, 5);
  const displayName = customerDisplayName(customer);
  const initials = customerInitials(customer);

  return (
    <StoreShell store="sell">
      <main id="maincontent" className="page-main page-layout-2columns-left account customer-account-index">
        <CustomerAccountLayout active="overview">
          <div className="bg-white rounded-lg py-8 px-5 hidden md:flex items-center">
            <div className="mr-5">
              <div className="w-14 h-14 rounded-full bg-blue text-white flex items-center justify-center font-bold">
                {initials}
              </div>
            </div>
            <div>
              <div className="text-2xl font-medium">Hi, {displayName}</div>
              <p className="mt-1 text-grey-dark">
                Welcome to 4gadgets! Check your details are correct for your recent order, use the
                links below to answer any questions you have, or trade-in your old device by switching
                the toggle in the top right of the page.
              </p>
            </div>
          </div>

          {/* Store credit — trade-in payouts you can spend when buying */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-blue px-6 py-6 text-white">
            <div>
              <div className="text-sm opacity-80">Store credit balance</div>
              <div className="mt-1 text-4xl font-semibold">{formatGbp(storeCredit)}</div>
              <p className="mt-1 text-sm opacity-80">
                Earned from trade-in payouts. Spend it on a refurbished device at checkout — no code needed.
              </p>
            </div>
            <Link href="/buy-used/mobile-phones" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue transition hover:bg-white/90">
              Shop devices
            </Link>
          </div>

          <div className="mt-5 hidden md:flex space-x-5 text-center">
            <Link
              href="/sell-my/customer/account/edit"
              className="basis-0 flex-1 rounded-lg border border-grey-light py-12 px-6 block hover:border-blue"
            >
              <div>
                <svg
                  width="17"
                  height="20"
                  viewBox="0 0 17 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current fill-transparent w-8 h-8 inline-block"
                >
                  <circle cx="8.33408" cy="4.68955" r="3.68955" strokeWidth="1.5" strokeLinecap="round" />
                  <path
                    d="M15.8966 18.5255C15.8966 15.1378 12.5619 12.3916 8.44828 12.3916C4.33471 12.3916 1 15.1378 1 18.5255"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="mt-5">My Details</div>
              <div className="text-sm mt-2 text-grey-dark">Review your personal information.</div>
            </Link>

            <Link
              href="/sell-my/sales/order/history"
              className="basis-0 flex-1 rounded-lg border border-grey-light py-12 px-6 block hover:border-blue"
            >
              <div>
                <svg
                  width="19"
                  height="21"
                  viewBox="0 0 19 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-transparent fill-current w-8 h-8 inline-block"
                >
                  <path d="M3.81482 1V0.25C3.57718 0.25 3.3536 0.362622 3.21215 0.553579L3.81482 1ZM1 4.8L0.397332 4.35358C0.301649 4.48275 0.25 4.63925 0.25 4.8H1ZM1 18.1H0.25H1ZM17.8889 4.8H18.6389C18.6389 4.63925 18.5872 4.48275 18.4916 4.35358L17.8889 4.8ZM15.0741 1L15.6767 0.553579C15.5353 0.362622 15.3117 0.25 15.0741 0.25V1ZM13.9475 8.6C13.9475 8.18579 13.6117 7.85 13.1975 7.85C12.7833 7.85 12.4475 8.18579 12.4475 8.6H13.9475ZM9.44444 12.4V13.15V12.4ZM6.44136 8.6C6.44136 8.18579 6.10557 7.85 5.69136 7.85C5.27714 7.85 4.94136 8.18579 4.94136 8.6H6.44136ZM3.21215 0.553579L0.397332 4.35358L1.60267 5.24642L4.41748 1.44642L3.21215 0.553579ZM0.25 4.8V18.1H1.75V4.8H0.25ZM0.25 18.1C0.25 18.7998 0.52449 19.4729 1.01601 19.9705L2.08324 18.9165C1.87092 18.7015 1.75 18.408 1.75 18.1H0.25ZM1.01601 19.9705C1.50785 20.4685 2.17691 20.75 2.87654 20.75V19.25C2.58079 19.25 2.29525 19.1311 2.08324 18.9165L1.01601 19.9705ZM2.87654 20.75H16.0123V19.25H2.87654V20.75ZM16.0123 20.75C16.712 20.75 17.381 20.4685 17.8729 19.9705L16.8056 18.9165C16.5936 19.1311 16.3081 19.25 16.0123 19.25V20.75ZM17.8729 19.9705C18.3644 19.4729 18.6389 18.7998 18.6389 18.1H17.1389C17.1389 18.408 17.018 18.7015 16.8056 18.9165L17.8729 19.9705ZM18.6389 18.1V4.8H17.1389V18.1H18.6389ZM18.4916 4.35358L15.6767 0.553579L14.4714 1.44642L17.2862 5.24642L18.4916 4.35358ZM15.0741 0.25H3.81482V1.75H15.0741V0.25ZM1 5.55H17.8889V4.05H1V5.55ZM12.4475 8.6C12.4475 9.4119 12.1289 10.1887 11.5647 10.76L12.6319 11.814C13.4753 10.96 13.9475 9.80375 13.9475 8.6H12.4475ZM11.5647 10.76C11.0007 11.331 10.2379 11.65 9.44444 11.65V13.15C10.6418 13.15 11.7881 12.6683 12.6319 11.814L11.5647 10.76ZM9.44444 11.65C8.651 11.65 7.88815 11.331 7.32423 10.76L6.257 11.814C7.10075 12.6683 8.24712 13.15 9.44444 13.15V11.65ZM7.32423 10.76C6.75999 10.1887 6.44136 9.4119 6.44136 8.6H4.94136C4.94136 9.80375 5.41355 10.96 6.257 11.814L7.32423 10.76Z" />
                </svg>
              </div>
              <div className="mt-5">Orders &amp; Returns</div>
              <div className="text-sm mt-2 text-grey-dark">
                Check order status, make a return, or write a review.
              </div>
            </Link>
          </div>

          <div className="block-dashboard-orders mt-5 bg-white rounded-lg shadow-sm p-5">
            <div className="block-title order flex justify-between items-center">
              <span className="text-2xl block">Recent Orders</span>
              {submissions.length > 5 && (
                <Link className="action view inline-block underline" href="/sell-my/sales/order/history">
                  <span>View All Orders</span>
                </Link>
              )}
            </div>

            <div className="block-content border-t border-grey-light mt-5 pt-5">
              {!recentSubmissions.length ? (
                <p className="text-grey-dark">
                  You have not submitted any trade-ins yet.{" "}
                  <Link href="/sell-my/mobile" className="underline">
                    Start a trade-in
                  </Link>
                </p>
              ) : (
                recentSubmissions.map((item) => (
                  <div
                    key={item.id}
                    className="border-t border-grey first:border-t-0 flex flex-wrap items-center"
                  >
                    <div className="p-2 pl-0 basis-full md:basis-auto md:flex-1 min-w-[10rem]">
                      <p className="text-xs text-grey-dark">Order no.</p>
                      {formatOrderNumber(item.id)}
                    </div>
                    <div className="p-2 basis-full md:basis-auto md:flex-1 min-w-[8rem]">
                      <p className="text-xs text-grey-dark">Order total</p>
                      <span className="price">{formatGbp(item.quoted_price)}</span>
                    </div>
                    <div className="p-2 basis-full md:basis-auto md:flex-1 min-w-[8rem]">
                      <p className="text-xs text-grey-dark">Order date</p>
                      {formatOrderDate(item.created_at)}
                    </div>
                    <div className="p-2 basis-full md:basis-auto md:flex-1 min-w-[8rem]">
                      <p className="text-xs text-grey-dark">Status</p>
                      {formatOrderStatus(item.status)}
                    </div>
                    <div className="p-2 pr-0 basis-full md:basis-auto md:flex-0">
                      <Link
                        href={`/sell-my/sales/order/view/${item.id}`}
                        className="btn btn-primary inline-block"
                        title="View Details"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CustomerAccountLayout>
      </main>
    </StoreShell>
  );
}
