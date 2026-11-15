/**
 * Time-based speed ramp used by Hard. Elapsed time should only include periods
 * when the game is actually playing (pause-aware).
 *
 * Starts at Normal's speed / spawn interval and reaches roughly the old Hard
 * cap by 3.5 minutes, then holds. The curve is a mild ease-out (power 1.5):
 * smoother than a jump, steeper late than the old Normal log-on-words curve
 * would be over a short game, and noticeable in a 1–2 minute round.
 *
 * Spawn interval is tightened so that, with Normal's phone cadence (3 tiles),
 * the late-game drop rate is close to old Hard (4 tiles at 260 px/s).
 */
export const HARD_TIME_PACE = {
  durationSec: 210,
  startSpeed: 170,
  capSpeed: 260,
  startIntervalMs: 1200,
  capIntervalMs: 900,
} as const;

/** 0 at t=0, 1 at durationSec. s = 1 - (1 - t)^1.5 */
export function timePaceProgress(elapsedSec: number, durationSec: number = HARD_TIME_PACE.durationSec): number {
  if (elapsedSec <= 0) return 0;
  const t = Math.min(elapsedSec / durationSec, 1);
  return 1 - Math.pow(1 - t, 1.5);
}

export function computeTimePace(
  elapsedSec: number,
  spec: typeof HARD_TIME_PACE = HARD_TIME_PACE
): { dropSpeed: number; spawnIntervalMs: number; progress: number } {
  const progress = timePaceProgress(elapsedSec, spec.durationSec);
  return {
    dropSpeed: spec.startSpeed + (spec.capSpeed - spec.startSpeed) * progress,
    spawnIntervalMs: Math.round(spec.startIntervalMs + (spec.capIntervalMs - spec.startIntervalMs) * progress),
    progress,
  };
}
