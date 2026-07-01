export type RoomStatus = "lobby" | "active" | "finished";
export type RoundStatus = "pending" | "active" | "finished";

export interface Profile {
  id: string;
  displayName: string;
  createdAt: string;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  sandboxId: string;
  createdAt: string;
}

export interface Round {
  id: string;
  roomId: string;
  roundNumber: number;
  startedAt: string | null;
  endsAt: string | null;
  status: RoundStatus;
}

export interface BugReport {
  id: string;
  roundId: string;
  playerId: string;
  bugId: string;
  correct: boolean;
  pointsAwarded: number;
  submittedAt: string;
}

export interface ScoreEntry {
  roomId: string;
  playerId: string;
  displayName: string;
  totalPoints: number;
}

/** A single seeded bug in a sandbox, used by the game engine + scoring. */
export interface SeededBug {
  id: string;
  sandboxId: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  basePoints: number;
  /** How a submission is validated as a correct find (kept server-side only). */
  validate: (submission: unknown) => boolean;
}

/** Shape returned by the TestSprite run-history API, used by the Loop Dashboard. */
export interface TestSpriteRun {
  id: string;
  projectId: string;
  status: "passed" | "failed" | "running";
  startedAt: string;
  finishedAt: string | null;
  summary: string;
  failureCount: number;
}
