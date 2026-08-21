import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gzip the HTML/RSC payloads Next itself serves. This is Next's default, but
  // it is stated explicitly so it cannot be lost silently behind a proxy change.
  compress: true,

  // Never ship browser source maps to the VPS: they are large files the client
  // may fetch and they slow the production build.
  productionBrowserSourceMaps: false,

  poweredByHeader: false,

  // These packages are imported with many named specifiers. Rewriting them to
  // per-icon/per-module imports keeps unused code out of the route bundles.
  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-query"],
  },

  async headers() {
    return [
      {
        // Immutable, content-hashed build assets. Next sets this for
        // /_next/static already; this covers files served from /public.
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
