import type { NavItem, NavLink } from "./types";

// Category mega-navigation for the Buy store. Paths mirror the original
// storefront (normalised — doubled "buy-used/buy-used" segments and the stray
// staging host were cleaned up). Product/category routes resolve once the
// Shopify catalogue is connected.

const samsungPhones: NavLink[] = [
  { label: "Samsung Z Flip7 5G", href: "/buy-used/samsung-galaxy-z-flip7-5g.html" },
  { label: "Samsung S25 Ultra 5G", href: "/buy-used/samsung-galaxy-s25-ultra-5g.html" },
  { label: "Samsung Z Fold7 5G", href: "/buy-used/samsung-galaxy-z-fold7-5g.html" },
  { label: "Samsung S25 Plus 5G", href: "/buy-used/samsung-galaxy-s25-plus-5g.html" },
  { label: "Samsung Z Flip6 5G", href: "/buy-used/samsung-galaxy-z-flip6-5g.html" },
  { label: "Samsung S25 5G", href: "/buy-used/samsung-galaxy-s25-5g.html" },
  { label: "Samsung Z Fold6 5G", href: "/buy-used/samsung-galaxy-zfold6-5g.html" },
  { label: "Samsung S25 Edge 5G", href: "/buy-used/samsung-galaxy-s25-edge-5g.html" },
  { label: "Samsung Z Flip5 5G", href: "/buy-used/samsung-galaxy-z-flip5-5g.html" },
  { label: "Samsung S24 Ultra 5G", href: "/buy-used/samsung-galaxy-s24-ultra-5g.html" },
  { label: "Samsung Z Fold5 5G", href: "/buy-used/samsung-galaxy-z-fold-5g.html" },
  { label: "Samsung S24 Plus 5G", href: "/buy-used/samsung-galaxy-s24-plus-5g.html" },
  { label: "Samsung Z Flip4 5G", href: "/buy-used/samsung-galaxy-z-flip-4-5g.html" },
  { label: "Samsung S24 5G", href: "/buy-used/samsung-galaxy-s24-5g.html" },
  { label: "Samsung Z Fold4 5G", href: "/buy-used/samsung-galaxy-z-fold-4-5g.html" },
  { label: "Samsung S23 Ultra 5G", href: "/buy-used/samsung-galaxy-s23-ultra-5g.html" },
  { label: "Samsung S23 Plus 5G", href: "/buy-used/samsung-galaxy-s23-plus-5g.html" },
  { label: "Samsung S23 5G", href: "/buy-used/samsung-galaxy-s23-5g.html" },
  { label: "Samsung S22 Ultra 5G", href: "/buy-used/samsung-galaxy-s22-ultra-5g.html" },
  { label: "Samsung S22 5G", href: "/buy-used/samsung-galaxy-s22-5g.html" },
  { label: "Samsung S21 Ultra 5G", href: "/buy-used/samsung-s21-ultra-5g.html" },
  { label: "Samsung S21 5G", href: "/buy-used/samsung-s21-5g.html" },
  { label: "Shop All Samsung", href: "/buy-used/mobile-phones/samsung" },
];

