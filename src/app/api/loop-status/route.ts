import { NextResponse } from "next/server";
import type { TestSpriteRun } from "@/types";

/**
 * Server-side proxy to the TestSprite run-history API. Kept server-side so
 * TESTSPRITE_API_KEY never reaches the client bundle. The exact TestSprite
 * API response shape should be confirmed against the CLI/API docs
 * (https://docs.testsprite.com) once TESTSPRITE_PROJECT_ID is live — this
 * route normalizes whatever comes back into TestSpriteRun[] for the
 * dashboard to render.
 */
export async function GET() {
  const apiKey = process.env.TESTSPRITE_API_KEY;
  const projectId = process.env.TESTSPRITE_PROJECT_ID;

  if (!apiKey || !projectId) {
    return NextResponse.json({ runs: [] satisfies TestSpriteRun[] });
  }

  try {
    const res = await fetch(
      `https://api.testsprite.com/v1/projects/${projectId}/runs`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        // Never cache API-key-bearing requests at the edge.
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ runs: [] satisfies TestSpriteRun[] });
    }

    const data = await res.json();
    const runs: TestSpriteRun[] = (data.runs ?? []).map((r: any) => ({
      id: r.id,
      projectId,
      status: r.status,
      startedAt: r.started_at ?? r.startedAt,
      finishedAt: r.finished_at ?? r.finishedAt ?? null,
      summary: r.summary ?? `${r.passed ?? 0} passed / ${r.failed ?? 0} failed`,
      failureCount: r.failure_count ?? r.failed ?? 0,
    }));

    return NextResponse.json({ runs });
  } catch {
    return NextResponse.json({ runs: [] satisfies TestSpriteRun[] });
  }
}
