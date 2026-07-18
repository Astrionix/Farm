import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;

const nextConfig: NextConfig = {
  output: isVercel ? undefined : 'export',
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default nextConfig;
