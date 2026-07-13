"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { NavItem } from "@/data/types";

const NavContext = createContext<NavItem[] | null>(null);

export function NavProvider({ items, children }: { items: NavItem[] | null; children: ReactNode }) {
  return <NavContext.Provider value={items}>{children}</NavContext.Provider>;
}

export function useNavItems(): NavItem[] | null {
  return useContext(NavContext);
}
