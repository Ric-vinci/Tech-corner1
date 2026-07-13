import { NavProvider } from "@/components/layout/NavProvider";
import { getNavForStore } from "@/lib/shopify/navigation";

export default async function BuyUsedLayout({ children }: { children: React.ReactNode }) {
  const navItems = await getNavForStore("buy");
  return <NavProvider items={navItems}>{children}</NavProvider>;
}
