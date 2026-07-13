/* eslint-disable @next/next/no-img-element */
import type { UspItem } from "@/data/types";

const itemClass =
  "md-max:justify-center md-max:w-full flex items-center px-6 md:third:hidden md:last:hidden lg:third:flex lg:last:flex";

export default function UspBar({ items }: { items: UspItem[] }) {
  return (
    <div className="container py-[18px] px-0 relative overflow-hidden widget-usp">
      <div className="flex items-center justify-evenly min-h-[37px] md:min-h-[44px] lg:justify-between">
        {items.map((item) => (
          <a key={item.title} className={itemClass} href={item.href}>
            {item.icon === "stars" ? (
              <div className="mr-4 min-h-[37px] flex">
                <img src="/images/trustpilot-stars-full.svg" height={37} alt="" />
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-full w-[37px] h-[37px] bg-mode-primary mr-4">
                <img src={`/images/${item.icon}`} height={37} alt="" />
              </div>
            )}
            <div>
              <div className="font-semibold text-lg md:text-base">{item.title}</div>
              <div className="md-max:hidden text-sm text-grey-dark">{item.subtitle}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
