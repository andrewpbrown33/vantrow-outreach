"use client";

/** Composer inputs whose {{variables}} take colour as you type.
 *
 *  The trick is two layers with IDENTICAL text metrics: a backdrop div renders
 *  the tokenized text (variables washed in the clarity highlight; unknown
 *  names in alert red), and the real textarea sits on top with transparent
 *  text and a visible caret. Colour and background are the only things a
 *  token changes — never weight or size, which would shear the layers apart.
 *
 *  Chrome, not state: the highlight wash and alert red are brand tokens. The
 *  pinned state palette stays reserved for enrollment states (two-palette
 *  law), and an editor affordance is not a state.
 */

import { useRef } from "react";
import { tokenizeTemplate } from "../lib/template-tokens";

const TOKEN_CLASS = {
  known: "rounded-sm bg-highlight text-foreground",
  // mark's UA default is a yellow ground — flatten it so only the red speaks.
  unknown: "bg-transparent text-alert",
} as const;

function BackdropContent({
  value, known, placeholder,
}: { value: string; known: ReadonlySet<string>; placeholder?: string }) {
  if (value.length === 0 && placeholder) {
    return <span className="text-muted">{placeholder}</span>;
  }
  return (
    <>
      {tokenizeTemplate(value, known).map((t, i) => (
        t.kind === "text"
          ? <span key={i}>{t.text}</span>
          : <mark key={i} className={TOKEN_CLASS[t.kind]}>{t.text}</mark>
      ))}
      {/* A trailing newline the textarea renders but a div collapses —
          without it the caret outruns the backdrop on the last empty line. */}
      {value.endsWith("\n") ? "\n" : null}
    </>
  );
}

interface VarTextProps {
  name: string;
  value: string;
  onChange: (next: string) => void;
  known: ReadonlySet<string>;
  placeholder?: string;
  rows?: number;
  /** Font classes shared by BOTH layers — metrics must match exactly. */
  textClass?: string;
}

/** Multi-line composer body. */
export function VarTextarea({
  name, value, onChange, known, placeholder, rows = 6,
  textClass = "font-mono text-[12.5px]",
}: VarTextProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  return (
    <span className="relative block w-full overflow-hidden rounded-lg border border-line bg-panel focus-within:border-sub">
      <div
        ref={backdropRef} aria-hidden
        className={`pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-3 py-2 text-foreground ${textClass}`}
      >
        <BackdropContent value={value} known={known} placeholder={placeholder} />
      </div>
      <textarea
        name={name} rows={rows} value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => {
          const b = backdropRef.current;
          if (b) {
            b.scrollTop = e.currentTarget.scrollTop;
            b.scrollLeft = e.currentTarget.scrollLeft;
          }
        }}
        className={`relative block w-full resize-y bg-transparent px-3 py-2 text-transparent caret-foreground outline-none ${textClass}`}
        spellCheck={false}
      />
    </span>
  );
}

/** Single-line variant for subjects. Enter is swallowed and pasted newlines
 *  are flattened — a subject is one line by definition. */
export function VarLine({
  name, value, onChange, known, placeholder,
  textClass = "text-[13.5px]",
}: Omit<VarTextProps, "rows">) {
  const backdropRef = useRef<HTMLDivElement>(null);
  return (
    <span className="relative block w-full overflow-hidden rounded-lg border border-line bg-panel focus-within:border-sub">
      <div
        ref={backdropRef} aria-hidden
        className={`pointer-events-none absolute inset-0 overflow-hidden whitespace-pre px-3 py-2 text-foreground ${textClass}`}
      >
        <BackdropContent value={value} known={known} placeholder={placeholder} />
      </div>
      <textarea
        name={name} rows={1} value={value}
        onChange={(e) => onChange(e.target.value.replace(/[\r\n]+/g, " "))}
        onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        onScroll={(e) => {
          const b = backdropRef.current;
          if (b) b.scrollLeft = e.currentTarget.scrollLeft;
        }}
        className={`relative block w-full resize-none overflow-x-auto whitespace-pre bg-transparent px-3 py-2 text-transparent caret-foreground outline-none [scrollbar-width:none] ${textClass}`}
        spellCheck={false}
      />
    </span>
  );
}
