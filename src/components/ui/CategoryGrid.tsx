/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { CategoryCard } from "@/data/types";

export default function CategoryGrid({ cards }: { cards: CategoryCard[] }) {
  return (
    <div className="relative grid grid-cols-2 gap-2 mb-12 md:grid-cols-4 md:gap-2.5 text-center z-10">
      {cards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className={`group transition duration-300 border-2 border-transparent bg-white rounded-3xl shadow-md flex flex-col items-center gap-5 p-5 pb-4 md:p-7 hover:shadow-hover ${
            card.wide ? "md:gap-10 md:text-left md:col-span-2 md:flex-row" : ""
          } ${card.orderClass ?? ""}`}
        >
          <div className={card.wide ? undefined : "flex-grow"}>
            <picture className="mx-auto">
              <img className="mx-auto" src={card.image} width={335} height={335} alt={card.title} loading="lazy" />
            </picture>
          </div>
          <div className={card.wide ? undefined : "md:mx-auto lg:w-2/3"}>
            <p
              className={`transition group-hover:text-mode-primary md:font-medium md:leading-normal ${
                card.wide ? "md:text-2xl" : "md:text-lg"
              }`}
            >
              {card.title}
            </p>
            {card.description && (
              <p className="hidden mt-3 text-grey-dark md:block">{card.description}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
