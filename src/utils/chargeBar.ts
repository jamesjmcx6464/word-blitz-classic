import type { DifficultyChoice } from '../types/game';
import type { CustomGameSettings } from './customSettings';
import type { LetterDistributionSettings } from './letterDistributions';
import { STREAK_STAGES, StreakMultiplier } from './groupStreak';

/**
 * Charge-bar multiplier. Charge is one number: stage index × 100 + bar points.
 * 0 = 1× empty … 600 = 4× (max; the bar stays full).
 */
export const CHARGE_PER_STAGE = 100;
export const MAX_STAGE = STREAK_STAGES.length - 1; // 6 → 4×
export const MAX_CHARGE = MAX_STAGE * CHARGE_PER_STAGE;

export type ChargeTier = 'beginner' | 'normal' | 'hard';

/** Penalty tier: Beginner/Easy forgiving, Normal/Custom middle, Hard/Nightmare strict. */
export function chargeTierFor(choice: DifficultyChoice): ChargeTier {
  if (choice === 'beginner' || choice === 'easy') return 'beginner';
  if (choice === 'hard' || choice === 'nightmare') return 'hard';
  return 'normal';
}

/** Bar points lost on a misspelling or out-of-group word. */
export const MISS_PENALTY: Record<ChargeTier, number> = { beginner: 12, normal: 50, hard: 100 };

// ---------------------------------------------------------------------------
// Par lengths
// ---------------------------------------------------------------------------

/**
 * Par = the typical word length a letter mode's tiles make (from the board
 * simulation in charge_mode_analysis.md). Par 3: mostly 3-letter words.
 * Par 4: mostly 4-letter words. Standard alphabet is par 3 on every difficulty.
 */
const PAR_4_SOUNDS = new Set([
  'blends',
  'oo', 'ee', 'ea', 'ai', 'oa', 'ou',
  'ar', 'or', 'er',
  'sh', 'ch', 'th', 'wh', 'ck', 'ng',
  'a-e', 'i-e', 'o-e', 'u-e',
  'bl', 'cl', 'fl', 'gl', 'pl', 'sl', 'br', 'cr', 'dr', 'fr', 'gr', 'tr', 'sp', 'st', 'sw',
  '-nd', '-nk', '-nt', '-mp', '-st',
]);

export type ParLength = 3 | 4;

export function chargeParFor(mix: LetterDistributionSettings): ParLength {
  // Several focuses: the longest par among them.
  if (mix.sounds.length) return mix.sounds.some((id) => PAR_4_SOUNDS.has(id)) ? 4 : 3;
  return PAR_4_SOUNDS.has(mix.preset) ? 4 : 3;
}

// ---------------------------------------------------------------------------
// Difficulty profile: how many par-length words fill 1× → 4×
// ---------------------------------------------------------------------------

export const PARS_TO_MAX: Record<Exclude<DifficultyChoice, 'custom'>, number> = {
  beginner: 4,
  easy: 5,
  normal: 7, // baseline
  hard: 10,
  nightmare: 12,
};

export interface ChargeProfile {
  /** Par-length words needed for 1× → 4× with no mistakes. */
  parsToMax: number;
  /** Charge for one par-length word (600 / parsToMax, rounded up). */
  parGain: number;
  /** Share of parGain for a word one letter under par (0.5 forgiving, 0 strict). */
  underParFactor: number;
  tier: ChargeTier;
}

export function profileFromPars(parsToMax: number, tier: ChargeTier): ChargeProfile {
  const pars = Math.max(4, Math.min(12, parsToMax));
  return {
    parsToMax: pars,
    parGain: Math.ceil(MAX_CHARGE / pars),
    underParFactor: pars <= 8 ? 0.5 : 0,
    tier,
  };
}

/** Piecewise-linear map of x over (x, pars) anchors, clamped at the ends. */
function interp(x: number, anchors: [number, number][]): number {
  const a = [...anchors].sort((p, q) => p[0] - q[0]);
  if (x <= a[0][0]) return a[0][1];
  for (let i = 1; i < a.length; i++) {
    const [x1, y1] = a[i];
    const [x0, y0] = a[i - 1];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return a[a.length - 1][1];
}

/**
 * Custom heuristic. Each setting is placed between the preset values it matches
 * (Beginner 4 pars, Easy 5, Normal/Hard 7, Nightmare 12) and turned into a
 * "pars" estimate; the estimates are averaged with fall speed and letters at
 * once counting double (they drive pace most). Letter mix and a narrow play area
 * nudge it after. Normal-equivalent settings give exactly 7. Clamped to 4–12.
 */
export function customParsToMax(cs: CustomGameSettings): number {
  const parts: [number, number][] = [
    // [estimate, weight]   anchors: [Beginner, Easy, Normal, Nightmare] preset values
    [interp(cs.fallSpeed, [[85, 4], [120, 5], [170, 7], [260, 12]]), 2],
    [interp(cs.lettersAtOnce, [[2, 4], [2.5, 5], [3, 7], [4, 12]]), 2],
    [interp(cs.ceilingHeight, [[45, 4], [50, 5], [60, 7], [85, 12]]), 1],
    [interp(-cs.tileRadius, [[-34, 4], [-32, 5], [-31, 7], [-28, 12]]), 1],
    [interp(cs.speedUpPct, [[2, 4], [3, 5], [5, 7], [10, 12]]), 1],
  ];
  const wsum = parts.reduce((s, [, w]) => s + w, 0);
  let pars = parts.reduce((s, [v, w]) => s + v * w, 0) / wsum;
  if (cs.letterMix === 'friendly') pars -= 0.5;
  if (cs.letterMix === 'tricky') pars += 1;
  if (cs.wallWidthPct <= 60) pars += 1;
  else if (cs.wallWidthPct <= 80) pars += 0.5;
  return Math.round(Math.max(4, Math.min(12, pars)) * 2) / 2;
}

export function chargeProfileFor(choice: DifficultyChoice, custom: CustomGameSettings | null = null): ChargeProfile {
  const tier = chargeTierFor(choice);
  if (choice === 'custom') return profileFromPars(custom ? customParsToMax(custom) : PARS_TO_MAX.normal, tier);
  return profileFromPars(PARS_TO_MAX[choice], tier);
}

/**
 * Charge for one in-mode word. Par length = parGain; each letter over par adds
 * another +50% of parGain (×1, ×1.5, ×2, …); one under = parGain × underParFactor;
 * two or more under = 0. Words under 3 letters never charge (no 2-letter spam).
 */
export function chargeGainFor(length: number, par: ParLength, profile: ChargeProfile): number {
  if (length < 3) return 0;
  const diff = length - par;
  if (diff >= 0) return Math.round(profile.parGain * (1 + 0.5 * diff));
  if (diff === -1) return Math.round(profile.parGain * profile.underParFactor);
  return 0;
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

/** Valid in-mode word: add charge (overflow carries into the next stage(s), capped at 4×). */
export function chargeAfterWord(c: number, length: number, par: ParLength, profile: ChargeProfile): number {
  return clampCharge(c + chargeGainFor(length, par, profile));
}

/**
 * Misspelling / out-of-group word.
 * Beginner −12, Normal −50 (borrowing from the previous stage below 0%).
 * Hard: empty the bar and drop one stage (previous stage at 0%).
 */
export function chargeAfterMiss(c: number, tier: ChargeTier): number {
  const cc = clampCharge(c);
  if (tier === 'hard') {
    return Math.max(0, (chargeStage(cc) - 1) * CHARGE_PER_STAGE);
  }
  return clampCharge(cc - MISS_PENALTY[tier]);
}
