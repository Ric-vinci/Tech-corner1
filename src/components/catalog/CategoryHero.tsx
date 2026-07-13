/* eslint-disable @next/next/no-img-element */

type Props = {
  title: string;
  image: string;
  variant?: "buy" | "sell";
};

export default function CategoryHero({ title, image, variant = "buy" }: Props) {
  if (variant === "sell") {
    return (
      <div className="relative overflow-hidden bg-black-off px-12 rounded-3xl flex flex-col items-center mb-4 md:flex-row">
        <picture className="image absolute top-0 left-0 w-full h-full object-cover">
          <img
            src={image}
            alt={title}
            title={title}
            className="image absolute top-0 left-0 w-full h-full object-cover"
          />
        </picture>
        <div className="relative z-10 font-medium py-16 md:py-14 text-center md:text-left text-3xl">
          <h1 className="text-white text-2xl md:text-4xl">
            <span className="base">{title}</span>
          </h1>
        </div>
      </div>
    );
  }

  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl">
      <div className="relative aspect-[21/7] min-h-[160px] w-full md:min-h-[220px]">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-end p-6 md:p-10">
          <h1 className="max-w-2xl rounded-2xl bg-black/70 px-6 py-4 text-2xl font-semibold text-pure-white md:text-4xl">
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}