const applePhones: NavLink[] = [
  { label: "Apple iPhone 16 Pro Max", href: "/buy-used/apple-iphone-16-pro-max.html" },
  { label: "Apple iPhone 15 Pro Max", href: "/buy-used/apple-iphone-15-pro-max.html" },
  { label: "Apple iPhone 16 Pro", href: "/buy-used/apple-iphone-16-pro.html" },
  { label: "Apple iPhone 15 Pro", href: "/buy-used/apple-iphone-15-pro.html" },
  { label: "Apple iPhone 16", href: "/buy-used/apple-iphone-16.html" },
  { label: "Apple iPhone 15 Plus", href: "/buy-used/apple-iphone-15-plus.html" },
  { label: "Apple iPhone 16e", href: "/buy-used/apple-iphone-16e.html" },
  { label: "Apple iPhone 15", href: "/buy-used/apple-iphone-15.html" },
  { label: "Apple iPhone 14 Pro Max", href: "/buy-used/apple-iphone-14-pro-max.html" },
  { label: "Apple iPhone 14 Pro", href: "/buy-used/apple-iphone-14-pro.html" },
  { label: "Apple iPhone 14 Plus", href: "/buy-used/apple-iphone-14-plus.html" },
  { label: "Apple iPhone 14", href: "/buy-used/apple-iphone-14.html" },
  { label: "Apple iPhone 13 Pro Max", href: "/buy-used/apple-iphone-13-pro-max.html" },
  { label: "Apple iPhone 13 Pro", href: "/buy-used/apple-iphone-13-pro.html" },
  { label: "Apple iPhone 13", href: "/buy-used/apple-iphone-13.html" },
  { label: "Apple iPhone 13 Mini", href: "/buy-used/apple-iphone-13-mini.html" },
  { label: "Apple iPhone 12 Pro Max", href: "/buy-used/apple-iphone-12-pro-max.html" },
  { label: "Apple iPhone 12 Pro", href: "/buy-used/apple-iphone-12-pro.html" },
  { label: "Apple iPhone 12", href: "/buy-used/apple-iphone-12.html" },
  { label: "Apple iPhone 12 Mini", href: "/buy-used/apple-iphone-12-mini.html" },
  { label: "Apple iPhone 11 Pro Max", href: "/buy-used/apple-iphone-11-pro-max.html" },
  { label: "Apple iPhone 11 Pro", href: "/buy-used/apple-iphone-11-pro.html" },
  { label: "Apple iPhone 11", href: "/buy-used/apple-iphone-11.html" },
  { label: "Shop All Apple", href: "/buy-used/mobile-phones/apple" },
];

const googlePhones: NavLink[] = [
  { label: "Google Pixel 10 Pro XL", href: "/buy-used/google-pixel-10-pro-xl.html" },
  { label: "Google Pixel 10 Pro", href: "/buy-used/google-pixel-10-pro.html" },
  { label: "Google Pixel 10", href: "/buy-used/google-pixel-10.html" },
  { label: "Google Pixel 9 Pro Fold", href: "/buy-used/google-pixel-9-pro-fold.html" },
  { label: "Google Pixel 9 Pro XL", href: "/buy-used/google-pixel-9-pro-xl.html" },
  { label: "Google Pixel 9 Pro", href: "/buy-used/google-pixel-9-pro.html" },
  { label: "Google Pixel 9", href: "/buy-used/google-pixel-9.html" },
  { label: "Google Pixel 8 Pro", href: "/buy-used/google-pixel-8-pro.html" },
  { label: "Google Pixel 8", href: "/buy-used/google-pixel-8.html" },
  { label: "Google Pixel 8a", href: "/buy-used/google-pixel-8a.html" },
  { label: "Google Pixel 7 Pro", href: "/buy-used/google-pixel7-pro.html" },
  { label: "Google Pixel 7 5G", href: "/buy-used/google-pixel-7-5g.html" },
  { label: "Google Pixel 7a", href: "/buy-used/google-pixel-7a.html" },
  { label: "Google Pixel 6 Pro", href: "/buy-used/google-pixel-6-pro.html" },
  { label: "Google Pixel 6", href: "/buy-used/google-pixel-6.html" },
  { label: "Google Pixel 6a", href: "/buy-used/google-pixel-6a.html" },
  { label: "Shop All Google", href: "/buy-used/mobile-phones/google" },
];

const huaweiPhones: NavLink[] = [
  { label: "Huawei P30 Pro", href: "/buy-used/huawei-p30-pro.html" },
  { label: "Huawei P20 Pro", href: "/buy-used/huawei-p20-pro.html" },
  { label: "Huawei Mate 20 Pro", href: "/buy-used/huawei-mate-20-pro.html" },
  { label: "Huawei P20", href: "/buy-used/huawei-p20.html" },
  { label: "Shop All Huawei", href: "/buy-used/mobile-phones/huawei" },
];

const oneplusPhones: NavLink[] = [
  { label: "OnePlus 9 Pro", href: "/buy-used/oneplus-9-pro.html" },
  { label: "OnePlus 9", href: "/buy-used/oneplus-9.html" },
  { label: "OnePlus 8 Pro", href: "/buy-used/oneplus-8-pro.html" },
  { label: "OnePlus 8", href: "/buy-used/oneplus-8.html" },
  { label: "OnePlus 7 Pro", href: "/buy-used/oneplus-7-pro.html" },
  { label: "OnePlus 7T", href: "/buy-used/oneplus-7t.html" },
  { label: "OnePlus 7", href: "/buy-used/oneplus-7.html" },
  { label: "OnePlus Nord 5G", href: "/buy-used/oneplus-nord-5g.html" },
  { label: "Shop All OnePlus", href: "/buy-used/mobile-phones/oneplus" },
];

