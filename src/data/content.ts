import type {
  CategoryCard,
  FooterColumn,
  HeroSlide,
  NavLink,
  Product,
  UspItem,
} from "./types";

/* ---------------------------------- USP ---------------------------------- */

export const buyUsp: UspItem[] = [
  {
    icon: "stars",
    title: "Rated 4.7/5",
    subtitle: "Based on 14,800+ reviews",
    href: "https://uk.trustpilot.com/review/www.4gadgets.co.uk",
  },
  {
    icon: "next-day-delivery.svg",
    title: "Free Next Day Delivery",
    subtitle: "Order by 3pm Mon-Fri",
    href: "/delivery",
    badge: true,
  },
  {
    icon: "warranty.svg",
    title: "12 Month Warranty",
    subtitle: "For all online orders",
    href: "/warranty",
  },
  {
    icon: "returns.svg",
    title: "30 Day Free Returns",
    subtitle: "Extended Christmas Returns",
    href: "/returns",
  },
];

export const sellUsp: UspItem[] = [
  {
    icon: "postage-returns.svg",
    title: "Free Postage & Returns",
    subtitle: "We'll send a freepost pack",
    href: "/about-us",
    badge: true,
  },
  {
    icon: "secure.svg",
    title: "Secure Data Deletion",
    subtitle: "We take your data seriously",
    href: "#",
    badge: true,
  },
  {
    icon: "any-condition.svg",
    title: "We Buy in Any Condition",
    subtitle: "We accept devices in any condition",
    href: "#",
    badge: true,
  },
  {
    icon: "help-environment.svg",
    title: "Help The Environment",
    subtitle: "Give your old tech a second life",
    href: "#",
    badge: true,
  },
];

/* ------------------------------ Buy homepage ----------------------------- */

export const heroSlides: HeroSlide[] = [
  {
    image: "/images/Homepage_Banner_-_DSKTP_-_Rely_on_refurb_1.png",
    href: "/buy-used/deals",
    alt: "Rely on refurb",
  },
  {
    image: "/images/Homepage_Banner_-_DSKTP_-_E-waste_Calculator_1.png",
    href: "/ewaste-calculator",
    alt: "E-waste Calculator",
  },
  {
    image: "/images/BNPL_-_Desktop_-_1188x350_1.png",
    href: "/buy-used/deals",
    alt: "Buy now pay later",
  },
];

export const buyTopCategories: CategoryCard[] = [
  {
    title: "Refurbished Mobile Phones",
    description: "Top quality second hand phones",
    image: "/images/MicrosoftTeams-image_5_.png",
    href: "/buy-used/mobile-phones",
    wide: true,
  },
  {
    title: "Refurbished Tablets",
    description: "A wide variety of tablets at competitively low prices",
    image: "/images/MicrosoftTeams-image_6_.png",
    href: "/buy-used/tablets",
    wide: true,
    orderClass: "md:order-1",
  },
  {
    title: "Refurbished Games Consoles",
    image: "/images/Refurbished_Consoles_-_ps5.png",
    href: "/buy-used/game-consoles",
  },
  {
    title: "Refurbished Deals",
    image: "/images/MicrosoftTeams-image_8_.png",
    href: "/buy-used/deals",
  },
  {
    title: "Refurbished Smartwatches",
    image: "/images/MicrosoftTeams-image_7_.png",
    href: "/buy-used/smart-watches",
  },
  {
    title: "Refurbished Accessories",
    image: "/images/MicrosoftTeams-image_9_.png",
    href: "/buy-used/accessories",
  },
];

export const whyRefurbished = [
  {
    icon: "save-money.svg",
    title: "Save Money",
    text: "Low prices with guaranteed quality",
  },
  {
    icon: "stop-e-waste.svg",
    title: "Stop E-Waste",
    text: "Great for the planet",
  },
  {
    icon: "quality-tech.svg",
    title: "Quality Tech",
    text: "Like new with a 12 month warranty",
  },
];

