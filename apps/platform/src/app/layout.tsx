import type { Metadata } from "next";
import { brand } from "@vantrow/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${brand.name} — app`,
  // The signed-in world is nobody's search result.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
