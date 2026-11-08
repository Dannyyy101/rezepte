import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Erzeugt .next/standalone mit minimalem Server für das Docker-Image
  output: "standalone",
  experimental: {
    serverActions: {
      // Bild-Uploads über das Formular brauchen mehr als das 1-MB-Standardlimit
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
