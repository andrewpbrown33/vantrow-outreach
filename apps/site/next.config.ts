import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The brand/growth packages are consumed as TypeScript source; let Next
  // transpile them (family pattern — no build step in workspace packages).
  transpilePackages: ["@vantrow/brand", "@vantrow/growth"],
};

export default nextConfig;
