"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Room } from "@/types";

interface BugSummary {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  basePoints: number;
}

interface LeaderboardRow {
  playerId: string;
  displayName: string;
  totalPoints: number;
}

const difficultyColor: Record<BugSummary["difficulty"], string> = {
  easy: "text-success",
  medium: "text-accent",
  hard: "text-danger",
};

export default function RoomClient({
  room,
  bugs,
}: {
  room: Room;
  bugs: BugSummary[];
}) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadLeaderboard() {
      const res = await fetch(`/api/leaderboard?roomId=${room.id}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard ?? []);
      }
    }

    loadLeaderboard();

    // Live updates: re-fetch whenever scores change for this room.
    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scores",
          filter: `room_id=eq.${room.id}`,
        },
        () => loadLeaderboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  async function reportBug(bugId: string) {
    setMessage(null);
    // NOTE: roundId wiring (starting a round, tracking the active round id)
    // is the next loop iteration — this calls the endpoint with a stub so
    // the request shape is exercised even before round lifecycle UI exists.
    const res = await fetch("/api/rounds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: room.id, bugId }),
    });
    const data = await res.json();
    setMessage(
      res.ok
        ? data.correct
          ? `Correct! +${data.points} points`
          : "Not quite — keep looking."
        : data.error ?? "Something went wrong."
    );
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[2fr_1fr]">
      <section>
        <h1 className="text-2xl font-bold">
          Room <span className="font-mono text-accent">{room.code}</span>
        </h1>
        <p className="mt-1 text-white/50">
          Sandbox: <span className="font-mono">{room.sandboxId}</span>
        </p>

        <ul className="mt-6 space-y-3" aria-label="Seeded bugs to find">
          {bugs.map((bug) => (
            <li
              key={bug.id}
              className="rounded-lg border border-white/10 bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium">{bug.title}</h2>
                  <p className="mt-1 text-sm text-white/60">
                    {bug.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-mono text-xs ${difficultyColor[bug.difficulty]}`}
                >
                  {bug.difficulty} · {bug.basePoints}pts
                </span>
              </div>
              <button
                onClick={() => reportBug(bug.id)}
                className="mt-3 rounded-md border border-accent/40 px-3 py-1.5 text-sm text-accent transition hover:bg-accent/10"
              >
                I found this one
              </button>
            </li>
          ))}
        </ul>

        {message && (
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        )}
      </section>

      <aside>
        <h2 className="text-lg font-semibold">Leaderboard</h2>
        <ol className="mt-4 space-y-2">
          {leaderboard.length === 0 && (
            <p className="text-sm text-white/40">No scores yet.</p>
          )}
          {leaderboard.map((row, i) => (
            <li
              key={row.playerId}
              className="flex items-center justify-between rounded-md bg-surface px-3 py-2"
            >
              <span>
                <span className="mr-2 font-mono text-white/40">#{i + 1}</span>
                {row.displayName}
              </span>
              <span className="font-mono text-accent">{row.totalPoints}</span>
            </li>
          ))}
        </ol>
      </aside>
    </main>
  );
}
