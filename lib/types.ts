export type TaskKind = 'task' | 'milestone' | 'build';

export interface ProgressState {
  /** task id -> true when complete */
  done: Record<string, boolean>;
  /** ISO date of the last tick, used for the streak */
  lastTick?: string;
  /** consecutive days with at least one tick */
  streak?: number;
}
