# Runbook 01 — Make This Repository Private

**Who:** Andrew (repository owner).
**Prereqs:** logged into GitHub as `andrewpbrown33`.
**Time:** under 2 minutes.
**When:** now — this is the **Gate 1 precondition**. No research content, founder
screenshots, or the research brief can be committed while the repo is public
(clean-room protocol §4).

## Steps

1. Open https://github.com/andrewpbrown33/vantrow-outreach/settings — the repository's
   **Settings** tab (not your account settings).
2. Scroll to the bottom: the **Danger Zone**.
3. On **"Change repository visibility"** click **Change visibility** → **Make private**.
4. GitHub asks you to confirm by typing the repository name — type
   `andrewpbrown33/vantrow-outreach` and confirm.

That's all. Forks don't exist yet, CI (GitHub Actions) keeps working on private repos,
and the Claude session's access is unaffected (it authenticates; it never needed the
repo to be public).

## You're done when

- The repository's main page shows a **Private** badge next to the name
  `vantrow-outreach`.

## While you're there (recommended, 2 more minutes)

`vantrow-acculynx` is currently **public**, but its own README says it must stay
private — it contains competitor UI references under its clean-room protocol §4. Repeat
the same steps at https://github.com/andrewpbrown33/vantrow-acculynx/settings.
