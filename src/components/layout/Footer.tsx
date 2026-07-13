"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { footerColumns } from "@/data/content";
import type { StoreMode } from "@/data/types";

const PlusIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`transition duration-300 text-grey-dark md:hidden ${open ? "rotate-45 !text-white" : ""}`}
    width="25"
    height="25"
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.063 1a.75.75 0 0 0-1.5 0h1.5ZM1 11.564a.75.75 0 0 0 0 1.5v-1.5Zm10.563 12.063a.75.75 0 0 0 1.5 0h-1.5Zm12.064-10.563a.75.75 0 0 0 0-1.5v1.5ZM11.564 1v11.314h1.5V1h-1.5Zm.75 10.564H1v1.5h11.313v-1.5Zm.75 12.063V12.314h-1.5v11.313h1.5Zm-.75-10.563h11.313v-1.5H12.314v1.5Z"
      fill="currentColor"
    />
  </svg>
);

export default function Footer({ store = "buy" }: { store?: StoreMode }) {
  const [open, setOpen] = useState<string | null>(null);
  const newsletterAction =
    store === "sell" ? "/sell-my/newsletter/subscriber/new/" : "/buy-used/newsletter/subscriber/new/";

  return (
    <footer className="page-footer">
      <div className="footer content">
        {/* Newsletter */}
        <div className="relative z-10 bg-black-off py-12 mx-5 rounded-3xl md:mx-0 md:rounded-none h-[400px] md:h-[200px] bg-no-repeat bg-cover bg-center">
          <div className="md-max:px-4 container-narrow">
            <form
              className="form subscribe flex items-center items-left text-center justify-center justify-start flex-wrap w-full"
              action={newsletterAction}
              method="post"
            >
              <div className="newsletter-title flex md:flex-row flex-col md:justify-start justify-center items-center md:items-left">
                <svg className="mb-3 md:mb-0 md:mr-4 md:w-8 md:h-7" width="45" height="36" viewBox="0 0 45 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="m22.5 20.125-.427.617a.75.75 0 0 0 .854 0l-.427-.617ZM5.3 1.75h34.4V.25H5.3v1.5Zm34.4 0c1.96 0 3.55 1.585 3.55 3.5h1.5c0-2.76-2.28-5-5.05-5v1.5Zm3.55 3.5v25.5h1.5V5.25h-1.5Zm0 25.5c0 1.915-1.59 3.5-3.55 3.5v1.5c2.77 0 5.05-2.24 5.05-5h-1.5Zm-3.55 3.5H5.3v1.5h34.4v-1.5Zm-34.4 0c-1.96 0-3.55-1.585-3.55-3.5H.25c0 2.76 2.28 5 5.05 5v-1.5Zm-3.55-3.5V5.25H.25v25.5h1.5Zm0-25.5c0-1.915 1.59-3.5 3.55-3.5V.25C2.53.25.25 2.49.25 5.25h1.5Zm41.823-.617-21.5 14.875.854 1.234 21.5-14.875-.854-1.234ZM22.927 19.508 1.427 4.633.573 5.867l21.5 14.875.854-1.234Z" fill="#612680" />
                </svg>
                <div className="text-2xl font-bold m-0 md:text-3xl lg:text-3xl w-auto" style={{ color: "#612680" }}>
                  Join our newsletter and enjoy an extra £10 off!
                </div>
              </div>
              <div className="input-wrapper mb-6 w-full md:mb-0 mt-2 md:w-4/5 lg:w-2/3">
                <div className="relative flex flex-grow">
                  <label htmlFor="newsletter-subscribe" className="sr-only">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    id="newsletter-subscribe"
                    className="form-input border-0 text-white inline-flex w-full py-3.5 pr-12"
                    placeholder="Enter your email address"
                    style={{ backgroundColor: "#cdb5e5" }}
                  />
                  <button type="submit" aria-label="Subscribe" className="absolute right-4 top-1/2 -translate-y-1/2">
                    <svg width="23" height="20" viewBox="0 0 23 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 9.25a.75.75 0 0 0 0 1.5v-1.5ZM22 10l.525.536a.75.75 0 0 0 0-1.072L22 10ZM13.337.464a.75.75 0 1 0-1.05 1.072l1.05-1.072Zm-1.05 18a.75.75 0 0 0 1.05 1.072l-1.05-1.072ZM1 10.75h21v-1.5H1v1.5Zm11.288-9.214 9.187 9 1.05-1.072-9.188-9-1.05 1.072Zm9.187 7.928-9.187 9 1.05 1.072 9.187-9-1.05-1.072Z" fill="#612680" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
            <div className="w-full text-white">
              <p className="my-4 text-sm">
                This form is protected by reCAPTCHA - the{" "}
                <a className="underline" href="https://policies.google.com/privacy">
                  Google Privacy Policy
                </a>{" "}
                and{" "}
                <a className="underline" href="https://policies.google.com/terms">
                  Terms of Service
                </a>{" "}
                apply.
              </p>
            </div>
          </div>
        </div>

        {/* Social + nav columns */}
        <div className="bg-black text-grey-medium pt-36 -mt-36 md:pt-0 md:mt-0">
          <div className="container flex flex-col mx-auto md:py-12">
            <div className="p-8 md:p-0 md:w-60 md:max-w-[24%] md:-mt-7 md:order-1">
              <div className="flex items-center justify-between">
                <a href="https://twitter.com/4gadgetsuk" target="_blank" rel="noreferrer" aria-label="Twitter">
                  <svg width="28" height="23" viewBox="0 0 28 23" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M26.75.497a10.332 10.332 0 0 1-3.558 1.364A5.517 5.517 0 0 0 19.1.023c-3.143 0-5.635 2.61-5.635 5.812 0 .475.06.89.12 1.305-4.687-.237-8.839-2.55-11.627-6.05a5.895 5.895 0 0 0-.77 2.907c0 2.016 1.008 3.796 2.49 4.804-.949 0-1.779-.296-2.55-.712v.06c0 2.788 1.957 5.16 4.508 5.694a5.977 5.977 0 0 1-1.483.178c-.356 0-.712-.06-1.068-.119.712 2.313 2.788 3.974 5.28 4.034-1.958 1.542-4.39 2.49-7 2.49-.474 0-.89 0-1.364-.058a15.52 15.52 0 0 0 8.66 2.61c10.38 0 16.074-8.839 16.074-16.49v-.771c1.127-.83 2.076-1.839 2.788-3.025a9.839 9.839 0 0 1-3.262.89c1.186-.594 2.076-1.72 2.49-3.085Z" fill="#fff" /></svg>
                </a>
                <a href="https://instagram.com/4gadgets.co.uk/" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <svg width="26" height="25" viewBox="0 0 26 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M13.059 0c1.678.05 3.357.05 5.036.102 1.475.05 2.849.305 4.12 1.068 1.68 1.017 2.697 2.493 3.002 4.375.203 1.119.254 2.29.305 3.46.05 2.492 0 4.984 0 7.426 0 1.323-.05 2.595-.509 3.866-.814 2.442-2.543 3.917-5.036 4.375-1.12.204-2.29.255-3.46.305-2.492.051-4.933 0-7.426 0-1.323 0-2.595-.05-3.866-.508-2.442-.814-3.917-2.544-4.375-5.037-.204-1.119-.255-2.289-.305-3.459-.051-2.492 0-4.985 0-7.427 0-1.322.05-2.594.508-3.866C1.867 2.238 3.597.763 6.09.305 7.21.102 8.38.051 9.55 0h3.51Zm10.275 12.31h-.05V9.36c0-.966-.051-1.882-.153-2.849-.203-2.136-1.475-3.56-3.56-3.967-1.07-.204-2.24-.255-3.358-.255-2.137-.05-4.223-.05-6.36 0-1.067 0-2.136.051-3.153.204-1.831.305-3.052 1.322-3.561 3.103a6.841 6.841 0 0 0-.254 1.78c-.051 2.239-.102 4.528-.102 6.766 0 1.424.05 2.9.153 4.324.203 2.136 1.475 3.612 3.611 4.019 1.069.203 2.188.203 3.307.254 2.086.051 4.171.051 6.257 0 .966 0 1.933-.05 2.849-.152.864-.102 1.73-.357 2.441-.967 1.17-.916 1.628-2.188 1.68-3.612.152-1.882.203-3.815.253-5.697Z" fill="#fff" /><path fillRule="evenodd" clipRule="evenodd" d="M19.468 12.514c0 3.561-2.849 6.41-6.41 6.41-3.56 0-6.41-2.849-6.41-6.46 0-3.51 2.9-6.36 6.461-6.36 3.51 0 6.359 2.85 6.359 6.41Zm-6.41 4.12c2.29 0 4.172-1.882 4.172-4.17 0-2.29-1.883-4.172-4.172-4.172-2.289 0-4.171 1.882-4.171 4.171 0 2.29 1.882 4.172 4.171 4.172ZM21.198 5.8c0 .864-.661 1.526-1.475 1.526-.814 0-1.526-.713-1.526-1.527 0-.813.66-1.475 1.475-1.475.865 0 1.526.662 1.526 1.475Z" fill="#fff" /></svg>
                </a>
                <a href="https://en-gb.facebook.com/4gadgets.co.uk/" target="_blank" rel="noreferrer" aria-label="Facebook">
                  <svg width="26" height="25" viewBox="0 0 26 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.236 12.549c0-6.805-5.54-12.346-12.346-12.346C6.086.203.545 5.743.545 12.549c0 6.172 4.52 11.276 10.401 12.2v-8.652h-3.11v-3.548h3.159V9.827c0-3.111 1.847-4.812 4.666-4.812 1.36 0 2.77.243 2.77.243V8.32h-1.555c-1.555 0-1.993.972-1.993 1.944v2.333h3.402l-.534 3.548h-2.868v8.652c5.833-.972 10.353-6.076 10.353-12.248Z" fill="#fff" /></svg>
                </a>
                <a href="https://www.linkedin.com/company/4gadgets/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <svg width="26" height="25" viewBox="0 0 26 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M6.355 3.213C6.32 1.61 5.174.39 3.313.39 1.453.39.236 1.61.236 3.213c0 1.569 1.18 2.824 3.007 2.824h.034c1.897 0 3.078-1.255 3.078-2.824Zm-.358 5.055H.557V24.61h5.44V8.268Zm13.352-.384c3.58 0 6.262 2.336 6.262 7.356v9.37h-5.439v-8.743c0-2.196-.787-3.695-2.756-3.695-1.502 0-2.397 1.01-2.79 1.986-.144.35-.18.837-.18 1.325v9.127H9.008s.072-14.808 0-16.342h5.44v2.315c.722-1.113 2.014-2.699 4.902-2.699Z" fill="#fff" /></svg>
                </a>
                <a href="https://www.youtube.com/channel/UCSWwvxExCI1ofiCHZzCGDKQ/feed" target="_blank" rel="noreferrer" aria-label="YouTube">
                  <svg width="27" height="19" viewBox="0 0 27 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M23.413.85c1.102.302 1.969 1.192 2.263 2.323.535 2.05.535 6.327.535 6.327s0 4.277-.535 6.327c-.294 1.13-1.161 2.021-2.263 2.324-1.996.549-10.002.549-10.002.549s-8.005 0-10.001-.55c-1.102-.302-1.97-1.192-2.264-2.323C.611 13.777.611 9.5.611 9.5s0-4.277.535-6.327C1.441 2.043 2.308 1.152 3.41.85 5.406.3 13.41.3 13.41.3s8.006 0 10.002.55ZM11.01 5.9v8l6.4-4-6.4-4Z" fill="#fff" /></svg>
                </a>
                <a href="https://www.tiktok.com/@4gadgets.co.uk" target="_blank" rel="noreferrer" aria-label="TikTok">
                  <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.284 0.5H13.2392V16.8478C13.2392 18.7957 11.6836 20.3957 9.74769 20.3957C7.81176 20.3957 6.25612 18.7957 6.25612 16.8478C6.25612 14.9348 7.7772 13.3695 9.644 13.3V9.19567C5.53014 9.2652 2.21143 12.6391 2.21143 16.8478C2.21143 21.0913 5.59928 24.5 9.78228 24.5C13.9652 24.5 17.3531 21.0565 17.3531 16.8478V8.4652C18.8742 9.57827 20.7409 10.2391 22.7114 10.2739V6.16957C19.6693 6.06522 17.284 3.56087 17.284 0.5Z" fill="white" /></svg>
                </a>
              </div>
            </div>

            <nav className="footer-nav">
              <ul className="footer-nav__list flex flex-col divide-y border-t border-grey-darker divide-grey-darker md:border-t-0 md:divide-y-0 md:flex-row md:gap-6">
                {footerColumns.map((col) => {
                  const isOpen = open === col.title;
                  return (
                    <li key={col.title} className="footer-nav__item flex-1">
                      <div
                        className="flex items-center justify-between text-white text-lg font-heading font-bold py-6 cursor-pointer md:cursor-default md:py-0 md:mb-4 md:text-xl"
                        onClick={() => setOpen(isOpen ? null : col.title)}
                      >
                        {col.title}
                        <PlusIcon open={isOpen} />
                      </div>
                      <ul
                        className={`overflow-hidden transition-all duration-300 md:block ${
                          isOpen ? "md-max:max-h-[500px] max-h-[500px]" : "md-max:max-h-0"
                        }`}
                      >
                        {col.links.map((link) => (
                          <li key={link.label} className="last:mb-7 md:last:mb-0 md:py-1.5">
                            <Link className="block py-3 md:py-0" href={link.href}>
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="order-3 md:inline-flex md:mt-4 md:mb-0 mx-auto mb-8 md:-ml-2">
              <img className="logo-payment" src="/images/MNA.png" alt="MNA" />
              <img className="logo-payment" src="/images/Dotties.png" alt="Dotties" />
            </div>
          </div>
        </div>

        {/* Payment methods + copyright */}
        <div className="bg-black-off text-grey-medium">
          <div className="container pt-7 pb-10 mx-auto flex flex-col-reverse gap-5 items-center text-center text-xs md:py-8 md:flex-row md:justify-between">
            <img className="logo-payment" src="/images/payment-methods-logo.png" width={300} height={32} alt="Accepted payment methods" />
            <p className="md:flex md:items-center">Registered in England and Wales under company number 07839241.</p>
            <p>© 2026 4gadgets.co.uk. All Rights Reserved.</p>
          </div>
        </div>

        {/* Company info */}
        <div className="relative bg-black-off">
          <div className="container pb-4 text-grey-medium text-xs">
            <p>
              4gadgets is a trading style of MTR Group Limited, a company registered in England and Wales with its
              registered office at Duke House, Perry Road, Harlow, Essex, CM18 7ND. Our company registration number
              is: 09591425, VAT number: GB 123 8610 32.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
