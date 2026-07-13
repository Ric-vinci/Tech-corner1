import Image from "next/image";
import Link from "next/link";
import { sellSteps } from "@/data/content";
import { SearchIcon } from "@/components/ui/Icons";

export function SellHero() {
  return (
    <section className="mb-12 overflow-hidden rounded-3xl" style={{ backgroundColor: "#DFF3E9" }}>
      <div className="flex flex-col items-center gap-6 px-6 py-10 md:flex-row md:px-12 md:py-0">
        <div className="w-full text-center md:w-2/5 md:py-16 md:text-left">
          <h1 className="mb-4 text-3xl leading-tight md:text-5xl">Trade in Your Old Tech For Instant Cash!</h1>
          <p className="mb-6 text-grey-dark md:text-lg">Search for your device below</p>
          <form action="/sell-my/catalogsearch/result/" method="GET" className="relative mx-auto max-w-md md:mx-0">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-dark" />
            <input
              type="text"
              name="q"
              placeholder="Start typing to find your device..."
              aria-label="Search"
              className="h-12 w-full rounded-lg border border-grey-light bg-pure-white pl-11 pr-4 text-sm focus:border-mode-primary focus:outline-none"
            />
          </form>
        </div>
        <div className="flex w-full justify-center md:w-3/5 md:items-end md:self-end">
          <Image
            src="/images/trade-in-search.png"
            alt="Trade in your device"
            width={620}
            height={460}
            priority
            className="hidden h-auto w-full max-w-sm object-contain md:block md:max-w-xl"
          />
          <Image
            src="/images/trade-in-search-mobile.png"
            alt="Trade in your device"
            width={320}
            height={280}
            priority
            className="h-auto w-full max-w-xs object-contain md:hidden"
          />
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section className="mb-14">
      <div className="mb-6 text-center md:mb-10">
        <h2 className="text-2xl md:text-3xl">How It Works</h2>
        <p className="mt-1 text-grey-dark md:text-lg">Sell your device in 4 simple steps</p>
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible">
        {sellSteps.map((step) => (
          <div
            key={step.step}
            className="flex min-w-[75%] snap-start flex-col items-start rounded-3xl bg-pure-white p-6 shadow-md sm:min-w-[45%] md:min-w-0"
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-mode-primary/10">
              <Image src={`/images/${step.icon}`} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            </div>
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-mode-primary">{step.step}</span>
            <h3 className="mb-2 font-heading text-lg font-medium">{step.title}</h3>
            <p className="text-sm leading-6 text-grey-dark">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AnyConditionBanner() {
  return (
    <section
      className="relative left-1/2 -ml-[50vw] mb-14 flex w-screen items-center border-b border-grey-light pt-12 md:h-[420px] md:pt-0"
      style={{ backgroundColor: "#F7F7FB" }}
    >
      <div className="container flex flex-col items-center gap-6 md:flex-row-reverse md:items-stretch">
        <div className="relative z-10 px-6 text-center md:w-2/5 md:self-center md:px-0 md:text-left">
          <h2 className="mb-4 text-2xl leading-snug md:text-4xl">If It&rsquo;s Damaged, We&rsquo;ll Still Take it</h2>
          <p className="mb-6 leading-7 text-grey-dark md:text-lg">
            We will accept any listed device, no matter the condition.
          </p>
          <Link href="/sell-my" className="btn btn-primary">
            Sell My Device
          </Link>
        </div>
        <div className="flex justify-center md:w-3/5 md:items-end">
          <Image
            src="/images/MicrosoftTeams-image_14_.png"
            alt="We accept any condition"
            width={520}
            height={420}
            className="h-auto w-full max-w-sm object-contain md:max-w-lg"
          />
        </div>
      </div>
    </section>
  );
}

export function FreePostBanner() {
  return (
    <section className="relative mb-14 overflow-hidden rounded-3xl bg-black">
      <div className="flex min-h-[280px] items-center justify-center bg-gradient-to-br from-mode-primary/30 to-black p-10 text-center md:min-h-[380px]">
        <div className="max-w-lg text-pure-white">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-widest text-mode-primary">
            Free Postage &amp; Returns
          </span>
          <h2 className="text-2xl leading-normal text-pure-white md:text-4xl md:leading-relaxed">
            We&rsquo;ll send you a freepost pack the same day
          </h2>
        </div>
      </div>
    </section>
  );
}
