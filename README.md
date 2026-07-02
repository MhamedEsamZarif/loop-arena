# 🎯 Loop Arena

**A live multiplayer bug-hunt game — and a live view of its own TestSprite loop.**

Built for [TestSprite Hackathon Season 3](https://www.testsprite.com/hackathon-s3) — *"Build the Loop."*

> Live app: https://loop-arena.vercel.app
> Loop Dashboard: https://loop-arena.vercel.app/dashboard
> Demo video: `TODO`

---

## What it is

Loop Arena is a real-time multiplayer game: players join a room, get dropped into a sandboxed mini-app that has intentionally seeded bugs, and race to find and report them before the timer runs out. Correct finds score points based on difficulty and speed; a live leaderboard updates via WebSocket (Supabase Realtime) as the round plays out.

The twist: `/dashboard` is a **public, live visualization of this project's own TestSprite loop** — pulling real run history from the TestSprite API and rendering it as an animated timeline, so you can watch write → verify → fix happen on the actual app you're using, not just read about it in a markdown file.

### Why this project (not a CRUD app)

TestSprite S3 judges 40/40 on **Project Quality** and **Loop Quality**. A todo app never breaks in interesting ways, which starves `LOOP.md` of anything real to report. Loop Arena has genuine surface area for real bugs — WebSocket race conditions, scoring integrity under concurrent submissions, auth edge cases, reconnect handling — which means the loop this repo documents is an *honest* one, not a fabricated one.

## Stack

- **Next.js 15** (App Router, TypeScript, strict mode)
- **Supabase**: Postgres + Auth + Realtime (WebSocket rooms/leaderboard)
- **Tailwind CSS** + shadcn/ui primitives
- **Vercel** (deployment — required: TestSprite tests the live URL, not localhost)
- **TestSprite CLI** as the verification loop, wired into GitHub Actions

### Why not something "better" than React/Next/Supabase/Tailwind?

For a 7-day build that must be live and testable from hour one, this stack wins on: (1) Vercel + Supabase = a public URL in minutes, satisfying the "no localhost" rule immediately; (2) Supabase Realtime gives WebSocket multiplayer without standing up custom infra, which would burn days we don't have; (3) Next.js API routes double as the backend, so there's one deploy target, one CI pipeline, one thing for the TestSprite CLI to point at. A separate custom backend (e.g. Go/Rust + raw WebSockets) would be more "impressive" in isolation but adds deployment surface and days of plumbing that don't move either Project Quality or Loop Quality — it would only cost us loop iterations, not earn them.

## Folder structure

```
loop-arena/
├── src/
│   ├── app/
│   │   ├── page.tsx              # landing / join-or-create room
│   │   ├── login/                # Supabase auth
│   │   ├── room/[code]/          # live game room (WebSocket)
│   │   ├── dashboard/            # public Loop Dashboard (TestSprite run history)
│   │   └── api/
│   │       ├── rooms/            # create/join room
│   │       ├── rounds/           # start round, submit bug find
│   │       ├── leaderboard/      # scores
│   │       └── loop-status/      # proxies TestSprite API for the dashboard
│   ├── components/
│   │   ├── game/                 # room UI, timer, bug-report widget
│   │   ├── loop-dashboard/       # animated loop timeline
│   │   └── ui/                   # shared primitives
│   ├── lib/
│   │   ├── supabase/             # client + server clients
│   │   ├── game-engine/          # scoring, round lifecycle
│   │   └── bugs/                 # seeded-bug definitions (the sandbox content)
│   └── types/
├── supabase/migrations/          # SQL schema, applied via Supabase CLI/dashboard
├── .testsprite/                  # TestSprite failure bundles (agent-populated, do not hand-edit)
├── .github/workflows/testsprite.yml
├── LOOP.md                       # agent-written, one line per loop iteration — READ THIS FIRST
├── CHANGELOG.md
├── Dockerfile / docker-compose.yml
├── DEPLOYMENT.md
├── .env.example
└── LICENSE
```

## Local development

```bash
npm install
cp .env.example .env.local   # fill in Supabase + TestSprite values
npm run dev
```

## Environment variables

See `.env.example`. You need a Supabase project (URL + anon key + service role key) and, for CI, a `TESTSPRITE_API_KEY` + `PROJECT_ID` stored as GitHub Actions secrets — never committed.

## The loop

This repo's write → verify → fix history lives in [`LOOP.md`](./LOOP.md), written by the coding agent after every TestSprite CLI run, backed by commit history and TestSprite's own run history. Read that before this README if you're a judge.

## Deployment

**Note on CI status:** the GitHub Actions badge may show red. This is expected and documented — TestSprite's own run status (`blocked`) currently conflicts with its narrative summary (`all assertions passed`) on this project, a bug reproduced across three separate runs and reported in Discord `#cli-contribution`. See `LOOP.md` entry #1 for full detail with run IDs and evidence.
See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the exact Vercel + Supabase + TestSprite CLI + GitHub Actions setup, start to finish.

## License

MIT — see [`LICENSE`](./LICENSE).
