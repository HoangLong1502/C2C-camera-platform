import type { NextConfig } from "next";
import process from "node:process";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Suppress warnings about searchParams in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Proxy API requests to backend
  rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : 'http://localhost:3003/api/:path*',
      },
    ];
  },
};

export default nextConfig;
