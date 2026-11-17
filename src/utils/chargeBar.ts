import type { DifficultyChoice } from '../types/game';
import { STREAK_STAGES, StreakMultiplier } from './groupStreak';

/**
 * Charge-bar multiplier. Charge is one number: stage index × 100 + bar points.
 * 0 = 1× empty … 600 = 4× (max; the bar stays full).
 */
export const CHARGE_PER_STAGE = 100;
export const MAX_STAGE = STREAK_STAGES.length - 1; // 6 → 4×
export const MAX_CHARGE = MAX_STAGE * CHARGE_PER_STAGE;

export type ChargeTier = 'beginner' | 'normal' | 'hard';

/** Beginner/Easy are forgiving, Normal/Custom are the middle, Hard/Nightmare are strict. */
export function chargeTierFor(choice: DifficultyChoice): ChargeTier {
  if (choice === 'beginner' || choice === 'easy') return 'beginner';
  if (choice === 'hard' || choice === 'nightmare') return 'hard';
  return 'normal';
}

/** Bar points gained per word length (index = letters; 10+ uses the last entry). */
const GAIN: Record<ChargeTier, number[]> = {
  //          0  1  2   3   4   5   6    7    8    9   10+
  beginner: [0, 0, 0, 20, 35, 50, 70, 100, 130, 160, 200],
  normal:   [0, 0, 0, 10, 25, 40, 60,  90, 115, 140, 180],
  hard:     [0, 0, 0,  0, 15, 30, 50,  80, 100, 120, 160],
};

/** Bar points lost on a misspelling or out-of-group word. */
export const MISS_PENALTY: Record<ChargeTier, number> = { beginner: 25, normal: 50, hard: 100 };

export function chargeGainFor(length: number, tier: ChargeTier): number {
  const t = GAIN[tier];
  return t[Math.min(Math.max(0, length), t.length - 1)];
}

export function clampCharge(c: number): number {
  return Math.max(0, Math.min(MAX_CHARGE, Math.round(c)));
}

export function chargeStage(c: number): number {
  return Math.min(MAX_STAGE, Math.floor(clampCharge(c) / CHARGE_PER_STAGE));
}

export function chargeMultiplier(c: number): StreakMultiplier {
  return STREAK_STAGES[chargeStage(c)];
}

/** Bar fill 0–100 within the current stage (100 at max). */
export function chargePct(c: number): number {
  const cc = clampCharge(c);
  if (cc >= MAX_CHARGE) return 100;
  return cc - chargeStage(cc) * CHARGE_PER_STAGE;
}

/** Valid word: add charge (overflow carries into the next stage(s)). */
export function chargeAfterWord(c: number, length: number, tier: ChargeTier): number {
  return clampCharge(c + chargeGainFor(length, tier));
}

/**
 * Misspelling / out-of-group word.
 * Beginner −25, Normal −50 (borrowing from the previous stage below 0%).
 * Hard: empty the bar and drop one stage (previous stage at 0%).
 */
export function chargeAfterMiss(c: number, tier: ChargeTier): number {
  const cc = clampCharge(c);
  if (tier === 'hard') {
    return Math.max(0, (chargeStage(cc) - 1) * CHARGE_PER_STAGE);
  }
  return clampCharge(cc - MISS_PENALTY[tier]);
}
