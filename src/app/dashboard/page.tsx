import type { TestSpriteRun } from "@/types";

export const revalidate = 30; // refresh run history every 30s

async function getRuns(): Promise<TestSpriteRun[]> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/loop-status`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.runs ?? [];
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const runs = await getRuns();

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold">The Loop, Live</h1>
      <p className="mt-2 text-white/60">
        Real TestSprite CLI runs against this exact app, pulled from the
        TestSprite API. Write → verify → fix, in order.
      </p>

      {runs.length === 0 ? (
        <div className="mt-10 rounded-lg border border-white/10 bg-surface p-8 text-center text-white/50">
          No runs yet — once <code className="font-mono">testsprite setup</code>{" "}
          has been run against this deployment and the first{" "}
          <code className="font-mono">testsprite test run</code> completes,
          it will show up here automatically.
        </div>
      ) : (
        <ol className="mt-10 space-y-4 border-l border-white/10 pl-6">
          {runs.map((run) => (
            <li key={run.id} className="relative">
              <span
                className={`absolute -left-[29px] top-1.5 h-3 w-3 rounded-full ${
                  run.status === "passed"
                    ? "bg-success"
                    : run.status === "failed"
                      ? "bg-danger"
                      : "animate-pulse-fast bg-accent"
                }`}
                aria-hidden
              />
              <div className="rounded-lg border border-white/10 bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-white/50">
                    {new Date(run.startedAt).toLocaleString()}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      run.status === "passed"
                        ? "bg-success/20 text-success"
                        : run.status === "failed"
                          ? "bg-danger/20 text-danger"
                          : "bg-accent/20 text-accent"
                    }`}
                  >
                    {run.status.toUpperCase()}
                  </span>
                </div>
                <p className="mt-2 text-white/80">{run.summary}</p>
                {run.failureCount > 0 && (
                  <p className="mt-1 text-sm text-danger">
                    {run.failureCount} failure(s) caught
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
