"use client";

import Link from "next/link";

export type AccountNavKey = "overview" | "orders" | "details";

type Props = {
  active?: AccountNavKey;
  onSignOut?: () => void;
};

const OverviewIcon = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current stroke-transparent">
    <mask id="account-overview-icon" fill="white">
      <path d="M0 4.52381C0 2.02538 2.02538 0 4.52381 0H14.4762C16.9746 0 19 2.02538 19 4.52381V14.4762C19 16.9746 16.9746 19 14.4762 19H4.52381C2.02538 19 0 16.9746 0 14.4762V4.52381Z" />
    </mask>
    <path
      d="M8.75 0.452381V9.5H10.25V0.452381H8.75ZM8.75 9.5V18.5476H10.25V9.5H8.75ZM0.452381 10.25H9.5V8.75H0.452381V10.25ZM4.52381 1.5H14.4762V-1.5H4.52381V1.5ZM17.5 4.52381V14.4762H20.5V4.52381H17.5ZM14.4762 17.5H4.52381V20.5H14.4762V17.5ZM1.5 14.4762V4.52381H-1.5V14.4762H1.5ZM4.52381 17.5C2.85381 17.5 1.5 16.1462 1.5 14.4762H-1.5C-1.5 17.803 1.19695 20.5 4.52381 20.5V17.5ZM17.5 14.4762C17.5 16.1462 16.1462 17.5 14.4762 17.5V20.5C17.803 20.5 20.5 17.803 20.5 14.4762H17.5ZM14.4762 1.5C16.1462 1.5 17.5 2.85381 17.5 4.52381H20.5C20.5 1.19695 17.803 -1.5 14.4762 -1.5V1.5ZM4.52381 -1.5C1.19695 -1.5 -1.5 1.19695 -1.5 4.52381H1.5C1.5 2.85381 2.85381 1.5 4.52381 1.5V-1.5Z"
      mask="url(#account-overview-icon)"
    />
  </svg>
);

const OrdersIcon = () => (
  <svg width="19" height="21" viewBox="0 0 19 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-transparent fill-current">
    <path d="M3.81482 1V0.25C3.57718 0.25 3.3536 0.362622 3.21215 0.553579L3.81482 1ZM1 4.8L0.397332 4.35358C0.301649 4.48275 0.25 4.63925 0.25 4.8H1ZM1 18.1H0.25H1ZM17.8889 4.8H18.6389C18.6389 4.63925 18.5872 4.48275 18.4916 4.35358L17.8889 4.8ZM15.0741 1L15.6767 0.553579C15.5353 0.362622 15.3117 0.25 15.0741 0.25V1ZM13.9475 8.6C13.9475 8.18579 13.6117 7.85 13.1975 7.85C12.7833 7.85 12.4475 8.18579 12.4475 8.6H13.9475ZM9.44444 12.4V13.15V12.4ZM6.44136 8.6C6.44136 8.18579 6.10557 7.85 5.69136 7.85C5.27714 7.85 4.94136 8.18579 4.94136 8.6H6.44136ZM3.21215 0.553579L0.397332 4.35358L1.60267 5.24642L4.41748 1.44642L3.21215 0.553579ZM0.25 4.8V18.1H1.75V4.8H0.25ZM0.25 18.1C0.25 18.7998 0.52449 19.4729 1.01601 19.9705L2.08324 18.9165C1.87092 18.7015 1.75 18.408 1.75 18.1H0.25ZM1.01601 19.9705C1.50785 20.4685 2.17691 20.75 2.87654 20.75V19.25C2.58079 19.25 2.29525 19.1311 2.08324 18.9165L1.01601 19.9705ZM2.87654 20.75H16.0123V19.25H2.87654V20.75ZM16.0123 20.75C16.712 20.75 17.381 20.4685 17.8729 19.9705L16.8056 18.9165C16.5936 19.1311 16.3081 19.25 16.0123 19.25V20.75ZM17.8729 19.9705C18.3644 19.4729 18.6389 18.7998 18.6389 18.1H17.1389C17.1389 18.408 17.018 18.7015 16.8056 18.9165L17.8729 19.9705ZM18.6389 18.1V4.8H17.1389V18.1H18.6389ZM18.4916 4.35358L15.6767 0.553579L14.4714 1.44642L17.2862 5.24642L18.4916 4.35358ZM15.0741 0.25H3.81482V1.75H15.0741V0.25ZM1 5.55H17.8889V4.05H1V5.55ZM12.4475 8.6C12.4475 9.4119 12.1289 10.1887 11.5647 10.76L12.6319 11.814C13.4753 10.96 13.9475 9.80375 13.9475 8.6H12.4475ZM11.5647 10.76C11.0007 11.331 10.2379 11.65 9.44444 11.65V13.15C10.6418 13.15 11.7881 12.6683 12.6319 11.814L11.5647 10.76ZM9.44444 11.65C8.651 11.65 7.88815 11.331 7.32423 10.76L6.257 11.814C7.10075 12.6683 8.24712 13.15 9.44444 13.15V11.65ZM7.32423 10.76C6.75999 10.1887 6.44136 9.4119 6.44136 8.6H4.94136C4.94136 9.80375 5.41355 10.96 6.257 11.814L7.32423 10.76Z" />
  </svg>
);

