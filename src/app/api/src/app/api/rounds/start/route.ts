import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const ROUND_DURATION_SECONDS = 120;

const startRoundSchema = z.object({
  roomId: z.string().uuid(),
});

/**
 * Starts a new round for a room. This is the piece that was missing end to
 * end: without it, a room existed but no round ever did, so every bug
 * submission 404'd with "Round not found" — there was no actual game loop.
 *
 * Uses the admin client because `rounds` currently has no INSERT policy
 * (only a public SELECT policy) — see supabase/migrations/0001_init.sql.
 * That's intentional: round creation is a server-mediated action (so we can
 * enforce "only one active round per room" here), not something clients
 * write directly.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = startRoundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { roomId } = parsed.data;
  const admin = createAdminClient();

  const { data: room, error: roomError } = await admin
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Guard against two people double-clicking "Start Round" at once: refuse
  // if there's already an active, unexpired round for this room.
  const { data: existing } = await admin
    .from("rounds")
    .select("*")
    .eq("room_id", roomId)
    .eq("status", "active")
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && existing.ends_at && new Date(existing.ends_at) > new Date()) {
    return NextResponse.json({ round: existing }, { status: 200 });
  }

  const { data: lastRound } = await admin
    .from("rounds")
    .select("round_number")
    .eq("room_id", roomId)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextRoundNumber = (lastRound?.round_number ?? 0) + 1;
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + ROUND_DURATION_SECONDS * 1000);

  const { data: round, error: insertError } = await admin
    .from("rounds")
    .insert({
      room_id: roomId,
      round_number: nextRoundNumber,
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "active",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await admin.from("rooms").update({ status: "active" }).eq("id", roomId);

  return NextResponse.json({ round }, { status: 201 });
}
