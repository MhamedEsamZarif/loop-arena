import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("player_id, total_points, profiles!inner(display_name)")
    .eq("room_id", roomId)
    .order("total_points", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const leaderboard = (data ?? []).map((row: any) => ({
    playerId: row.player_id,
    displayName: row.profiles.display_name,
    totalPoints: row.total_points,
  }));

  return NextResponse.json({ leaderboard });
}