// Trending products (from the storefront's Luigibox recommender feed).
export const buyTrending: Product[] = [
  {
    name: "Samsung Galaxy Z Fold5 5G",
    image: "/images/tumbnail_19f649a7-3ba4-4423-b38f-98776896bbf3.jpg",
    price: "£409.99",
    href: "/buy-used/samsung-galaxy-z-fold5-5g.html",
  },
  {
    name: "Samsung Galaxy S25 5G",
    image: "/images/tumbnail_58098da1-d2ad-4e7b-988f-dd73eabe4910.jpg",
    price: "£419.99",
    href: "/buy-used/samsung-galaxy-s25-5g.html",
  },
  {
    name: "Apple iPhone 15 Pro",
    image: "/images/tumbnail_94d7f7fd-6036-4de7-95fd-c30f48ccd15c.jpg",
    price: "£399.99",
    href: "/buy-used/apple-iphone-15-pro.html",
  },
  {
    name: "Samsung Galaxy Z Flip7 5G",
    image: "/images/tumbnail_2bc14370-9ec7-4719-8e41-a35f92c85755.jpg",
    price: "£519.99",
    href: "/buy-used/samsung-galaxy-z-flip7-5g.html",
  },
  {
    name: "Apple iPhone 12",
    image: "/images/tumbnail_36a73e80-f607-4091-b19d-c3071ebe305f.jpg",
    price: "£169.99",
    href: "/buy-used/apple-iphone-12.html",
  },
  {
    name: "Apple iPhone 14",
    image: "/images/tumbnail_5577acee-44f1-493a-9880-3413825ee409.jpg",
    price: "£279.99",
    href: "/buy-used/apple-iphone-14.html",
  },
  {
    name: "Google Pixel 8",
    image: "/images/tumbnail_c35c2b1d-0976-4e91-b4d1-0f40682e4388.jpg",
    price: "£239.99",
    href: "/buy-used/google-pixel-8.html",
  },
  {
    name: "Samsung Galaxy Tab S6 Lite (2020)",
    image: "/images/tumbnail_5dd4e81d-9db6-4220-8f82-541b674b0c23.jpg",
    price: "£109.99",
    href: "/buy-used/samsung-galaxy-tab-s6-lite-2020.html",
  },
];

/* ------------------------------ Sell page -------------------------------- */

export const sellSteps = [
  {
    icon: "register-sale.svg",
    step: "Step 1",
    title: "Register Your Sale",
    text: "Register your sale by answering some questions about your device.",
  },
  {
    icon: "sales-pack.svg",
    step: "Step 2",
    title: "Get A Sales Pack",
    text: "Get your freepost pack on the same day or print our pre-paid postage labels at home.",
  },
  {
    icon: "post-device.svg",
    step: "Step 3",
    title: "Post Your Device",
    text: "Send us your device in any condition for free.",
  },
  {
    icon: "get-paid.svg",
    step: "Step 4",
    title: "Get Paid!",
    text: "Receive your payment fast and easily. This usually takes 2 days to process.",
  },
];

export const sellCategories: CategoryCard[] = [
  {
    title: "Sell my Mobile Phone",
    description: "We buy phones in any condition!",
    image: "/images/MicrosoftTeams-image_5_.png",
    href: "/sell-my/mobile",
    wide: true,
  },
  {
    title: "Sell my Tablet",
    description: "We buy tablets in any condition!",
    image: "/images/MicrosoftTeams-image_6_.png",
    href: "/sell-my/tablets",
    wide: true,
    orderClass: "md:order-1",
  },
  {
    title: "Sell my Games Console",
    image: "/images/Refurbished_Consoles_-_ps5.png",
    href: "/sell-my/games-consoles",
  },
  {
    title: "Sell my Smartwatch",
    image: "/images/MicrosoftTeams-image_7_.png",
    href: "/sell-my/sell-my-watch",
  },
  {
    title: "Sell my Camera",
    image: "/images/Go_pro.png",
    href: "/sell-my/sell-my-camera",
  },
];

