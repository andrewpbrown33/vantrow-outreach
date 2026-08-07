import Link from "next/link";
import { primaryNav, routes } from "../lib/nav";
import { Wordmark } from "./wordmark";

/** Pre-launch header: the CTA is early access, not app login — there is no
 *  product app yet. Swap to Log in / Start free when the platform ships. */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href={routes.home}
          className="text-lg font-bold tracking-tight text-brand-dark"
        >
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {primaryNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href={routes.earlyAccess}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Get early access
        </Link>
      </div>
    </header>
  );
}
