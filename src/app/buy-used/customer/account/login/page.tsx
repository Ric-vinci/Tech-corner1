import { redirect } from "next/navigation";

export default function BuyUsedAccountLoginRedirect() {
  redirect("/sell-my/customer/account/login?returnUrl=/buy-used");
}
