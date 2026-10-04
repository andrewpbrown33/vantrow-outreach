/**
 * The Nudgerow mark ("the Signal"), small cut — inline copy of
 * packages/brand/assets/mark-small.svg with the arc color driven by
 * currentColor. Geometry is IDENTICAL to the asset file; per the brand README,
 * never redraw — if the asset changes, mirror it here. The ball is a literal —
 * the signal amber #887200 (brand.signal) — unchanged on any ground, because it
 * clears its ground in both schemes (4.51:1 on soft, 3.85:1 on dark).
 */
export function Mark({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path d="M46.5 33.9 A21 21 0 0 1 46.5 66.1" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <path d="M58.4 32.2 A31 31 0 0 1 58.4 67.8" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <path d="M70.2 32.7 A41 41 0 0 1 70.2 67.3" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <circle cx="33" cy="50" r="14" fill="#887200" />
    </svg>
  );
}
