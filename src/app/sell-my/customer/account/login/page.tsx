import { Suspense } from "react";
import StoreShell from "@/components/layout/StoreShell";
import CustomerLoginForm from "@/components/customer/CustomerLoginForm";

export const metadata = { title: "Customer Login — 4gadgets" };

export default function CustomerLoginPage() {
  return (
    <StoreShell store="sell">
      <main id="maincontent" className="page-main page-layout-1column customer-account-login">
        <div className="page-title-wrapper container flex flex-col md:flex-row flex-wrap my-6 font-medium md:mt-10 md:mb-8 text-4xl">
          <h1 className="text-gray-900 page-title title-font">
            <span className="base" data-ui-id="page-title-wrapper">
              Customer Login
            </span>
          </h1>
        </div>

        <div className="columns">
          <div className="column main">
            <Suspense>
              <CustomerLoginForm />
            </Suspense>
          </div>
        </div>
      </main>
    </StoreShell>
  );
}
