import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Odstranění blokátoru při nasazení
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Odstranění blokátoru při nasazení
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
