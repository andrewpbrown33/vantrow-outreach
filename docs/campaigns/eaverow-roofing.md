# Campaign · Eaverow → roofing contractors

**Status: DRAFT — Andrew customizes the words before this sends.**
Structure, cadence, threading and variables are decided; the prose is a starting point.

| | |
|---|---|
| Sends from | `andrew@eaverow.com` (the product speaks for itself — not a Vantrow case study) |
| Audience | 151 cleared roofing contractors (owner/president level, verified domain emails) |
| Steps | 6, one idea per email |
| Cadence | days 1 · 4 · 8 · 15 · 22 · 30, counted from each prospect's own release day |
| Release | the drip — a throttled, ramping daily trickle, not a batch |
| Window | Tue–Fri, 08:30–11:30, each prospect's timezone, US holidays skipped |
| Threading | steps 1–3 in one thread; **step 4 opens a second thread**; 5–6 reply under it |
| Variables | `{{firstName}}`, `{{company}}` — both present for all 151, so nothing blocks |
| Price quoted | **$199/month flat, $99/month founding rate** (Andrew, 29 Sep) |

Every send carries `List-Unsubscribe`; a reply — including "no thanks" — stops the
sequence and suppresses the address across the workspace, which means it also
protects the Vantrow follow-up that goes to non-responders later.

**Domain auth checked 23 Sep:** eaverow.com has SPF, DKIM (selector `google`) and
DMARC (`p=none`, reporting to `andrew@eaverow.com`). Authentication is correct; send
reputation is what the 5/day ramp is building.

> ## ⚠ Gated on the Eaverow site catching up
>
> These emails quote **$199/month flat, $99/month founding**. Andrew decided on
> 29 Sep to move Eaverow from the one-price payoff model to a **perpetual
> subscription** at those numbers, superseding the $18,000-once / $300-a-month
> structure decided 2026-08-06.
>
> That change is in flight in `vantrow-acculynx`, and it is not a copy edit: it
> retires the "Software you finish paying for" promise, the locked sticker and
> `paid_off` lifecycle in migration 0011, the Stripe schedules that cancel the
> subscription once a balance clears, and the layaway-not-credit legal structuring
> in `docs/plan/one-price.md`.
>
> **Do not start this campaign until eaverow.com serves $199/$99.** A prospect who
> opens email 1, believes it, and lands on a page selling an $18,000 one-time build
> is a prospect lost at the strongest moment the sequence has.

---

## Thread A · the number

### Step 1 — day 1 — *however many people you hire*

> {{firstName}} — Eaverow is roofing software: estimating, job tracking and pipeline in one place. The part worth thirty seconds is how it's priced.
>
> $199 a month for {{company}}. Not per seat, not per user, not per job — one number, however many people you hire. Add three crews in June and it's still $199.
>
> It exists because a roofing company got tired of paying per seat for software half their people barely opened, and asked me to build the parts they actually used. It runs their business now, and it's open to other roofing companies.
>
> How does your availability look this week or early next to take a look?
>
> All the best,
> Andrew
> Eaverow

### Step 2 — day 4 — same thread — *what it actually does*

> {{firstName}} — following up with specifics, since "roofing software" could mean nearly anything.
>
> What's in it: estimates that become jobs without retyping, a board that shows where every roof actually is, a pipeline you can read from your phone, and the photo and document trail that keeps a supplement from falling apart six weeks later.
>
> What's not in it: the modules nobody at {{company}} would ever open. That's deliberate, and it's most of why one flat number works.
>
> Worth fifteen minutes? I'll share my screen and you can tell me what's missing.

### Step 3 — day 8 — same thread — *the part everyone actually worries about*

> {{firstName}} — last one on this thread.
>
> The honest objection to anything like this is switching. Nobody wants to move three years of jobs and retrain a crew in the middle of season, and I wouldn't either.
>
> Two things about that. You don't have to move anything to look. And if you did move, we do the migration — I'd rather spend a week importing your history than lose a good fit over it.
>
> If it's not a fit, say so and I'll stop. If it's a "maybe in the off-season," tell me that instead and I'll check back when the season ends.

---

## Thread B · the math — **step 4 starts a new thread**

### Step 4 — day 15 — new subject — *what {{company}} pays per seat in June*

