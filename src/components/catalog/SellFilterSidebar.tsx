import Link from "next/link";
import type { ModelFilterLink } from "@/data/types";

type Props = {
  modelLinks: ModelFilterLink[];
};

export default function SellFilterSidebar({ modelLinks }: Props) {
  return (
    <div className="sidebar sidebar-main">
      <div className="block md:border-0 md:py-0 md:px-0 mt-2 md:mt-5">
        <div className="block-title h-10 flex items-center justify-between">
          <span className="text-primary text-md text-xl md:text-2xl font-semibold uppercase">Shop By</span>
        </div>
        <div className="block-content filter-content pt-3">
          <div className="filter-option my-4">
            <div className="filter-options-title flex justify-between items-center cursor-pointer hover:text-secondary-darker border-container">
              <span className="title text-md md:text-lg font-semibold">Model</span>
            </div>
            <div className="filter-options-content pt-3 Model">
              {modelLinks.map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center py-1 hover:text-black">
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
