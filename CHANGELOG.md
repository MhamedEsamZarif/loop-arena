# Changelog

All notable changes to Loop Arena are documented here, newest first.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Initial project scaffold: Next.js 15 (App Router, TypeScript strict), Tailwind, Supabase client setup.
- Folder structure for game rooms, leaderboard, and Loop Dashboard.
- Seeded-bug engine skeleton (`src/lib/bugs`).
- Scoring engine skeleton (`src/lib/game-engine`).
- Supabase schema migration (`supabase/migrations/0001_init.sql`): users, rooms, rounds, bug_reports, scores.
- Required hackathon files: `README.md`, `LOOP.md`, `LICENSE`, `.env.example`, `.gitignore`.
- `Dockerfile` + `docker-compose.yml` for containerized local dev.
- `.github/workflows/testsprite.yml` — CI gate on TestSprite CLI (targets the +5 Innovation bonus).
- `DEPLOYMENT.md` — step-by-step Vercel + Supabase + TestSprite CLI setup guide.

### Known gaps (tracked, not yet built)
- Auth flows (Supabase Auth email/OAuth) — stubbed, not wired to UI.
- Realtime leaderboard subscription — schema ready, client subscription not yet implemented.
- Loop Dashboard `/dashboard` page — currently a static placeholder; live TestSprite API integration pending `TESTSPRITE_API_KEY`.
- No tests have been run yet — first `testsprite test run` will seed the real `LOOP.md` history.
