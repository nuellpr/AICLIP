import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // API_URL can be http://localhost:3001 or https://api.example.com
    // If NEXT_PUBLIC_API_URL ends with /api we strip it, if empty fallback to localhost
    const raw = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://127.0.0.1:3001";
    const base = raw.replace(/\/+$/, "").replace(/\/api$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${base}/api/:path*`,
      },
    ];
  },
};
export default nextConfig;
