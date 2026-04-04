import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * CSP: as strict as practical while keeping static generation and Next hydration.
 * - script-src 'unsafe-inline' is still required for Next's inline bootstrap without
 *   per-request nonces (middleware + dynamic rendering) or experimental SRI.
 * - script-src-attr 'none' blocks inline event handlers (onclick=, etc.).
 * - Tightening further (e.g. nonce-based script-src) is optional and increases
 *   operational complexity; evaluate if third-party scripts are ever added.
 *
 * Deploy: terminate TLS at the edge (HTTPS redirects, valid certs). HSTS below only
 * helps browsers that already received it over HTTPS.
 */
function contentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    isProd
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (isProd) {
    directives.push("upgrade-insecure-requests");
  }
  return directives.join("; ");
}

const securityHeaders: { key: string; value: string }[] = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  /** Never send path or query to other origins; same-origin requests keep full URL. */
  { key: "Referrer-Policy", value: "strict-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), serial=(), browsing-topics=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
];

if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/levy-breakdown",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
