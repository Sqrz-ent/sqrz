import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep module resolution anchored to this app instead of the monorepo root.
    root: process.cwd(),
  },
};

export default nextConfig;
