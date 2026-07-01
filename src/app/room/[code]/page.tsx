import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBugsForSandbox } from "@/lib/bugs/seed-bugs";
import RoomClient from "@/components/game/RoomClient";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (!room) {
    notFound();
  }

  const bugs = getBugsForSandbox(room.sandbox_id).map(
    ({ id, title, description, difficulty, basePoints }) => ({
      // Deliberately omit `validate` — it must never reach the client.
      id,
      title,
      description,
      difficulty,
      basePoints,
    })
  );

  return <RoomClient room={room} bugs={bugs} />;
}
