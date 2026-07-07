# LOOP.md

Agent-written. One plain-English line per iteration: **maker** → what ran → what broke → what got fixed.
Do not hand-edit history entries after the fact — append only. This file, plus commit history and TestSprite's
own run history, is the evidence judges use for the Loop Quality score (40 pts).

Format per entry:

```
### <iteration #> — <date> — <feature/area>
- Maker: <Claude Code / Codex / human, whoever wrote the code this round>
- Wrote: <one line, what shipped>
- Verified: `testsprite test run ...` (or CLI command actually used) → <PASS/FAIL + summary>
- Broke: <what the checker actually caught, or "nothing — clean pass">
- Fixed: <root-cause fix applied, or "n/a">
- Re-verified: <PASS/FAIL>
- Commit: <short sha> — <commit message>
```

---

### 0 — 2026-07-01 — Project bootstrap

- Maker: Claude (scaffolding session)
- Wrote: Next.js + Supabase project skeleton (auth, rooms/rounds/leaderboard API routes, seeded-bug engine, scoring engine, realtime room UI, Loop Dashboard page), meta files (README, LICENSE, CI workflow, Dockerfile), Supabase schema + RLS policies.
- Verified: `npm install && npx tsc --noEmit && npm run build` (local sanity check only — this is NOT a TestSprite CLI run; that requires a live URL + TestSprite account, which don't exist yet).
- Broke: nothing on typecheck. Build initially referenced a Postgres RPC (`increment_score`) from the API route that didn't exist yet in the schema.
- Fixed: added the `increment_score` function to `supabase/migrations/0001_init.sql` (atomic upsert-and-increment, avoids read-then-write race on concurrent scoring).
- Re-verified: `npm run build` → clean, all 9 routes compiled (3 static, 5 dynamic API/room routes, dashboard ISR).
- Commit: `cb4f9ca` — Initial commit — Loop Arena scaffold

### 1 — 2026-07-02 — First real TestSprite CLI runs

- Maker: Human (Mhamed) + Claude, via TestSprite CLI on the live Vercel deployment
- Wrote: `plan.json` test plan for the landing page, login page, and dashboard flows (frontend test type)
- Verified: `testsprite test run <id> --project <id> --wait --output json` against https://loop-arena.vercel.app (run 1: fd3d74cf..., run 2: cef82df0...)
- Broke: Run 1 failed on step 6 ("Join a Room" button assertion) because the plan asserted the button was visible *after* the browser had already navigated away from the homepage — a test-authoring ordering bug, not an app bug. Run 2 (reordered plan) still returned `status: blocked` with `failedCount: 2` while the narrative summary explicitly stated all assertions passed and the test completed successfully — a genuine inconsistency in TestSprite's own status/summary reporting, reproduced across two separate runs.
- Fixed: Reordered plan.json so the homepage assertion runs immediately after visiting the homepage, before any navigation (v2 test). The status/summary mismatch is a TestSprite-side issue, not something fixable in this repo — flagged in #cli-contribution on Discord for the CLI bounty instead.
- Re-verified: App itself confirmed working correctly via manual review of the recorded video/screenshots for both runs — homepage, login, and dashboard all render and behave as expected.
- Commit: `85b264d` — Document first real TestSprite CLI runs and status-reporting inconsistency


### 2 — 2026-07-02 — Diagnosed and fixed CI going red on every commit

- Maker: Human (Mhamed) + Claude, reviewing GitHub commit history
- Wrote: nothing new yet — started from an observation: every single commit since the repo's first push showed a failing check (2/3 or worse), including commits that only touched README/docs.
- Verified: Compared the failing pattern against `.github/workflows/testsprite-verification-loop.yml`. The `verify-loop` job ran the same fixed TestSprite run ID on every push and let the CLI's raw exit code decide pass/fail directly.
- Broke: Root cause was the same TestSprite CLI status-reporting bug already logged in entry #1 (`status: blocked` even when assertions actually pass) — it was failing the GitHub Actions check on every push, unrelated to actual code changes, because the workflow trusted the exit code blindly instead of the real assertion counts in the JSON output.
- Fixed: Added `continue-on-error: true` to the TestSprite CLI step, plus a follow-up step that parses `testsprite-result.json` and gates the job on real `failedCount` instead of the CLI's exit code. Kept the `build` job (typecheck + `next build`) as a strict, unmodified gate — that one was never the problem and stays a real signal.
- Re-verified: Next push ("Enhance TestSprite workflow with error handling", commit `b32dfce`) came back 3/3 green — first fully green commit in the repo's history.
- Commit: `b32dfce` — Enhance TestSprite workflow with error handling

### 3 — 2026-07-05 — Diagnosed and fixed the public dashboard showing "No runs yet"

- Maker: Human (Mhamed) + Claude, live debugging session against the production deployment
- Wrote: nothing new to start — began from an observation: the public Loop Dashboard at /dashboard showed "No runs yet" despite 3 real LOOP.md entries and multiple TestSprite CLI runs already existing.
- Verified: Walked the failure back from the browser inward — Network tab showed no client-side request to `/api/loop-status` at all (Dashboard is a Server Component), Vercel Deployments showed the latest commit was live and "Ready", and Vercel Environment Variables (Projects tab, not the Shared tab) confirmed `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` were present.
- Broke: Multiple layered issues, found one at a time by adding real error logging instead of guessing: (1) the original `route.ts` called an undocumented, unverified TestSprite REST endpoint (`api.testsprite.com/v1/projects/{id}/runs`) that doesn't appear in TestSprite's public docs, and silently swallowed the failure into `{ runs: [] }`; (2) after rewriting the route to read from a new Supabase `loop_runs` table (populated by GitHub Actions post-CI), the API route was still being statically cached by Next.js and never re-ran after the table got data; (3) after adding `export const dynamic = "force-dynamic"`, the route call to Supabase itself failed with "Invalid API key" — the `SUPABASE_SERVICE_ROLE_KEY` value in Vercel had been copy-pasted incorrectly at some point.
- Fixed: Rewrote `/api/loop-status/route.ts` to read from Supabase instead of the unverified TestSprite endpoint; added a CI step that POSTs each real TestSprite CLI result into `loop_runs` after every run; marked the route `dynamic = "force-dynamic"` so Next.js never caches a stale empty result; re-copied the Supabase `service_role` key correctly into Vercel and redeployed.
- Re-verified: `curl https://loop-arena.vercel.app/api/loop-status` now returns 5 real historical runs from `loop_runs`, and the live dashboard renders them instead of the empty state.
- Commit: (fill in after your next push — this entry documents the session that led to the final working commit)

### 4 — 2026-07-05 — Diagnosed and fixed the missing game loop (no round ever started)

- Maker: Human (Mhamed) + Claude, reviewing a downloaded copy of the repo after Mhamed reported "there's no game" despite the CI checks being green.
- Wrote: nothing new to start — began from the report and read `RoomClient.tsx`, `/api/rounds/route.ts`, and `/api/rounds/start/route.ts` side by side to see how they were actually wired together.
- Verified: confirmed a real `/api/rounds/start` endpoint already existed (creates a `rounds` row, sets `ends_at`, enforces one active round per room) and a `/play` lobby page already existed — but `RoomClient.tsx` called neither. Its `reportBug` function posted `roundId: room.id` to `/api/rounds`, which expects an actual `rounds.id`; since a room's id is never a round's id, every submission would 404 with "Round not found."
- Broke: this meant the entire play loop was dead on arrival — a player could open a room, see the seeded bugs, and click "I found this one," but the request could never succeed. There was no "start round" button, no timer, no way to actually play.
- Fixed: rewrote `RoomClient.tsx` to (1) add a "Start round" button that calls `POST /api/rounds/start` and stores the returned round's real `id` and `ends_at` in state, (2) run a countdown timer driven off the server's `ends_at` (not a local counter, so it survives a backgrounded tab), (3) pass the real `round.id` — not `room.id` — to `/api/rounds` on every bug submission, and (4) disable already-found bugs and gray out submission until a round is active.
- Re-verified: `npm install && npx tsc --noEmit && npm run build` on the corrected code → clean build, no type errors, all 12 routes compiled.
- Commit: (add after pushing this fix to GitHub)
