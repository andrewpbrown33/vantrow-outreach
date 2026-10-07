import Link from "next/link";
import { Mark } from "./mark";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/sequences", label: "Sequences" },
  { href: "/prospects", label: "Prospects" },
  { href: "/settings", label: "Settings" },
] as const;

/** The app's only chrome. The current section wears the accent; everything
 *  else is quiet. `here` is matched as a prefix so a sequence detail still
 *  lights Sequences. */
export function AppBar({ here, trailing }: { here: string; trailing?: React.ReactNode }) {
  const active = (href: string) =>
    href === "/" ? here === "/" : here.startsWith(href);
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-background px-4 py-2.5">
      <Link href="/" className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight">
        <Mark className="text-sub" />
        <span className="text-sub">nudgerow</span>
      </Link>
      <nav className="ml-4 flex flex-wrap gap-1.5 text-[13px]" aria-label="Primary">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active(item.href) ? "page" : undefined}
            className={active(item.href)
              ? "rounded-full bg-brand-accent px-3 py-1 font-bold text-foreground"
              : "rounded-full px-3 py-1 text-muted"}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3 font-mono text-[10.5px] text-muted">
        {trailing}
      </div>
    </div>
  );
}
