import CustomerAccountLayout from "@/components/customer/CustomerAccountLayout";
import CustomerOrdersPage from "@/components/customer/CustomerOrdersPage";
import StoreShell from "@/components/layout/StoreShell";
import { getCustomerTradeIns } from "@/lib/customer/get-customer";
import { requireCustomerAccount } from "@/lib/customer/require-account";

export const metadata = { title: "My Orders — 4gadgets" };

export default async function CustomerOrdersHistoryPage() {
  const { session, customer } = await requireCustomerAccount("/sell-my/sales/order/history");
  const submissions = await getCustomerTradeIns(session.customerId, customer.email);

  return (
    <StoreShell store="sell">
      <main id="maincontent" className="page-main page-layout-2columns-left account sales-order-history">
        <CustomerAccountLayout active="orders">
          <CustomerOrdersPage submissions={submissions} />
        </CustomerAccountLayout>
      </main>
    </StoreShell>
  );
}
