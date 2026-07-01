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
- Commit: (pending first commit — see git instructions in DEPLOYMENT.md)

<!--
Next real entries start once:
1. `npm run build` succeeds locally
2. The app is deployed to a public Vercel URL
3. `testsprite setup` has been run against that URL
4. The first `testsprite test run` has actually executed

Every entry from here on must correspond to a real CLI run — do not write entries for runs that didn't happen.
-->
