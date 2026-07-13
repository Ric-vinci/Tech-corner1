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
  { protocol: "https", hostname: "www.4gadgets.co.uk", pathname: "/**" },
  { protocol: "https", hostname: "cdn.shopify.com", pathname: "/**" },
  { protocol: "https", hostname: "tech-corner-dripetja-images.s3.eu-north-1.amazonaws.com", pathname: "/**" },
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
