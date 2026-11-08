import type { NextConfig } from "next";

// Fotos werden im Browser verkleinert, klappt das nicht (z. B. HEIC in Chrome),
// geht das Original hoch. Handyfotos sind dann schnell über 10 MB.
const MAX_UPLOAD = "25mb";

const nextConfig: NextConfig = {
  // Erzeugt .next/standalone mit minimalem Server für das Docker-Image
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: MAX_UPLOAD,
    },
    // Der Login-Proxy puffert jeden Request-Body, standardmäßig nur bis 10 MB.
    // Größere Uploads würden sonst stillschweigend abgeschnitten.
    proxyClientMaxBodySize: MAX_UPLOAD,
  },
};

export default nextConfig;
