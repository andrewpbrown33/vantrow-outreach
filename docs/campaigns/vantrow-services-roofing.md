# Campaign · Vantrow services → roofing contractors

**Status: DRAFT — Andrew customizes the words before this sends.**
Structure, cadence, threading and variables are decided; the prose is a starting point.

| | |
|---|---|
| Sends from | `andrew@getvantrow.com` (Vantrow, not a product brand) |
| Audience | 151 cleared roofing contractors (owner/president level, verified domain emails) |
| Steps | 6, one offer per email, AccuLynx first |
| Cadence | days 1 · 4 · 8 · 15 · 22 · 30, counted from each prospect's own release day |
| Release | the drip — a throttled, ramping daily trickle, not a batch |
| Window | Tue–Fri, 08:30–11:30, each prospect's timezone, US holidays skipped |
| Threading | steps 1–3 in one thread; **step 4 opens a second thread**; 5–6 reply under it |
| Variables | `{{firstName}}`, `{{company}}` — both present for all 151, so nothing blocks |

Every send carries `List-Unsubscribe`; a reply — including "no thanks" — stops the
sequence and suppresses the address across the workspace.

---

## Thread A · software

### Step 1 — day 1 — *AccuLynx, at a fraction of the cost*

> {{firstName}} — I build software products for clients, and a roofing company hired us to replicate the AccuLynx platform without the AccuLynx price. So we did — it's called Eaverow: the same core estimating, job tracking, and pipeline, at a fraction of the cost.
>
> It's live, and now we're looking for two things: roofing companies like {{company}} who want it, and the next overpriced platform worth rebuilding.
>
> I'm happy to discuss further if you think you're overpaying for your software stack. How does your availability look this week or early next to chat?
>
> All the best,
> Andrew

### Step 2 — day 4 — same thread — *custom builds*

> {{firstName}} — the other half of what we do, in case it fits {{company}} better than an off-the-shelf platform.
>
> If a piece of the business still runs on spreadsheets, a whiteboard, or one person's memory, that's usually a small custom build rather than a big software purchase. Recent ones: crew scheduling that survives a storm week, a supplement tracker that stops money leaking, a customer portal that kills the "where's my job at?" phone calls.
>
> Worth fifteen minutes to see whether anything at {{company}} is worth building? How's your week looking?

### Step 3 — day 8 — same thread — *the overpay hook*

> {{firstName}} — last one on this thread, and it's a genuine question rather than a pitch.
>
> What's the software line item at {{company}} you resented paying this year?
>
> That's honestly how we choose what to build next. Name the tool and I'll tell you straight whether it's worth rebuilding.

---

## Thread B · visibility — **step 4 starts a new thread**

### Step 4 — day 15 — new subject — *showing up when someone Googles a roofer nearby*

> {{firstName}} — different subject than my last note. Andrew at Vantrow.
>
> Most roofing companies we talk to have a Google Business Profile nobody has touched in two years, and no real service pages behind it. That's the cheapest lead source there is, and it's usually sitting broken: the profile goes stale, the services aren't listed the way people search for them, and the reviews stop.
>
> Want me to take ten minutes, look at what {{company}} shows a homeowner searching today, and send you what I find? No charge, and no obligation if you'd rather fix it yourself.

### Step 5 — day 22 — same thread — *answer engine optimization*

> {{firstName}} — the newer version of the same problem, and the one I'd move on first if {{company}} were mine.
>
> More homeowners are asking ChatGPT and Google's AI "who should I call for a roof replacement" instead of scrolling results. Those answers get assembled from what exists about a company across the web — not from anything you can buy. There's real work to become the company that gets named, and almost nobody in roofing is doing it yet.
>
> Fifteen minutes and I'll show you what it takes. Does later this week work?

### Step 6 — day 30 — same thread — *close-out*

> Hi {{firstName}},
>
> I hope all has been well. Closing the loop on this one — getvantrow.com shows what we build, if it's ever useful: custom software, the AccuLynx alternative, and the Google and AI visibility work.
>
> And if there's software you feel overcharged for, tell me which one. It might be the next platform we rebuild.
>
> Either way, good roofing season — and if you'd rather not hear from me, reply "no thanks" and I won't write again.
>
> All the best,
> Andrew
> Vantrow · [POSTAL ADDRESS — Andrew to supply]

---

## Notes for whoever edits this

**This file is the source, not a copy of one.** `scripts/seed-campaign.mjs`
reads these headings and blockquotes and builds the sequence from them, so
editing the prose here and re-running the script is how the campaign changes —
there is no retyping into a form, and a draft sequence is rewritten in place
rather than duplicated. The heading format is load-bearing:
`### Step N — day D — [same thread —] *subject*`, where the italic subject is
required on any step that opens a thread and omitted on one that replies.

- **Step 1 is already Andrew's approved wording** (v4, from the outreach review). Change it last.
- **Step 4 must keep its own subject line.** It is the thread-B root; the engine derives steps 5–6 from it. A blank subject there parks the enrollment rather than sending.
- Steps 2, 3, 5, 6 have no subject of their own by design — the engine writes `Re: <thread root>` at send time so Gmail keeps the conversation.
- The postal address is required before this can send: cold commercial email carries one.
