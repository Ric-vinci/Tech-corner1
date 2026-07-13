"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { heroSlides } from "@/data/content";

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const count = heroSlides.length;

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % count), 5000);
    return () => clearInterval(id);
  }, [count]);

  return (
    <div className="relative mb-5">
      <div className="relative overflow-hidden w-full h-[400px] md:h-[350px]">
        {heroSlides.map((slide, i) => (
          <div
            key={slide.image}
            className={`absolute top-0 left-0 overflow-hidden rounded-3xl bg-gradient-to-r from-mode-primary to-mode-primary-dark w-full slide-full-image transition-opacity duration-500 ${
              i === active ? "opacity-100 z-[1]" : "opacity-0 pointer-events-none z-0"
            }`}
          >
            <Link href={slide.href} className="h-[400px] md:h-[350px] flex flex-col md:flex-row">
              <div className="flex items-end justify-end ml-10 md:ml-0 h-2/5 md:justify-start md:w-1/2 md:h-auto md:p-10 md:pb-0 lg:w-3/5">
                <picture>
                  {slide.mobileImage && <source srcSet={slide.mobileImage} media="(max-width: 767px)" />}
                  <img className="max-w-full md:max-w-none max-h-full md:max-h-[90%]" src={slide.image} alt={slide.alt} />
                </picture>
              </div>
            </Link>
          </div>
        ))}

        <div className="absolute left-0 bottom-5 flex gap-2.5 w-full px-10 md:px-0 md:w-auto md:left-10 md:bottom-10 z-[2]">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={`bg-white h-0.5 flex-1 md:w-18 ${i === active ? "opacity-100" : "opacity-30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
