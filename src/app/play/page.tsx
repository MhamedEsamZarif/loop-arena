import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlayLobbyClient from "@/components/game/PlayLobbyClient";

/**
 * The missing link between login and the room page. Without this page,
 * a signed-in user had no way to actually create or join a room — the
 * homepage only linked to /login, and /room/[code] required already
 * knowing a code. This page is what /login (and the homepage) should
 * send people to once they're authenticated.
 */
export default async function PlayLobbyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <PlayLobbyClient />;
}
