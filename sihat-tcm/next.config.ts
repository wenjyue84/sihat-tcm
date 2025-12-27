import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Allow large file uploads (APK files can be 50-100MB+)
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    // Uncomment below to enable Turbopack (experimental, faster bundler)
    // Note: Test thoroughly with TinaCMS before enabling in production
    // turbo: {
    //   // Turbopack is faster for large codebases but may have compatibility issues
    // },
  },
};

export default nextConfig;
