"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-bold">Join Loop Arena</h1>
      <p className="text-sm text-white/60">
        We&apos;ll email you a magic link — no password needed.
      </p>

      {status === "sent" ? (
        <div
          role="status"
          className="rounded-lg border border-success/30 bg-success/10 p-4 text-success"
        >
          Check your inbox for a sign-in link.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-medium text-white/80">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-white/15 bg-surface px-4 py-2.5 text-white outline-none focus-visible:border-accent"
            placeholder="you@example.com"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-2 rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
          {status === "error" && (
            <p role="alert" className="text-sm text-danger">
              {errorMessage}
            </p>
          )}
        </form>
      )}
    </main>
  );
}
