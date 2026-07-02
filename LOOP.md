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
