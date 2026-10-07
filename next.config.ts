import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep module resolution anchored to this app instead of the monorepo root.
    root: process.cwd(),
  },
  images: {
    // Lets next/image (and /_next/image) fetch + optimize profile avatars and
    // gallery images straight from Supabase Storage's public object URLs —
    // replaces the broken Supabase Image Transformations /render/image
    // endpoint (403s "FeatureNotEnabled" on the current plan, see lib/image-url.ts).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fmjefvdtnmgdfauedpmg.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
