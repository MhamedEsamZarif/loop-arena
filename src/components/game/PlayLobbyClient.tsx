"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function PlayLobbyClient() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateRoom() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId: "starter" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create a room.");
        setCreating(false);
        return;
      }
      router.push(`/room/${data.room.code}`);
    } catch {
      setError("Network error — please try again.");
      setCreating(false);
    }
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    router.push(`/room/${code}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6">
      <div>
        <h1 className="text-2xl font-bold">Ready to hunt some bugs?</h1>
        <p className="mt-1 text-sm text-white/60">
          Start a new room, or join one a friend already created.
        </p>
      </div>

      <button
        onClick={handleCreateRoom}
        disabled={creating}
        className="rounded-lg bg-accent px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {creating ? "Creating room…" : "Create a new room"}
      </button>

      <div className="flex items-center gap-3 text-xs text-white/40">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleJoin} className="flex flex-col gap-3">
        <label htmlFor="code" className="text-sm font-medium text-white/80">
          Room code
        </label>
        <input
          id="code"
          type="text"
          required
          maxLength={5}
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="ABCDE"
          className="rounded-lg border border-white/15 bg-surface px-4 py-2.5 font-mono uppercase tracking-widest text-white outline-none focus-visible:border-accent"
        />
        <button
          type="submit"
          className="rounded-lg border border-white/20 px-4 py-2.5 font-medium text-white/90 transition hover:bg-white/5"
        >
          Join room
        </button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </main>
  );
}
