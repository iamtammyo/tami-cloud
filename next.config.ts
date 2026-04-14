import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "buffer.com" },
      { protocol: "https", hostname: "*.buffer.com" },
    ],
  },
};

export default nextConfig;
