import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Prevent bundling of InstantDB admin SDK - it should be external
  serverExternalPackages: ['@instantdb/admin'],
};

export default nextConfig;
