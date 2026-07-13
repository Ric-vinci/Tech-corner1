/* eslint-disable @next/next/no-img-element */

/**
 * Tech Corner logo. Renders the brand image from /images/tech-corner-logo.png.
 * Sized by its own height so it stays clearly visible regardless of the header
 * container. Used by the main and checkout headers.
 */
export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/images/tech-corner-logo.png"
      alt="Tech Corner"
      title="Tech Corner"
      className={`block h-16 w-auto object-contain md:h-[72px] ${className}`}
      width={180}
      height={72}
    />
  );
}
