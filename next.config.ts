import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Prevent bundling of InstantDB admin SDK - it should be external
  serverExternalPackages: ['@instantdb/admin'],

  // Optimize builds for Railway
  experimental: {
    // Reduce memory usage during build
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
