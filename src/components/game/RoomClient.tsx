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

interface ActiveRound {
  id: string;
  endsAt: string;
}

export default function RoomClient({
  room,
  bugs,
}: {
  room: Room;
  bugs: BugSummary[];
}) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [round, setRound] = useState<ActiveRound | null>(null);
  const [starting, setStarting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [foundBugIds, setFoundBugIds] = useState<Set<string>>(new Set());

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

  // Countdown ticker for the active round, driven off `endsAt` (server
  // clock) rather than a local counter, so it stays correct even if this
  // tab was backgrounded and throttled for a while.
  useEffect(() => {
    if (!round) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.round((new Date(round.endsAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setRound(null);
        setFoundBugIds(new Set());
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [round]);

  async function startRound() {
    setStarting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/rounds/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not start the round.");
        return;
      }
      setFoundBugIds(new Set());
      setRound({ id: data.round.id, endsAt: data.round.ends_at });
    } catch {
      setMessage("Network error — please try again.");
    } finally {
      setStarting(false);
    }
  }

  async function reportBug(bugId: string) {
    if (!round) return;
    setMessage(null);
    const res = await fetch("/api/rounds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: round.id, bugId }),
    });
    const data = await res.json();
    if (res.ok && data.correct) {
      setFoundBugIds((prev) => new Set(prev).add(bugId));
    }
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

        <div className="mt-4 flex items-center gap-4">
          {round ? (
            <span
              role="timer"
              aria-live="polite"
              className={`font-mono text-lg ${secondsLeft !== null && secondsLeft <= 10 ? "text-danger" : "text-accent"}`}
            >
              ⏱ {secondsLeft ?? 0}s left
            </span>
          ) : (
            <button
              onClick={startRound}
              disabled={starting}
              className="rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {starting ? "Starting…" : "Start round"}
            </button>
          )}
        </div>

        <ul className="mt-6 space-y-3" aria-label="Seeded bugs to find">
          {bugs.map((bug) => {
            const found = foundBugIds.has(bug.id);
            return (
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
                  disabled={!round || found}
                  className="mt-3 rounded-md border border-accent/40 px-3 py-1.5 text-sm text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {found ? "Found ✓" : !round ? "Start the round first" : "I found this one"}
                </button>
              </li>
            );
          })}
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
