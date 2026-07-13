import type { Config } from "tailwindcss";

/**
 * Design tokens reverse-engineered from the 4gadgets storefront CSS.
 * The "mode-primary" colour is theme-switchable: blue on the Buy store,
 * green on the Sell/Trade-in store. It resolves to a CSS variable that is
 * set per-store on the <body> (see globals.css .store-buy / .store-sell).
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Store-switchable accent (blue for buy, green for sell)
        "mode-primary": "rgb(var(--mode-primary) / <alpha-value>)",
        "mode-primary-darker": "rgb(var(--mode-primary-darker) / <alpha-value>)",
        "mode-primary-dark": "rgb(var(--mode-primary-dark) / <alpha-value>)",
        // Neutrals from the compiled Tailwind build
        black: "#0E1012",
        "black-off": "#1F2629",
        white: "#F7F7FB",
        "pure-white": "#FFFFFF",
        blue: "#007AFB",
        green: "#1EB16D",
        "green-light": "#EAF9F2",
        "grey-lightest": "#F7F7FB",
        "grey-lighter": "#ECECF4",
        "grey-light": "#D5D7E3",
        "grey-medium": "#4B5563",
        "grey-dark": "#555C67",
        "grey-darker": "#22282B",
        // Newsletter accent
        purple: "#612680",
        "purple-light": "#CDB5E5",
        "mint-light": "#DFF3E9",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        heading: ["var(--font-manrope)", "Manrope", "sans-serif"],
      },
      borderRadius: {
        "3xl": "20px",
      },
      boxShadow: {
        md: "0 4px 12px -2px rgba(24, 39, 75, 0.16)",
        hover: "0 12px 24px -6px rgba(24, 39, 75, 0.22)",
      },
      maxWidth: {
        container: "1240px",
      },
    },
  },
  plugins: [],
};

export default config;
