"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FEED_KINDS, countByKind, daySlug, peopleLabel, shortAge,
  type FeedItem, type FeedKind,
} from "../lib/feed";
import { Monogram } from "./ui";

/** The activity feed: the Pulse, on the night ground, inside the light room.
 *
 *  The picker IS the reports (R-4D-2) — each menu row is the same feed with
 *  one filter and its own count, so "replies", "bounces" and "finished" are
 *  three menu rows rather than three pages. */
export function PulseFeed({
  items, queuedToday,
}: { items: FeedItem[]; queuedToday: number }) {
  const [filter, setFilter] = useState<FeedKind | "all">("all");
  const [menuOpen, setMenuOpen] = useState(false);

  const counts = useMemo(() => countByKind(items), [items]);
  const shown = filter === "all" ? items : items.filter((i) => i.kind === filter);
  const current = filter === "all"
    ? "Everything"
    : FEED_KINDS.find((k) => k.key === filter)?.label ?? "Everything";

  const now = new Date();
  // Day slugs are derived, not accumulated: a row shows one when its day
  // differs from the row above it.
  const dated = shown.map((item, i) => {
    const slug = daySlug(item.at, now);
    return { item, slug, showSlug: i === 0 || slug !== daySlug(shown[i - 1].at, now) };
  });

  return (
    <div className="on-night rounded-2xl bg-night pt-1.5 pb-2.5 text-night-fg">
      <div className="flex items-center justify-end px-4.5 pt-2.5 text-xs">
        <span className="text-[11.5px] font-semibold text-state-replied">
          <span aria-hidden="true" className="mr-1.5 align-[1px] text-[9px]">●</span>
          Live · {queuedToday} queued today
        </span>
      </div>

      <div className="relative flex justify-center px-2 pt-0.5 pb-1.5">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg px-3 py-1 text-[14.5px] font-bold text-night-fg"
        >
          {current}
          <span className="ml-1.5 text-[11px] font-normal text-night-sub" aria-hidden="true">▾</span>
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute top-full left-1/2 z-10 w-56 -translate-x-1/2 rounded-xl border border-line bg-panel p-1.5 text-foreground"
          >
            <MenuRow
              label="Everything" n={items.length} current={filter === "all"}
              onClick={() => { setFilter("all"); setMenuOpen(false); }}
            />
            {FEED_KINDS.map((k) => (
              <MenuRow
                key={k.key} label={k.label} n={counts[k.key]}
                current={filter === k.key}
                onClick={() => { setFilter(k.key); setMenuOpen(false); }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {shown.length === 0 ? (
        <p className="border-t border-night-line px-4.5 py-6 text-[13.5px] text-night-sub">
          Nothing here yet.
        </p>
      ) : null}

      {dated.map(({ item, slug, showSlug }) => (
        <div key={item.key}>
          {showSlug ? (
            <div className="px-4.5 pt-2 pb-0.5 text-[11.5px] font-bold text-night-sub">{slug}</div>
          ) : null}
          <Row item={item} now={now} />
        </div>
      ))}
    </div>
  );
}

function MenuRow({
  label, n, current, onClick,
}: { label: string; n: number; current: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={current}
      onClick={onClick}
      className={`flex w-full justify-between gap-4 rounded-md px-2.5 py-1.5 text-left text-[13px] ${current ? "bg-brand-accent font-semibold" : ""}`}
    >
      {label}
      <span className="font-mono text-[11px] text-muted">{n}</span>
    </button>
  );
}

function Row({ item, now }: { item: FeedItem; now: Date }) {
  const { lead, rest } = peopleLabel(item.people);
  // A collapsed row stacks up to three monograms, which needs a wider gutter
  // than a single one — otherwise the stack runs under the name. Both class
  // strings are written out because Tailwind only generates what it can see.
  const gutter = item.people.length > 1
    ? "grid-cols-[76px_1fr]"
    : "grid-cols-[42px_1fr]";
  return (
    <div className={`grid ${gutter} gap-3 border-t border-night-line px-4.5 pt-2.5 pb-3 text-sm leading-snug`}>
      <span className="flex items-center">
        {item.people.slice(0, 3).map((p, i) => (
          <span key={`${p.id ?? p.name}-${i}`} className={i > 0 ? "-ml-1.5" : ""}>
            <Monogram
              initials={p.initials}
              tone={item.tone}
              badge={i === 0 ? item.badge : null}
              size={item.people.length > 1 ? "sm" : "md"}
            />
          </span>
        ))}
      </span>
      <span>
        <span className="font-bold">
          {item.people[0]?.id ? (
            <Link href={`/prospects?q=${encodeURIComponent(item.people[0].name)}`}
              className="border-b-2 border-brand-accent font-bold text-white no-underline">
              {lead}
            </Link>
          ) : lead}
          {rest ? <span className="font-normal text-night-sub"> {rest}</span> : null}
          {" "}
          <span className="font-normal text-night-sub">{item.verb}</span>
          <span className="ml-1.5 text-xs font-normal tabular-nums text-night-time">
            {shortAge(item.at, now)}
          </span>
        </span>

        {item.quote ? (
          <span className="my-1.5 block border-l-2 border-night-line py-1.5 pr-2 pl-3 text-[13.5px] text-night-quote">
            {item.quote}
          </span>
        ) : null}

        {(item.detail || item.sequenceName) ? (
          <span className="mt-0.5 block text-[12.5px] text-night-sub">
            {item.detail}
            {item.detail && item.sequenceName ? " · " : ""}
            {item.sequenceName && item.sequenceId ? (
              <Link href={`/sequences/${item.sequenceId}`}
                className="border-b-2 border-camel font-semibold text-night-fg no-underline">
                {item.sequenceName}
              </Link>
            ) : null}
          </span>
        ) : null}

        {item.threadUrl ? (
          <span className="mt-2 flex flex-wrap gap-5 text-xs text-night-sub">
            <a href={item.threadUrl} target="_blank" rel="noreferrer" className="font-semibold">
              View thread
            </a>
          </span>
        ) : null}
      </span>
    </div>
  );
}
