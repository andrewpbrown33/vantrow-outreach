import type { Metadata } from "next";
import { brand, brandCssVars } from "@vantrow/brand";
import { stateCssVars, stateWashVars } from "@vantrow/brand/state-palette";
import "./globals.css";

export const metadata: Metadata = {
  title: `${brand.name} — app`,
  // The signed-in world is nobody's search result.
  robots: { index: false, follow: false },
};

/** Chrome tokens and data tokens, injected side by side but kept apart: the
 *  brand palette paints the room, the state palette encodes what things are.
 *  `.on-night` (globals.css) re-points the state variables at their dark
 *  values so the feed pane needs no special-casing. */
const tokens =
  `${brandCssVars(brand)}:root{${stateCssVars("light")}${stateWashVars()}}` +
  `:root .on-night{${stateCssVars("dark")}}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head><style dangerouslySetInnerHTML={{ __html: tokens }} /></head>
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
