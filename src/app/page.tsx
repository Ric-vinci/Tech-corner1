import BuyHomePage from "@/components/pages/BuyHomePage";
import { NavProvider } from "@/components/layout/NavProvider";
import { getNavForStore } from "@/lib/shopify/navigation";

export default async function Page() {
  const navItems = await getNavForStore("buy");
  return (
    <NavProvider items={navItems}>
      <BuyHomePage />
    </NavProvider>
  );
}
