import { Suspense } from "react";
import StoreShell from "@/components/layout/StoreShell";
import CustomerRegisterForm from "@/components/customer/CustomerRegisterForm";

export const metadata = { title: "Create New Customer Account — 4gadgets" };

export default function CustomerRegisterPage() {
  return (
    <StoreShell store="sell">
      <main id="maincontent" className="page-main page-layout-1column customer-account-create">
        <div className="page-title-wrapper container flex flex-col md:flex-row flex-wrap my-6 font-medium md:mt-10 md:mb-8 text-4xl">
          <h1 className="text-gray-900 page-title title-font">
            <span className="base" data-ui-id="page-title-wrapper">
              Create New Customer Account
            </span>
          </h1>
        </div>

        <div className="columns">
          <div className="column main">
            <Suspense>
              <CustomerRegisterForm />
            </Suspense>
          </div>
        </div>
      </main>
    </StoreShell>
  );
}
