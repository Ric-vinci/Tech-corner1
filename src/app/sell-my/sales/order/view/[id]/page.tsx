import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatGbp,
  formatOrderDate,
  formatOrderNumber,
  formatOrderStatus,
} from "@/components/customer/customer-ui";
import CustomerAccountLayout from "@/components/customer/CustomerAccountLayout";
import StoreShell from "@/components/layout/StoreShell";
import { fetchCustomerTradeIns } from "@/lib/customer/trade-ins";
import { requireCustomerAccount } from "@/lib/customer/require-account";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Order ${formatOrderNumber(id)} — 4gadgets` };
}

export default async function CustomerOrderViewPage({ params }: Props) {
  const { id } = await params;
  const { session, customer } = await requireCustomerAccount(`/sell-my/sales/order/view/${id}`);
  const submissions = await fetchCustomerTradeIns({
    customerId: session.customerId,
    customerEmail: customer.email,
  });

  const order = submissions.find((item) => item.id === id);
  if (!order) notFound();

  return (
    <StoreShell store="sell">
      <main id="maincontent" className="page-main page-layout-2columns-left account sales-order-view">
        <CustomerAccountLayout active="orders">
          <div className="bg-white rounded-lg p-5">
            <h1 className="text-2xl font-medium">Order #{formatOrderNumber(order.id)}</h1>
            <p className="mt-2 text-sm text-grey-dark">
              Placed on {formatOrderDate(order.created_at)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-5 mt-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-grey-dark">Status</p>
                <p className="font-medium">{formatOrderStatus(order.status)}</p>
              </div>
              <div>
                <p className="text-xs text-grey-dark">Order total</p>
                <p className="font-medium">{formatGbp(order.quoted_price)}</p>
              </div>
              <div>
                <p className="text-xs text-grey-dark">Product</p>
                <p className="font-medium">{order.product_name}</p>
              </div>
              <div>
                <p className="text-xs text-grey-dark">Condition</p>
                <p className="font-medium capitalize">{order.condition}</p>
              </div>
              <div>
                <p className="text-xs text-grey-dark">Quantity</p>
                <p className="font-medium">{order.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-grey-dark">Payment method</p>
                <p className="font-medium capitalize">{order.payment_method.replace(/_/g, " ")}</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Link href="/sell-my/sales/order/history" className="btn btn-secondary">
              Back to My Orders
            </Link>
          </div>
        </CustomerAccountLayout>
      </main>
    </StoreShell>
  );
}
