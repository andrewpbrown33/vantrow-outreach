/** Placeholder shell. The real surfaces (Activity home, Sequences overview,
 *  sequence detail) are built from the approved deck v2.1 — that is the next
 *  chunk of workstream C, and this page exists so the app deploys and the
 *  cron route has a host. */
export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight text-brand-dark">
        Nudgerow
      </h1>
      <p className="mt-4 text-muted">
        The engine runs on a one-minute heartbeat. Product surfaces are next.
      </p>
    </main>
  );
}
