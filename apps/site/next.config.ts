import type { NextConfig } from "next";

/** Security headers on every response (the family pattern, vantrow-web's
 *  next.config). The site has one form — early access — and no reason to be
 *  framed by anyone. The CSP is deliberately narrow: framing, plugins and
 *  <base>; script and style sources are left to a later pass with nonces. */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // The brand/growth packages are consumed as TypeScript source; let Next
  // transpile them (family pattern — no build step in workspace packages).
  transpilePackages: ["@vantrow/brand", "@vantrow/growth"],
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
