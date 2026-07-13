import { NavProvider } from "@/components/layout/NavProvider";
import SellProviders from "@/components/providers/SellProviders";
import { getNavForStore } from "@/lib/shopify/navigation";

export default async function SellMyLayout({ children }: { children: React.ReactNode }) {
  const navItems = await getNavForStore("sell");
  return (
    <NavProvider items={navItems}>
      <SellProviders>{children}</SellProviders>
    </NavProvider>
  );
}