const appleTablets: NavLink[] = [
  { label: "Apple iPad 6 9.7 (2018)", href: "/buy-used/apple-ipad-6-9-7-2018.html" },
  { label: "Apple iPad Air 4 (2020)", href: "/buy-used/apple-ipad-air-4-2020.html" },
  { label: "Apple iPad Air 2", href: "/buy-used/apple-ipad-air-2.html" },
  { label: "Apple iPad Air", href: "/buy-used/apple-ipad-air.html" },
  { label: "Apple iPad Mini 5", href: "/buy-used/apple-ipad-mini-5-2019.html" },
  { label: "Apple iPad 7 (2019)", href: "/buy-used/apple-ipad-7-10-2-2019.html" },
  { label: "Apple iPad Pro 12.9", href: "/buy-used/apple-ipad-pro-12-9.html" },
  { label: "Apple iPad Pro 2 12.9 (2017)", href: "/buy-used/apple-ipad-pro-2-12-9-2017.html" },
  { label: "Shop All Apple", href: "/buy-used/tablets/apple" },
];

const samsungTablets: NavLink[] = [
  { label: "Samsung Tab S10 Plus", href: "/buy-used/samsung-galaxy-tab-s10-plus.html" },
  { label: "Samsung Tab S10 FE Plus", href: "/buy-used/samsung-galaxy-tab-s10-fe-plus.html" },
  { label: "Samsung Tab S10 FE", href: "/buy-used/samsung-galaxy-tab-s10-fe.html" },
  { label: "Samsung Tab S10 Lite", href: "/buy-used/samsung-galaxy-tab-s10-lite.html" },
  { label: "Samsung Tab S9 Ultra", href: "/buy-used/samsung-galaxy-tab-s9-ultra.html" },
  { label: "Samsung Tab S9 FE", href: "/buy-used/samsung-galaxy-tab-s9-fe.html" },
  { label: "Samsung Tab S7", href: "/buy-used/samsung-galaxy-tab-s7.html" },
  { label: "Samsung Tab S7 Plus", href: "/buy-used/samsung-galaxy-tab-s7-plus.html" },
  { label: "Samsung Tab S6", href: "/buy-used/samsung-galaxy-tab-s6.html" },
  { label: "Samsung Tab S6 Lite", href: "/buy-used/samsung-galaxy-tab-s6-lite.html" },
  { label: "Shop All Samsung", href: "/buy-used/tablets/samsung" },
];

const samsungWatches: NavLink[] = [
  { label: "Galaxy Watch 6 40mm", href: "/buy-used/samsung-galaxy-watch-6-40mm.html" },
  { label: "Galaxy Watch 5 Pro 45mm 4G", href: "/buy-used/samsung-galaxy-watch-5-44mm-4g.html" },
  { label: "Galaxy Watch 5 44mm", href: "/buy-used/samsung-galaxy-watch-5-44mm.html" },
  { label: "Galaxy Watch 5 Pro 45mm", href: "/buy-used/samsung-galaxy-watch-5-pro-45mm.html" },
  { label: "Galaxy Watch 5 40mm", href: "/buy-used/samsung-galaxy-watch-5-40mm.html" },
  { label: "Galaxy Watch 4 40mm", href: "/buy-used/samsung-galaxy-watch-4-40mm.html" },
  { label: "Galaxy Watch 4 Classic 42mm", href: "/buy-used/samsung-galaxy-watch-4-classic-42mm-4g.html" },
  { label: "Galaxy Watch 4 44mm 4G", href: "/buy-used/samsung-galaxy-watch-4-44mm-4g.html" },
  { label: "Shop All Samsung Watches", href: "/buy-used/smart-watches/samsung-smart-watches" },
];

