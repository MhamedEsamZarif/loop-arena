import type { SeededBug } from "@/types";

/**
 * Speed bonus: the faster a correct find is submitted after round start,
 * the more bonus points on top of the bug's base value. Decays linearly
 * to zero over the configured window, floor at 0.
 */
const SPEED_BONUS_WINDOW_MS = 60_000; // full bonus available for first 60s
const MAX_SPEED_BONUS_RATIO = 0.5; // up to +50% of base points

export function computePoints(
  bug: SeededBug,
  roundStartedAt: Date,
  submittedAt: Date
): number {
  const elapsedMs = Math.max(0, submittedAt.getTime() - roundStartedAt.getTime());
  const decay = Math.max(0, 1 - elapsedMs / SPEED_BONUS_WINDOW_MS);
  const bonus = Math.round(bug.basePoints * MAX_SPEED_BONUS_RATIO * decay);
  return bug.basePoints + bonus;
}

/**
 * Guards against duplicate/replay scoring — a player can only be awarded
 * points for a given bug once per round. Enforced here AND with a DB unique
 * constraint (round_id, player_id, bug_id) as defense in depth; this is
 * exactly the kind of concurrency edge case worth letting TestSprite catch
 * rather than assuming away.
 */
export function isDuplicateSubmission(
  existingSubmissions: Array<{ bugId: string; playerId: string }>,
  bugId: string,
  playerId: string
): boolean {
  return existingSubmissions.some(
    (s) => s.bugId === bugId && s.playerId === playerId
  );
}
