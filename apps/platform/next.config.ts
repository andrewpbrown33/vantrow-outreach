import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages are consumed as TypeScript source (family pattern —
  // no build step in packages/*).
  transpilePackages: ["@vantrow/brand", "@vantrow/connect", "@vantrow/engine"],
};

export default nextConfig;
