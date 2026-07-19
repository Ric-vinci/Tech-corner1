/** @type {import('next').NextConfig} */
function cdnRemotePattern() {
  const cdn = process.env.IMAGE_CDN_BASE_URL;
  if (!cdn) return null;
  try {
    const url = new URL(cdn);
    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      pathname: "/**",
    };
  } catch {
    return null;
  }
}

const remotePatterns = [
  // Product images now live in Supabase Storage (public bucket).
  { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
  { protocol: "https", hostname: "www.4gadgets.co.uk", pathname: "/**" }, // legacy fallback
  { protocol: "https", hostname: "cdn.shopify.com", pathname: "/**" },
].filter(Boolean);

const cdnPattern = cdnRemotePattern();
if (cdnPattern) remotePatterns.unshift(cdnPattern);

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
    unoptimized: process.env.NODE_ENV === "development",
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          "D:/System Volume Information/**",
        ],
      };
    }

    return config;
  },
};

export default nextConfig;
