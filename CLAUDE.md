# CLAUDE.md — sqrz-profiles

See the root `CLAUDE.md` (one level up, shared across all SQRZ repos) for cross-repo/DB context.

## Branches
- Will works from main. Cloud sessions start on a claude/... branch — that is fine while working, but every task ends with: merge into main, push main, delete the claude/ branch (remote and local).
- Only stay on a branch if Will explicitly says "keep it on a branch".
- If a merge conflicts, stop and report — don't push.
- Last line of every report: "Branch: <name> · Commit: <hash> · Pushed to main: yes/no"

## 2026-11-09 — plan_id / intent_events cleanup
`profiles.plan_id` and the `plans` table are being dropped (migration in sqrz-dashboard, not applied). This repo no longer selects or reads `plan_id`: removed from the `[slug]`/`page`/`privacy` selects, `lib/inquiry-server.ts`, `Services.tsx` (`planId` prop), and the tracking hook (`userTier` prop / `user_tier` event property — nothing read it). The privacy page's "Payments (Stripe)" section was shown only when `plan_id != null`; Stripe checkout on profile pages was retired, so the section is removed rather than shown to everyone. `components/LeadCapture.tsx` (the only writer of the non-existent `intent_events` table, imported nowhere) deleted.