> {{firstName}} — different note, and a smaller question than my last one. Andrew, from Eaverow.
>
> Most roofing software is priced per user per month. That's fine in January. By June you've added crews and a couple of office people, and the bill scales with your headcount whether or not those seats get used the same way.
>
> Run your own number: what you pay per seat, times everyone who needs a login in your busiest month, times sixty months. For a twelve-person shop on AccuLynx that lands somewhere between $118,800 and $216,000 over five years. Eaverow across the same five years is $11,940, because the number doesn't move when you hire.
>
> I'd like to know what {{company}} actually pays, all in, and how many seats that covers. Reply with a number if you're willing — nothing attached to it.

### Step 5 — day 22 — same thread — *the founding rate, and why it ends*

> {{firstName}} — one thing I should have said earlier, because it has an end.
>
> Companies coming on now pay $99 a month instead of $199, and keep that rate for good. There are fifty founding places, and forty of them are held for roofing companies I write to directly — which is the reason you're reading this at all.
>
> It's limited for a real reason rather than a manufactured one: early customers get something I can't offer everyone later, which is that their requests actually get built. The roadmap today is mostly one roofing company's list. I'd rather it were several.
>
> So if there's a piece of running {{company}} that no software has ever handled properly — the thing still living on a whiteboard, in a spreadsheet, or in one person's head — this is the window where it gets built in a few weeks instead of never.
>
> Worth a conversation while a founding place is open?

### Step 6 — day 30 — same thread — *closing the loop*

> Hi {{firstName}},
>
> Closing the loop on this one. eaverow.com has the details if it's ever useful, and I'll leave it there otherwise.
>
> One last question, and it's a real one rather than a hook: if you're happy with what {{company}} runs on today, I'd like to know what it is and what makes it worth the money. I learn more from the people who say no than from the ones who say yes.
>
> Either way — good season.
>
> All the best,
> Andrew
> Eaverow · [POSTAL ADDRESS — Andrew to supply]
>
> Reply "no thanks" and you're off my list for good.

---

## Notes for whoever edits this

**This file is the source, not a copy of one.** `scripts/seed-campaign.mjs`
reads these headings and blockquotes and builds the sequence from them, so
editing the prose here and re-running the script is how the campaign changes —
there is no retyping into a form, and a draft sequence is rewritten in place
rather than duplicated. The heading format is load-bearing:
`### Step N — day D — [same thread —] *subject*`, where the italic subject is
required on any step that opens a thread and omitted on one that replies.

- **Step 4 must keep its own subject line.** It is the thread-B root; the engine derives steps 5–6 from it. A blank subject there parks the enrollment rather than sending.
- Steps 2, 3, 5, 6 have no subject of their own by design — the engine writes `Re: <thread root>` at send time so Gmail keeps the conversation.
- The postal address is supplied with `--address` at seed time, not edited in here.

### The arithmetic, so it can be re-checked rather than trusted

- $199 × 60 months = **$11,940**, the five-year figure in step 4.
- $99 × 60 = $5,940, if the founding rate is ever quoted over five years.
- The AccuLynx range ($118,800–$216,000 over five years for a twelve-person shop)
  is **eaverow.com's own published comparison**, not a number invented here. It
  implies roughly $165–$300 per seat per month. If that range changes on the site,
  change it here in the same edit.

### Where a real number would make this stronger

- **The cohort numbers in step 5 are real, not decorative.** `packages/growth/src/pricing.ts`
  in `vantrow-acculynx` sets `foundersCap: 50` and `foundersAllocated: 40`, and its
  own comment says the forty are "held for the direct outreach campaign (the
  several-hundred-company roofing list)" — this campaign. The copy claims places
  exist without promising anyone a specific one, which is the honest form: 151 emails
  against 40 held places only oversells at a conversion rate we will not see.
- **Step 1** — if the first roofing company will be named, "it runs {Company}'s business now" beats "a roofing company." A named reference is the biggest single lift available here.
- **Step 2** — one specific thing Eaverow does that AccuLynx does badly, named concretely, is worth more than the whole feature list.

### Note for the Vantrow follow-up

Step 6 promises "you're off my list for good" on a reply — scoped to Andrew, not to
Eaverow, so it holds across both campaigns. The Vantrow follow-up only reaches people
whose enrollment ended `finished_no_reply`, meaning they never replied at all and
never invoked that promise. The follow-up should still open by acknowledging the
earlier thread rather than pretending to be a first contact.