const DetailsIcon = () => (
  <svg width="17" height="20" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current fill-transparent">
    <circle cx="8.33408" cy="4.68955" r="3.68955" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15.8966 18.5255C15.8966 15.1378 12.5619 12.3916 8.44828 12.3916C4.33471 12.3916 1 15.1378 1 18.5255" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-transparent fill-current">
    <path d="M13 0.250001C12.5858 0.250001 12.25 0.585787 12.25 1C12.25 1.41421 12.5858 1.75 13 1.75L13 0.250001ZM19 3L19.75 3L19 3ZM17 19L17 19.75L17 19ZM13 18.25C12.5858 18.25 12.25 18.5858 12.25 19C12.25 19.4142 12.5858 19.75 13 19.75L13 18.25ZM6.53033 5.53033C6.82322 5.23744 6.82322 4.76256 6.53033 4.46967C6.23744 4.17678 5.76256 4.17678 5.46967 4.46967L6.53033 5.53033ZM0.999999 10L0.469669 9.46967C0.176776 9.76256 0.176776 10.2374 0.469669 10.5303L0.999999 10ZM5.46967 15.5303C5.76256 15.8232 6.23744 15.8232 6.53033 15.5303C6.82322 15.2374 6.82322 14.7626 6.53033 14.4697L5.46967 15.5303ZM13 10.75C13.4142 10.75 13.75 10.4142 13.75 10C13.75 9.58579 13.4142 9.25 13 9.25L13 10.75ZM13 1.75L17 1.75L17 0.25L13 0.250001L13 1.75ZM17 1.75C17.3315 1.75 17.6495 1.8817 17.8839 2.11612L18.9445 1.05546C18.4288 0.539732 17.7293 0.25 17 0.25L17 1.75ZM17.8839 2.11612C18.1183 2.35054 18.25 2.66848 18.25 3L19.75 3C19.75 2.27065 19.4603 1.57118 18.9445 1.05546L17.8839 2.11612ZM18.25 3L18.25 17L19.75 17L19.75 3L18.25 3ZM18.25 17C18.25 17.3315 18.1183 17.6495 17.8839 17.8839L18.9445 18.9445C19.4603 18.4288 19.75 17.7293 19.75 17L18.25 17ZM17.8839 17.8839C17.6495 18.1183 17.3315 18.25 17 18.25L17 19.75C17.7293 19.75 18.4288 19.4603 18.9445 18.9445L17.8839 17.8839ZM17 18.25L13 18.25L13 19.75L17 19.75L17 18.25ZM5.46967 4.46967L0.469669 9.46967L1.53033 10.5303L6.53033 5.53033L5.46967 4.46967ZM0.469669 10.5303L5.46967 15.5303L6.53033 14.4697L1.53033 9.46967L0.469669 10.5303ZM0.999999 10.75L13 10.75L13 9.25L0.999999 9.25L0.999999 10.75Z" />
  </svg>
);

export default function CustomerAccountNav({ active = "overview", onSignOut }: Props) {
  const accountPath = "/sell-my/customer/account";
  const ordersPath = "/sell-my/sales/order/history";
  const detailsPath = "/sell-my/customer/account/edit";

  return (
    <div className="sidebar sidebar-main">
      <ul className="nav items">
        <li className={`nav item overview ${active === "overview" ? "current" : ""}`}>
          {active === "overview" ? (
            <strong>
              <OverviewIcon />
              Overview
            </strong>
          ) : (
            <Link href={accountPath}>
              <OverviewIcon />
              Overview
            </Link>
          )}
        </li>

        <li className={`nav item orders ${active === "orders" ? "current" : ""}`}>
          {active === "orders" ? (
            <strong>
              <OrdersIcon />
              My Orders
            </strong>
          ) : (
            <Link href={ordersPath}>
              <OrdersIcon />
              My Orders
            </Link>
          )}
        </li>

        <li className={`nav item ${active === "details" ? "current" : ""}`}>
          {active === "details" ? (
            <strong>
              <DetailsIcon />
              My Details
            </strong>
          ) : (
            <Link href={detailsPath}>
              <DetailsIcon />
              My Details
            </Link>
          )}
        </li>

        <li className="nav item delimiter">
          <span className="delimiter block border-b border-container w-full my-2" />
        </li>

        <li className="nav item logout">
          {onSignOut ? (
            <button type="button" onClick={onSignOut} className="text-left w-full">
              <LogoutIcon />
              Sign Out
            </button>
          ) : (
            <Link href={`${accountPath}/logout`}>
              <LogoutIcon />
              Sign Out
            </Link>
          )}
        </li>
      </ul>
    </div>
  );
}
