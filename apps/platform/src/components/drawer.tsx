"use client";

import { useState } from "react";

/** Schedule & rules, collapsed by default (R-4D-4). The cue line carries the
 *  summary so the closed state still answers "when does this send?". */
export function Drawer({
  title, cue, children,
}: { title: string; cue: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-line bg-background">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[12.5px] font-bold text-sub"
      >
        {title}
        <span className="ml-auto text-[11.5px] font-normal text-muted">
          {cue} <span aria-hidden="true">▾</span>
        </span>
      </button>
      {open ? (
        <div className="border-t border-line px-3.5 pt-2.5 pb-3 text-[12.5px]">{children}</div>
      ) : null}
    </div>
  );
}