export const sellTradeIns: Product[] = [
  {
    name: "Apple iPhone 11 64GB",
    image: "/images/iPhone_11_1.jpg",
    price: "Get up to £60.00",
    href: "/sell-my/apple-iphone-11-64gb.html",
  },
  {
    name: "Apple iPhone 8 64GB",
    image: "/images/iphone8-silver-select-2017_AV1_1.png",
    price: "Get up to £30.00",
    href: "/sell-my/apple-iphone-8-64gb.html",
  },
  {
    name: "Samsung Galaxy Note 20 Ultra 4G 256GB",
    image: "/images/samsung-galaxy-note20-ultra_Mystic_Bronze_Webcrop.jpg",
    price: "Get up to £70.00",
    href: "/sell-my/samsung-galaxy-note-20-ultra-4g-n985f-256gb.html",
  },
  {
    name: "Samsung Galaxy S21 5G 128GB",
    image: "/images/s21_5g.jpg",
    price: "Get up to £50.00",
    href: "/sell-my/samsung-galaxy-s21-5g-g991b-128gb.html",
  },
  {
    name: "Samsung Galaxy S9 64GB",
    image: "/images/product_galaxys9_midnightblack_01.png",
    price: "Get up to £10.00",
    href: "/sell-my/samsung-galaxy-s9-g960f-64gb.html",
  },
  {
    name: "Samsung Galaxy S20 Ultra 5G 128GB",
    image: "/images/u_10204743.jpg",
    price: "Get up to £60.00",
    href: "/sell-my/samsung-galaxy-s20-ultra-5g-g988b-128gb.html",
  },
  {
    name: "Samsung Galaxy S10 Plus 128GB",
    image: "/images/samsung-galaxy-s10-plus-green-sku-header.png",
    price: "Get up to £30.00",
    href: "/sell-my/samsung-galaxy-s10-plus-g975f-128gb.html",
  },
  {
    name: "Apple iPhone 13 Pro 128GB",
    image: "/images/iphone-13-pro-blue-select_15.jpg",
    price: "Get up to £190.00",
    href: "/sell-my/apple-iphone-13-pro-128gb.html",
  },
];

/* -------------------------------- Footer --------------------------------- */

export const footerColumns: FooterColumn[] = [
  {
    title: "Company Info",
    links: [
      { label: "About Us", href: "/about-us" },
      { label: "Competitions", href: "/competition" },
      { label: "4 News", href: "/4news" },
      { label: "Evertreen Partnership", href: "/4gadgets-evertreen-sustainability-partnership" },
      { label: "Press & Mentions", href: "/press-mentions" },
    ],
  },
  {
    title: "Service & Support",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Warranty", href: "/warranty" },
      { label: "Delivery", href: "/delivery" },
      { label: "Returns", href: "/returns" },
      { label: "FAQ's", href: "/buy-used/mpfaqs/article/index" },
      { label: "Gift Wrap", href: "/how-to-use-gift-wrap-at-4gadgets" },
    ],
  },
  {
    title: "Security & Privacy",
    links: [
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Acceptable Use Policy", href: "/acceptable-use-policy" },
      { label: "Complaints Procedure", href: "/complaints-procedure" },
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Terms of Website Use", href: "/terms-of-website-use" },
    ],
  },
  {
    title: "Guides",
    links: [
      { label: "Grades Guide", href: "/grades" },
      { label: "How do I remove my account lock", href: "/how-do-i-remove-my-account-lock" },
      { label: "The Smartphone Index", href: "/smartphone-index" },
      { label: "Mobile gaming power-ups", href: "/mobile-gaming-power-ups-player-impact" },
      { label: "E-waste Calculator", href: "/ewaste-calculator" },
      { label: "Tech Out of Our Landfill (TOOL)", href: "/tech-out-of-landfill" },
    ],
  },
];

export const socialLinks: (NavLink & { platform: string })[] = [
  { platform: "twitter", label: "X", href: "https://twitter.com/4gadgetsuk" },
  { platform: "instagram", label: "Instagram", href: "https://instagram.com/4gadgets.co.uk/" },
  { platform: "facebook", label: "Facebook", href: "https://en-gb.facebook.com/4gadgets.co.uk/" },
  { platform: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/4gadgets/" },
  { platform: "youtube", label: "YouTube", href: "https://www.youtube.com/channel/UCSWwvxExCI1ofiCHZzCGDKQ/feed" },
  { platform: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@4gadgets.co.uk" },
];
