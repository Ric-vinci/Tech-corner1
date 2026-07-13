"use client";

import Link from "next/link";

type Props = {
  backHref?: string;
  label?: string;
};

export default function CheckoutProgressBar({ backHref = "/sell-my/checkout/cart", label = "Trade-In" }: Props) {
  return (
    <div className="opc-progress-bar-wrapper">
      <ul className="opc-progress-bar">
        <li>
          <div className="opc-progress-bar-label">
            <span>&nbsp;</span>
          </div>
          <div className="opc-progress-bar-border" />
        </li>
        <li>
          <div className="opc-progress-bar-label">
            <span>&nbsp;</span>
          </div>
          <div className="opc-progress-bar-border" />
        </li>
        <li className="opc-progress-bar-item _active">
          <div className="opc-progress-bar-label">
            <span>{label}</span>
          </div>
          <div className="opc-progress-bar-border" />
        </li>
      </ul>

      <Link href={backHref} className="opc-progress-bar-back" aria-label="Back to basket">
        <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M17 8.75C17.4142 8.75 17.75 8.41421 17.75 8C17.75 7.58579 17.4142 7.25 17 7.25L17 8.75ZM1 8L0.469671 7.46967C0.176778 7.76257 0.176778 8.23744 0.469671 8.53033L1 8ZM7.46967 15.5303C7.76256 15.8232 8.23744 15.8232 8.53033 15.5303C8.82322 15.2374 8.82322 14.7626 8.53033 14.4697L7.46967 15.5303ZM8.53033 1.53033C8.82322 1.23744 8.82322 0.762565 8.53033 0.469672C8.23744 0.17678 7.76256 0.17678 7.46967 0.469672L8.53033 1.53033ZM17 7.25L1 7.25L1 8.75L17 8.75L17 7.25ZM8.53033 14.4697L1.53033 7.46967L0.469671 8.53033L7.46967 15.5303L8.53033 14.4697ZM1.53033 8.53033L8.53033 1.53033L7.46967 0.469672L0.469671 7.46967L1.53033 8.53033Z"
            fill="#A0AABA"
          />
        </svg>
      </Link>
    </div>
  );
}
