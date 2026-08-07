import { brand } from "@vantrow/brand";

/**
 * The two-tone family wordmark: the brand lead wears the name's stem, the
 * Vantrow camel (brand.rowThread, exposed as --brand-row-thread) always wears
 * the "row" suffix — the thread every subsidiary shares. Falls back to the
 * plain name for a future non-"-row" brand, so the component stays
 * white-label-safe.
 */
export function Wordmark({ className }: { className?: string }) {
  const name = brand.name;
  const suffix = "row";
  if (!name.toLowerCase().endsWith(suffix)) {
    return <span className={className}>{name}</span>;
  }
  const stem = name.slice(0, name.length - suffix.length);
  const row = name.slice(name.length - suffix.length);
  return (
    <span className={className}>
      {stem}
      <span style={{ color: "var(--brand-row-thread)" }}>{row}</span>
    </span>
  );
}
