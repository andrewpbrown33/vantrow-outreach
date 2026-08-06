import Link from "next/link";
import { brand } from "@vantrow/brand";
import { footerNav } from "../lib/nav";

export function Footer() {
  return (
    <footer className="border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="text-lg font-bold tracking-tight text-brand-dark">
              {brand.name}
            </p>
            <p className="mt-1 text-sm text-muted">
              {brand.name} is{" "}
              <a
                href={brand.parentUrl}
                className="font-medium underline underline-offset-2 transition-colors hover:text-foreground"
              >
                {brand.endorsement}
              </a>
              .
            </p>
            <p className="mt-3 text-sm text-muted">
              Questions?{" "}
              <a
                href={`mailto:${brand.supportEmail}`}
                className="font-medium text-brand underline underline-offset-2 hover:text-brand-dark"
              >
                {brand.supportEmail}
              </a>
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
              {footerNav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-10 border-t border-foreground/10 pt-6 text-xs text-muted">
          &copy; {new Date().getFullYear()} {brand.legalName} All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