const appleWatches: NavLink[] = [
  { label: "Apple Watch Series 10 42mm", href: "/buy-used/apple-watch-series-10-42mm.html" },
  { label: "Apple Watch Series 10 46mm", href: "/buy-used/apple-watch-series-10-46mm.html" },
  { label: "Apple Watch Series 9 45mm 4G", href: "/buy-used/apple-watch-series-9-45mm-4g.html" },
  { label: "Apple Watch Series 9 41mm", href: "/buy-used/apple-watch-series-9-41mm.html" },
  { label: "Apple Watch Series 9 45mm", href: "/buy-used/apple-watch-series-9-45mm.html" },
  { label: "Apple Watch Series 9 41mm 4G", href: "/buy-used/apple-watch-series-9-41mm-4g.html" },
  { label: "Apple Watch Series 8 41mm", href: "/buy-used/apple-watch-series-8-41mm.html" },
  { label: "Apple Watch Series 8 45mm", href: "/buy-used/apple-watch-series-8-45mm.html" },
  { label: "Apple Watch Series 8 45mm 4G", href: "/buy-used/apple-watch-series-8-45mm-4g.html" },
  { label: "Shop All Apple Watches", href: "/buy-used/smart-watches/apple-smart-watches" },
];

export const megaNav: NavItem[] = [
  {
    label: "Mobile Phones",
    href: "/buy-used/mobile-phones",
    columns: [
      { title: "Samsung", href: "/buy-used/mobile-phones/samsung", links: samsungPhones },
      { title: "Apple", href: "/buy-used/mobile-phones/apple", links: applePhones },
      { title: "Google", href: "/buy-used/mobile-phones/google", links: googlePhones },
      { title: "Huawei", href: "/buy-used/mobile-phones/huawei", links: huaweiPhones },
      { title: "OnePlus", href: "/buy-used/mobile-phones/oneplus", links: oneplusPhones },
    ],
    footerLinks: [
      { label: "Shop All Brands", href: "/buy-used/mobile-phones/all-phones" },
      { label: "Shop All Mobile Phones", href: "/buy-used/mobile-phones" },
    ],
  },
  {
    label: "Tablets",
    href: "/buy-used/tablets",
    columns: [
      { title: "Apple", href: "/buy-used/tablets/apple", links: appleTablets },
      { title: "Samsung", href: "/buy-used/tablets/samsung", links: samsungTablets },
    ],
    footerLinks: [
      { label: "Shop All Brands", href: "/buy-used/tablets/all" },
      { label: "Shop All Tablets", href: "/buy-used/tablets" },
    ],
  },
  { label: "Games Consoles", href: "/buy-used/game-consoles" },
  {
    label: "Smart Watches",
    href: "/buy-used/smart-watches",
    columns: [
      { title: "Samsung", href: "/buy-used/smart-watches/samsung-smart-watches", links: samsungWatches },
      { title: "Apple", href: "/buy-used/smart-watches/apple-smart-watches", links: appleWatches },
    ],
    footerLinks: [{ label: "Shop All Smart Watches", href: "/buy-used/smart-watches" }],
  },
  { label: "Accessories", href: "/buy-used/accessories" },
  { label: "All Refurbished", href: "/buy-used/all-refurbished" },
  { label: "Big Deals", href: "/buy-used/deals" },
  { label: "4 News", href: "/buy-used/4news" },
];

export const secondaryNav: NavLink[] = [
  { label: "My Account", href: "/sell-my/customer/account" },
  { label: "About Us", href: "/buy-used/about-us" },
  { label: "Delivery", href: "/buy-used/delivery" },
  { label: "FAQ's", href: "/buy-used/mpfaqs/article/index" },
  { label: "Terms & Conditions", href: "/buy-used/terms-and-conditions" },
];

export const sellNav: NavItem[] = [
  { label: "Mobile Phones", href: "/sell-my/mobile" },
  { label: "Tablets", href: "/sell-my/tablets" },
  { label: "Games Consoles", href: "/sell-my/games-consoles" },
  { label: "Smart Watches", href: "/sell-my/sell-my-watch" },
  { label: "Cameras", href: "/sell-my/sell-my-camera" },
];

export const sellSecondaryNav: NavLink[] = [
  { label: "My Account", href: "/sell-my/customer/account" },
  { label: "About Us", href: "/sell-my/about-us" },
  { label: "Delivery", href: "/sell-my/delivery" },
  { label: "FAQ's", href: "/sell-my/mpfaqs/article/index" },
  { label: "Terms & Conditions", href: "/sell-my/terms-and-conditions" },
];
