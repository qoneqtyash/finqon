import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Native modules that should not be bundled by webpack
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
