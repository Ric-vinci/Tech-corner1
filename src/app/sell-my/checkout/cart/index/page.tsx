import { redirect } from "next/navigation";

export default function CartIndexRedirect() {
  redirect("/sell-my/checkout/cart");
}
