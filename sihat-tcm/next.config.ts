import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Allow large file uploads (APK files can be 50-100MB+)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    // Uncomment below to enable Turbopack (experimental, faster bundler)
    // Note: Test thoroughly with TinaCMS before enabling in production
    // turbo: {
    //   // Turbopack is faster for large codebases but may have compatibility issues
    // },
  },
  // Reduce file watcher load by ignoring unnecessary directories
  // This helps with hot reload performance on large codebases
  watchOptions: {
    ignored: ['**/node_modules/**', '**/.git/**'],
  },
};

export default nextConfig;
