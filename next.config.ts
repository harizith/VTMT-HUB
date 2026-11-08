import type { NextConfig } from "next";

const allowedDevOrigins = [
  "127.0.0.1",
  ...(process.env.REPLIT_DEV_DOMAIN ? [process.env.REPLIT_DEV_DOMAIN] : []),
];

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins,
};

export default nextConfig;
