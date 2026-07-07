import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-sm font-mono text-accent">
        TestSprite Hackathon S3 — Build the Loop
      </span>

      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
        Loop <span className="text-accent">Arena</span>
      </h1>

      <p className="max-w-xl text-lg text-white/70">
        A live multiplayer bug hunt. Jump into a sandboxed mini-app, race to
        find the seeded bugs before the timer runs out, and watch the
        leaderboard update in real time.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-white/20 px-6 py-3 font-medium text-white/90 transition hover:bg-white/5"
        >
          Watch the Loop →
        </Link>
      </div>

      <p className="mt-4 text-xs text-white/40">
        The Loop Dashboard shows this project&apos;s own real TestSprite
        verification runs, live.
      </p>
    </main>
  );
}
