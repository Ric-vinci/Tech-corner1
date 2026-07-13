import Link from "next/link";
import {
  formatGbp,
  formatOrderDate,
  formatOrderNumber,
  formatOrderStatus,
} from "@/components/customer/customer-ui";
import type { TradeInSubmission } from "@/lib/trade-in/types";

type Props = {
  submissions: TradeInSubmission[];
};

const OrdersHeadingIcon = () => (
  <svg
    width="19"
    height="21"
    viewBox="0 0 19 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="stroke-transparent fill-current w-5 h-5 mr-2"
  >
    <path d="M3.81482 1V0.25C3.57718 0.25 3.3536 0.362622 3.21215 0.553579L3.81482 1ZM1 4.8L0.397332 4.35358C0.301649 4.48275 0.25 4.63925 0.25 4.8H1ZM1 18.1H0.25H1ZM17.8889 4.8H18.6389C18.6389 4.63925 18.5872 4.48275 18.4916 4.35358L17.8889 4.8ZM15.0741 1L15.6767 0.553579C15.5353 0.362622 15.3117 0.25 15.0741 0.25V1ZM13.9475 8.6C13.9475 8.18579 13.6117 7.85 13.1975 7.85C12.7833 7.85 12.4475 8.18579 12.4475 8.6H13.9475ZM9.44444 12.4V13.15V12.4ZM6.44136 8.6C6.44136 8.18579 6.10557 7.85 5.69136 7.85C5.27714 7.85 4.94136 8.18579 4.94136 8.6H6.44136ZM3.21215 0.553579L0.397332 4.35358L1.60267 5.24642L4.41748 1.44642L3.21215 0.553579ZM0.25 4.8V18.1H1.75V4.8H0.25ZM0.25 18.1C0.25 18.7998 0.52449 19.4729 1.01601 19.9705L2.08324 18.9165C1.87092 18.7015 1.75 18.408 1.75 18.1H0.25ZM1.01601 19.9705C1.50785 20.4685 2.17691 20.75 2.87654 20.75V19.25C2.58079 19.25 2.29525 19.1311 2.08324 18.9165L1.01601 19.9705ZM2.87654 20.75H16.0123V19.25H2.87654V20.75ZM16.0123 20.75C16.712 20.75 17.381 20.4685 17.8729 19.9705L16.8056 18.9165C16.5936 19.1311 16.3081 19.25 16.0123 19.25V20.75ZM17.8729 19.9705C18.3644 19.4729 18.6389 18.7998 18.6389 18.1H17.1389C17.1389 18.408 17.018 18.7015 16.8056 18.9165L17.8729 19.9705ZM18.6389 18.1V4.8H17.1389V18.1H18.6389ZM18.4916 4.35358L15.6767 0.553579L14.4714 1.44642L17.2862 5.24642L18.4916 4.35358ZM15.0741 0.25H3.81482V1.75H15.0741V0.25ZM1 5.55H17.8889V4.05H1V5.55ZM12.4475 8.6C12.4475 9.4119 12.1289 10.1887 11.5647 10.76L12.6319 11.814C13.4753 10.96 13.9475 9.80375 13.9475 8.6H12.4475ZM11.5647 10.76C11.0007 11.331 10.2379 11.65 9.44444 11.65V13.15C10.6418 13.15 11.7881 12.6683 12.6319 11.814L11.5647 10.76ZM9.44444 11.65C8.651 11.65 7.88815 11.331 7.32423 10.76L6.257 11.814C7.10075 12.6683 8.24712 13.15 9.44444 13.15V11.65ZM7.32423 10.76C6.75999 10.1887 6.44136 9.4119 6.44136 8.6H4.94136C4.94136 9.80375 5.41355 10.96 6.257 11.814L7.32423 10.76Z" />
  </svg>
);

