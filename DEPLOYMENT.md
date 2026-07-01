# Deployment Guide

Everything below assumes zero prior setup. Do these in order — the CLI tests your **live** URL, so steps 1–3 need to happen before any real loop iteration can be logged in `LOOP.md`.

## 1. Supabase (database + auth)

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql`.
3. Settings → API: copy `Project URL`, `anon public` key, and `service_role` key.
4. Settings → API → Realtime: confirm Realtime is enabled on the `rounds` and `bug_reports` tables (needed for live leaderboard updates).

## 2. Local env

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev   # sanity check at localhost:3000
```

## 3. Deploy to Vercel (must be public — no localhost for TestSprite)

```bash
npm i -g vercel
vercel login
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel --prod
```

Copy the resulting `https://your-app.vercel.app` URL — you'll need it for both `testsprite setup` and the README.

## 4. TestSprite CLI setup

```bash
npm i -g @testsprite/testsprite-cli
testsprite setup
# prompts for: API key (from your TestSprite account, after applying the
# hackathon promo code from Discord #hackathon-info), and your live URL
```

This installs the verification skill into your coding agent (Claude Code / Codex / whatever you're using) so it knows when and how to invoke the checker.

## 5. First loop iteration

```bash
testsprite test run --all --project "$PROJECT_ID" --wait --output json
```

Whatever fails, hand the failure bundle to your agent, fix the root cause, rerun, and have the agent append the real result to `LOOP.md` (see the format at the top of that file). Repeat for every feature.

## 6. Wire CI/CD (the +5 Innovation bonus)

1. GitHub repo → Settings → Secrets and variables → Actions → add:
   - `TESTSPRITE_API_KEY`
   - `TESTSPRITE_PROJECT_ID`
2. `.github/workflows/testsprite.yml` is already in this repo — it runs on every push/PR to `main` and fails the build on a non-zero CLI exit code.
3. Push to `main` once and confirm the Action goes green (or correctly red, if it catches something real — that's a good sign, not a bad one, for Loop Quality).

## 7. Submit

1. Confirm `README.md` has the live URL filled in at the top.
2. Confirm `LOOP.md` has real, honest entries (not placeholder text).
3. Confirm the GitHub repo is set to **Public**.
4. Post in Discord `#hackathon-submissions`: live URL, public repo link, TestSprite account email/name, demo video link (optional but boosts ranking).

Deadline: **Jul 7, 4:59 PM PDT**. No late entries.

## Rollback / troubleshooting

- Vercel build fails on `output: 'standalone'`: confirm `next.config.mjs` has `output: "standalone"` — required for the Docker image, harmless for the default Vercel deploy.
- Realtime not updating: check Supabase → Database → Replication that the relevant tables have replication enabled, not just Realtime toggled on in the client.
- TestSprite CLI can't reach the app: confirm the Vercel deployment isn't behind Vercel's password-protection/preview-auth — it must be a fully public URL.
