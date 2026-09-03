import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The prototype ships small local JPEG stills. Serving them directly keeps
  // local vinext development independent of Cloudflare image bindings.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
