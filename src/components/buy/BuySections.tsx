/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { whyRefurbished } from "@/data/content";

export function WhyRefurbished() {
  return (
    <div className="bg-black relative left-1/2 -ml-[50vw] w-screen text-white pt-44 pb-4 -mt-40 md:-mt-48 md:pt-64 md:pb-24">
      <div className="container flex flex-col gap-2.5 md:flex-row">
        <div className="flex flex-col justify-center items-center text-center pb-14 md:text-left md:items-start md:pr-5 md:pb-0 md:w-1/4 lg:pr-12">
          <h3 className="text-2xl mb-6 leading-snug md:mb-4 lg:text-4xl">Why Buy Refurbished?</h3>
          <p className="text-grey-medium mb-7 leading-8 hidden md:block md:text-lg">
            Here at 4gadgets we pride ourselves on selling quality items at great prices.
          </p>
          <Link className="btn btn-primary" href="/buy-used/all-refurbished">
            Shop All Refurbished
          </Link>
        </div>
        <div className="flex flex-col gap-4 md:gap-2.5 md:flex-row md:w-3/4">
          {whyRefurbished.map((item) => (
            <div
              key={item.title}
              className="flex-1 flex flex-col rounded-[15px] bg-black-off text-center p-6 md:px-5 md:pt-24 md:pb-14 lg:px-12"
            >
              <div className="flex items-end mb-4 md:mb-12 md:h-[67px]">
                <img className="mx-auto max-h-9 md:max-h-full" width={66} height={67} src={`/images/${item.icon}`} alt="" />
              </div>
              <div className="text-lg font-heading font-medium md:text-2xl">{item.title}</div>
              <p className="text-grey-medium mt-0.5 leading-8 md:text-lg md:mt-4">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PromoBar() {
  return (
    <div className="bg-black px-4 py-4 my-6 full-width">
      <div className="flex items-center justify-center">
        <span className="text-white font-bold text-lg md:text-2xl">
          New to 4gadgets? Use WELCOME10 discount code at checkout for £10 off.
        </span>
      </div>
    </div>
  );
}

export function TradeInBanner() {
  return (
    <div
      className="full-width flex items-center pt-12 mb-10 md:pt-0 md:h-[530px] lg:h-[630px]"
      style={{ backgroundColor: "#F7F7FB" }}
    >
      <div className="container relative w-full p-0 md:pl-4 md:pr-4">
        <div className="relative z-10 text-center px-16 md:text-left md:px-0 md:w-2/5">
          <h3 className="text-[27px] mb-4 leading-snug md:text-4xl md:mb-8">Trade In Your Old Device</h3>
          <p className="text-grey-dark mb-6 leading-7 md:leading-8 md:text-lg md:mb-7">
            We offer the best possible prices on all of your old and unwanted phone handsets.
          </p>
          <Link href="/sell-my" className="btn btn-primary">
            Trade In Now
          </Link>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="w-full md:hidden">
            <picture>
              <source type="image/webp" srcSet="/images/trade-in-device-mobile.png" />
              <img src="/images/trade-in-device-mobile.png" alt="" loading="lazy" />
            </picture>
          </div>
          <div className="hidden absolute bottom-0 max-h-full right-0 md:block">
            <picture>
              <img src="/images/trade-in-device.png" alt="" loading="lazy" />
            </picture>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AboutSection() {
  return (
    <div className="py-5 mb-6 px-4 md:grid md:grid-cols-2 md:items-center md:py-28 md:px-0">
      <h1 className="text-2xl font-medium mb-6 md:text-4xl md:leading-normal md:w-4/5 md:mb-0">
        We&rsquo;re not like other second-hand mobile phone brands
      </h1>
      <p className="text-grey-dark leading-7 md:leading-8 md:text-lg md:row-span-2">
        We&rsquo;re 4gadgets, a second-hand, used, and refurbished technology brand which has been working to change the
        refurb tech market for the better since we launched in April 2015. We think everyone should be able to get their
        hands on their dream mobile phone handsets and other devices, ensuring the best possible quality at the lowest
        possible price. Everything we do aims to make that dream a reality.
      </p>
      <div>
        <Link className="btn btn-primary mt-6" href="/about-us">
          About 4gadgets
        </Link>
      </div>
    </div>
  );
}
