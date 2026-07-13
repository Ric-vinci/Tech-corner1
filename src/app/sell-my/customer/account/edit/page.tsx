import CustomerAccountLayout from "@/components/customer/CustomerAccountLayout";
import CustomerDetailsForm from "@/components/customer/CustomerDetailsForm";
import StoreShell from "@/components/layout/StoreShell";
import { requireCustomerAccount } from "@/lib/customer/require-account";

export const metadata = { title: "Account Information — 4gadgets" };

export default async function CustomerAccountEditPage() {
  const { customer } = await requireCustomerAccount("/sell-my/customer/account/edit");

  return (
    <StoreShell store="sell">
      <main id="maincontent" className="page-main page-layout-2columns-left account customer-account-edit">
        <CustomerAccountLayout active="details">
          <CustomerDetailsForm customer={customer} />
        </CustomerAccountLayout>
      </main>
    </StoreShell>
  );
}
