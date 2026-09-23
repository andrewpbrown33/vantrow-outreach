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

Every send carries `List-Unsubscribe`; a reply — including "no thanks" — stops the
sequence and suppresses the address across the workspace, which means it also
protects the Vantrow follow-up that goes to non-responders later.

**Domain auth checked 23 Sep:** eaverow.com has SPF, DKIM (selector `google`) and
DMARC (`p=none`, reporting to `andrew@eaverow.com`). Authentication is correct; send
reputation is what the 5/day ramp is building.

---

## Thread A · the money

### Step 1 — day 1 — *AccuLynx without the AccuLynx bill*

> {{firstName}} — Eaverow is roofing software: estimating, job tracking and pipeline in one place. The short version of why it exists is that a roofing company got tired of what they were paying per seat and asked me to build the parts they actually used.
>
> So I did. It's running their business now, and it's open to other roofing companies. Same core workflow, a fraction of the price.
>
> We're early and I'm not going to pretend otherwise — that's most of the appeal. You'd pay a lot less, and you'd have real say in what gets built next.
>
> How does your availability look this week or early next to take a quick look?
>
> All the best,
> Andrew
> Eaverow

### Step 2 — day 4 — same thread — *what it actually does*

> {{firstName}} — following up with specifics, since "roofing software" could mean nearly anything.
>
> What's in it: estimates that become jobs without retyping, a board that shows where every roof actually is, a pipeline you can read from your phone, and the photo and document trail that keeps a supplement from falling apart six weeks later.
>
> What's not in it: the modules nobody at {{company}} would ever open. That's deliberate, and it's most of why the price is what it is.
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
> I'd genuinely like to know what {{company}} pays for software, all in, and how many seats that covers. Partly because I want to know how bad it's gotten across the industry, and partly because if it's the number I suspect, Eaverow will look obvious without me arguing for it.
>
> Reply with a number if you're willing. Nothing attached to it.

### Step 5 — day 22 — same thread — *the offer I should have led with*

> {{firstName}} — being early is the actual pitch, so let me make it properly.
>
> The companies that come on now get their requests built rather than filed. The roadmap today is mostly one roofing company's list, and I'd rather it were several — that's how this gets good.
>
> So: if there's a piece of running {{company}} that no software has ever handled properly — the thing still living on a whiteboard, in a spreadsheet, or in one person's head — that's the sort of thing that gets built in a few weeks here instead of never.
>
> Worth a conversation?

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

### Where a real number would make this stronger

Nothing below is invented in the copy above, deliberately — but Andrew knows
things I don't, and each of these would sharpen an email:

- **Step 1** — if the client will be named, "it's running [Company]'s business now" beats "a roofing company." A named reference is the single biggest lift available here.
- **Step 2** — one specific thing Eaverow does that AccuLynx does badly, named concretely, is worth more than the whole feature list.
- **Step 4** — if Eaverow's own per-seat price can be stated, stating it converts better than withholding it. The email works either way.

### Note for the Vantrow follow-up

Step 6 promises "you're off my list for good" on a reply — scoped to Andrew, not to
Eaverow, so it holds across both campaigns. The Vantrow follow-up only reaches people
whose enrollment ended `finished_no_reply`, meaning they never replied at all and
never invoked that promise. The follow-up should still open by acknowledging the
earlier thread rather than pretending to be a first contact.