export default function CustomerOrdersPage({ submissions }: Props) {
  const count = submissions.length;

  return (
    <>
      <div className="hidden md:block bg-white rounded-lg p-5">
        <h1 className="text-2xl flex items-center">
          <OrdersHeadingIcon />
          My Orders
        </h1>
        <p className="mt-2 text-sm text-grey-dark" />
      </div>

      <Link
        href="/sell-my/customer/account"
        className="block md:hidden bg-white rounded-lg p-5 text-2xl font-medium flex items-center"
      >
        <svg width="23" height="20" viewBox="0 0 23 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current">
          <path d="M22 10.75C22.4142 10.75 22.75 10.4142 22.75 10C22.75 9.58579 22.4142 9.25 22 9.25L22 10.75ZM1 10L0.475165 9.46423C0.331157 9.6053 0.250001 9.79841 0.250001 10C0.250001 10.2016 0.331157 10.3947 0.475166 10.5358L1 10ZM9.66267 19.5358C9.95856 19.8256 10.4334 19.8207 10.7233 19.5248C11.0131 19.2289 11.0082 18.7541 10.7123 18.4642L9.66267 19.5358ZM10.7123 1.53577C11.0082 1.24591 11.0131 0.771066 10.7233 0.475167C10.4334 0.179271 9.95856 0.174377 9.66266 0.464234L10.7123 1.53577ZM22 9.25L1 9.25L1 10.75L22 10.75L22 9.25ZM10.7123 18.4642L1.52484 9.46423L0.475166 10.5358L9.66267 19.5358L10.7123 18.4642ZM1.52484 10.5358L10.7123 1.53577L9.66266 0.464234L0.475165 9.46423L1.52484 10.5358Z" />
        </svg>
        <span className="ml-4">My Orders</span>
      </Link>

      <div className="order-products-toolbar toolbar bottom mt-5">
        <div className="text-sm text-grey-dark my-4">
          {count === 0 ? "You have no orders yet." : `Displaying ${count}/${count} orders`}
        </div>
      </div>

      {!count ? (
        <div className="bg-white p-5 mt-5 rounded-lg shadow-sm text-grey-dark">
          You have not submitted any trade-ins yet.{" "}
          <Link href="/sell-my/mobile" className="underline">
            Start a trade-in
          </Link>
        </div>
      ) : (
        submissions.map((item) => {
          const orderNo = formatOrderNumber(item.id);
          return (
            <div key={item.id} className="bg-white p-5 mt-5 rounded-lg shadow-sm">
              <div>
                <span className="text-lg font-medium">Order no. {orderNo}</span>
              </div>

              <div className="grid grid-cols-7 grid-rows-3 lg:flex flex-wrap items-center pt-4 mt-4 border-t border-grey-light">
                <div className="p-2 pl-0 basis-36 flex-0 relative flex space-x-2 col-span-3 row-span-2">
                  <p className="text-sm text-grey-dark">{item.product_name}</p>
                </div>

                <div className="p-2 basis-auto flex-1 col-span-2 text-sm md:text-base">
                  <p className="text-xs text-grey-dark">Order total</p>
                  <span className="price">{formatGbp(item.quoted_price)}</span>
                </div>

                <div className="p-2 basis-auto flex-1 col-span-2 text-sm md:text-base">
                  <p className="text-xs text-grey-dark">Order date</p>
                  {formatOrderDate(item.created_at)}
                </div>

                <div className="p-2 basis-auto flex-1 col-span-2 text-sm md:text-base">
                  <p className="text-xs text-grey-dark">Status</p>
                  {formatOrderStatus(item.status)}
                </div>

                <div className="py-2 px-0 md:pl-2 basis-full md:basis-auto flex-1 xl:flex-0 flex space-x-2 col-span-7">
                  <span className="btn btn-secondary px-3 basis-0 flex-1 md:basis-auto md:flex-0 opacity-50 cursor-not-allowed" title="Return">
                    Return
                  </span>

                  <Link
                    href={`/sell-my/sales/order/view/${item.id}`}
                    className="btn btn-primary px-3 basis-0 flex-1 md:basis-auto md:flex-0 text-center"
                    title="View Order"
                  >
                    View Order
                  </Link>
                </div>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
