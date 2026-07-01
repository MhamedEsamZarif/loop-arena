import type { SeededBug } from "@/types";

/**
 * Seeded bugs for the "starter" sandbox. Each sandbox is a small, self-contained
 * buggy mini-app rendered inside the game room; players inspect it and submit
 * the bug_id they believe they've found. Validation stays server-side (in the
 * API route) so the answers aren't visible in client bundles.
 *
 * Add new sandboxes by creating a new sandboxId and a matching bug set here,
 * plus a corresponding mini-app under src/components/game/sandboxes/<id>.
 */
export const STARTER_SANDBOX_BUGS: SeededBug[] = [
  {
    id: "off-by-one-pagination",
    sandboxId: "starter",
    title: "Pagination drops the last item",
    description:
      "The product list's pagination logic silently skips the final item on every page.",
    difficulty: "easy",
    basePoints: 50,
    validate: (submission) => submission === "off-by-one-pagination",
  },
  {
    id: "race-condition-counter",
    sandboxId: "starter",
    title: "Double-click adds two likes",
    description:
      "Rapidly clicking the like button before the request resolves increments the count twice.",
    difficulty: "medium",
    basePoints: 100,
    validate: (submission) => submission === "race-condition-counter",
  },
  {
    id: "stale-closure-timer",
    sandboxId: "starter",
    title: "Countdown timer freezes after tab switch",
    description:
      "A stale closure over component state means the timer stops updating after the browser tab loses and regains focus.",
    difficulty: "hard",
    basePoints: 150,
    validate: (submission) => submission === "stale-closure-timer",
  },
  {
    id: "unescaped-input-xss",
    sandboxId: "starter",
    title: "Comment field renders raw HTML",
    description:
      "User-submitted comments are rendered without escaping, allowing arbitrary HTML/script injection.",
    difficulty: "medium",
    basePoints: 100,
    validate: (submission) => submission === "unescaped-input-xss",
  },
];

export function getBugsForSandbox(sandboxId: string): SeededBug[] {
  switch (sandboxId) {
    case "starter":
      return STARTER_SANDBOX_BUGS;
    default:
      return [];
  }
}

export function findBug(sandboxId: string, bugId: string): SeededBug | undefined {
  return getBugsForSandbox(sandboxId).find((b) => b.id === bugId);
}
