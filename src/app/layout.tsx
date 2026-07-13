import type { Metadata } from "next";
import "./globals.css";
import "@/styles/vendor/styles.css";
import "@/styles/vendor/trustpilot.min.css";

export const metadata: Metadata = {
  title: "Tech Corner — Second Hand and Used Phones & Electronics",
  description:
    "Buy and sell refurbished phones, tablets, consoles and more. Quality second-hand tech at low prices with a 12 month warranty.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
