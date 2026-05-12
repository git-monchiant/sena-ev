import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["senaev.ngrok.app"],
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "senagreenauto.co.th",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
      },
    ],
  },
};

export default nextConfig;
