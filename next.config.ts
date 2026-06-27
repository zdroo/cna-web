import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // localhost resolves to a private IP; this flag is required for the optimizer to
    // fetch images from the local API (https://localhost:44381) in development.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
