import type { NextConfig } from "next";

/** Security headers on every response (the family pattern, vantrow-web's
 *  next.config). The signed-in app has real forms — Start sending, Approve
 *  step, Invite — and a page that can be framed can be clicked through
 *  invisibly, so frame-ancestors is 'none' with X-Frame-Options as the
 *  legacy fallback. The CSP is deliberately narrow: framing, plugins and
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
  // Workspace packages are consumed as TypeScript source (family pattern —
  // no build step in packages/*).
  transpilePackages: ["@vantrow/brand", "@vantrow/connect", "@vantrow/engine"],
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
