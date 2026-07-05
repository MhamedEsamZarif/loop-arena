import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { TestSpriteRun } from "@/types";

/**
 * Reads loop run history from Supabase's `loop_runs` table, which is
 * populated by GitHub Actions after every TestSprite CLI run (see
 * .github/workflows/testsprite-verification-loop.yml). We read from our
 * own database instead of calling TestSprite's API directly from the
 * client-facing dashboard, since TestSprite doesn't publish a documented
 * REST endpoint for run history — the CLI/CI is the source of truth here.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ runs: [] satisfies TestSpriteRun[] });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("loop_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      return NextResponse.json({ runs: [] satisfies TestSpriteRun[] });
    }

    const runs: TestSpriteRun[] = data.map((r) => ({
      id: String(r.id),
      projectId: process.env.TESTSPRITE_PROJECT_ID ?? "",
      status: r.status,
      startedAt: r.created_at,
      finishedAt: r.created_at,
      summary: r.summary ?? `${r.passed ?? 0} passed / ${r.failed ?? 0} failed`,
      failureCount: r.failed ?? 0,
    }));

    return NextResponse.json({ runs });
  } catch {
    return NextResponse.json({ runs: [] satisfies TestSpriteRun[] });
  }
}
