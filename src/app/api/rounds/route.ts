import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { findBug } from "@/lib/bugs/seed-bugs";
import { computePoints } from "@/lib/game-engine/scoring";

const submitBugSchema = z.object({
  roundId: z.string().uuid(),
  bugId: z.string().min(1),
});

/**
 * Submit a bug find for the active round. This is the highest-stakes
 * endpoint in the app: it must be safe under concurrent submissions from
 * many players at once (no double-scoring, no scoring after round end) —
 * exactly the kind of logic worth letting TestSprite's E2E + concurrency
 * checks exercise for real.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = submitBugSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { roundId, bugId } = parsed.data;

  // Use the admin client for the read-then-write scoring path so RLS can't
  // race us, but we still explicitly re-validate ownership/timing below.
  const admin = createAdminClient();

  const { data: round, error: roundError } = await admin
    .from("rounds")
    .select("*, rooms!inner(sandbox_id)")
    .eq("id", roundId)
    .single();

  if (roundError || !round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  if (round.status !== "active") {
    return NextResponse.json(
      { error: "Round is not currently active" },
      { status: 409 }
    );
  }

  if (round.ends_at && new Date(round.ends_at) < new Date()) {
    return NextResponse.json({ error: "Round has ended" }, { status: 409 });
  }

  const sandboxId = round.rooms.sandbox_id as string;
  const bug = findBug(sandboxId, bugId);
  if (!bug) {
    return NextResponse.json({ error: "Unknown bug" }, { status: 400 });
  }

  const correct = bug.validate(bugId);
  const points = correct
    ? computePoints(bug, new Date(round.started_at), new Date())
    : 0;

  // Unique constraint (round_id, player_id, bug_id) is the real guard against
  // double submission — this insert will fail cleanly on a duplicate.
  const { error: insertError } = await admin.from("bug_reports").insert({
    round_id: roundId,
    player_id: user.id,
    bug_id: bugId,
    correct,
    points_awarded: points,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "You already reported this bug" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (correct && points > 0) {
    await admin.rpc("increment_score", {
      p_room_id: round.room_id,
      p_player_id: user.id,
      p_points: points,
    });
  }

  return NextResponse.json({ correct, points });
}
