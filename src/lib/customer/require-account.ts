import { redirect } from "next/navigation";
import { getCustomerProfile, type CustomerProfile } from "@/lib/customer/get-customer";
import { getCustomerSession, type SessionPayload } from "@/lib/customer/session";

export type CustomerAccountContext = {
  session: SessionPayload;
  customer: CustomerProfile;
};

export async function requireCustomerAccount(returnUrl: string): Promise<CustomerAccountContext> {
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/sell-my/customer/account/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  const customer = await getCustomerProfile(session.customerId);
  if (!customer) {
    redirect(`/sell-my/customer/account/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  return { session, customer };
}
