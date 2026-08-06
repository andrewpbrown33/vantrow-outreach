import type { Metadata } from "next";
import { brand, brandCssVars } from "@vantrow/brand";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import { PageViewBeacon } from "../components/page-view-beacon";
import {
  jsonLdScript,
  organizationNode,
  softwareApplicationNode,
  webSiteNode,
} from "../lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${brand.domain}`),
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  // "./" resolves per-page against metadataBase, so every route gets its own
  // canonical without per-page boilerplate.
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    url: `https://${brand.domain}`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Brand tokens (light + dark palettes, typography, radius) — single
            injection point for the whole site. */}
        <style dangerouslySetInnerHTML={{ __html: brandCssVars(brand) }} />
        {/* Entity graph for search + answer engines: who we are, machine-readable. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript([organizationNode(), webSiteNode(), softwareApplicationNode()]),
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <PageViewBeacon />
      </body>
    </html>
  );
}
