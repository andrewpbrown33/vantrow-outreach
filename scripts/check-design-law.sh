#!/usr/bin/env bash
# Nudgerow design law — CI gate (Parcelrow's check-guardrails pattern, ported per R11).
#
# Product surfaces cannot drift generic: banned typefaces, no gradients, no
# emoji, radius cap, no shadows. Depth comes from hairlines on the Clarity Ink
# grounds, not decoration. Scope: authored source under apps/*/src and
# packages/*/src (never build output, never docs/ — mockups and internal docs
# may show anything).
#
# Each rule greps; any hit fails. A self-test fails the gate if the include
# globs stop matching files, so the law can't silently become vacuous.
set -u

fail=0
say() { printf '%s\n' "$*"; }

# Authored product sources only.
mapfile -t FILES < <(find apps/*/src packages/*/src -type f \
  \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' -o -name '*.html' \) \
  -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/dist/*' 2>/dev/null)

if [ "${#FILES[@]}" -eq 0 ]; then
  say "✗ design-law self-test: include globs matched 0 files — the gate is vacuous; fix the globs"
  exit 1
fi

check() { # check <label> <grep-args...>
  local label="$1"; shift
  local hits
  hits=$(grep -n "$@" "${FILES[@]}" 2>/dev/null)
  if [ -n "$hits" ]; then
    say "✗ $label:"
    say "$hits" | head -20
    fail=1
  fi
}

# 1 · Banned typefaces (generic-SaaS tell). Word-bounded so Interim/robotics
#     don't trip it; multiword names matched literally.
check "banned typeface" -E '\b(Inter|Roboto|Poppins|Montserrat|Playfair)\b|Open Sans|DM Sans|Space Grotesk'

# 2 · No gradients. Flat grounds only.
check "gradient" -E 'linear-gradient|radial-gradient|conic-gradient|bg-gradient-'

# 3 · No emoji on product surfaces. U+2713 ✓ is carved out — the Pulse
#     finished-badge glyph, a typographic check mark, not emoji (decision log
#     2026-08-08). Emoji proper (incl. U+2705/U+2714+FE0F) stay banned.
check "emoji" -P '[\x{1F300}-\x{1FAFF}\x{2600}-\x{2712}\x{2714}-\x{27BF}\x{FE0F}]'

# 4 · Radius cap: nothing above rounded-2xl — raised from xl for the Lantern
#     feed pane's 16px (decision log 2026-08-08). No arbitrary radii.
check "radius over cap" -E '\brounded-(3xl|\[)'

# 5 · No shadows: raw box-shadow or Tailwind shadow utilities (shadow-none ok).
check "shadow" -E 'box-shadow:|\bshadow-(2xs|xs|sm|md|lg|xl|2xl|inner)\b'

if [ "$fail" -ne 0 ]; then
  say ""
  say "Design law failed. The law lives in this script; docs/plan/phase-4-plan.md §2·A2"
  say "explains it. If a rule must change, change it deliberately (PR + decision-log row)."
  exit 1
fi
say "✓ design law holds across ${#FILES[@]} product-source files."
