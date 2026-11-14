import { DifficultyConfig } from '../types/game';
import { LetterSpawnModifiers } from './letterBag';

/** Letter mix: friendly = more vowels & fewer Q/Z/X/J, tricky = more Q/Z/X/J. */
export type LetterMix = 'friendly' | 'normal' | 'tricky';

/** The player's own gameplay settings (Home > Settings). Timers are per mode, so not here. */
export interface CustomGameSettings {
  fallSpeed: number; // px/sec in the reference viewBox
  lettersAtOnce: number; // avg letters falling at once on a phone-width board
  tileRadius: number; // letter size
  ceilingHeight: number; // danger line Y (bigger = less room)
  wallWidthPct: number; // play area width %
  speedUpPct: number; // % faster per word entered (0 = off)
  letterMix: LetterMix;
}

export const DEFAULT_CUSTOM_SETTINGS: CustomGameSettings = {
  fallSpeed: 170,
  lettersAtOnce: 3,
  tileRadius: 31,
  ceilingHeight: 60,
  wallWidthPct: 100,
  speedUpPct: 5,
  letterMix: 'normal',
};

/** Choices shown in Settings (segmented controls). Defaults match the Normal preset. */
export const CUSTOM_OPTIONS = {
  fallSpeed: [
    { label: 'Slow', val: 100 },
    { label: 'Gentle', val: 140 },
    { label: 'Normal', val: 170 },
    { label: 'Fast', val: 260 },
    { label: 'Very fast', val: 360 },
  ],
  lettersAtOnce: [
    { label: 'Few', val: 2 },
    { label: 'Some', val: 3 },
    { label: 'Many', val: 4 },
    { label: 'Lots', val: 5 },
  ],
  tileRadius: [
    { label: 'Small', val: 26 },
    { label: 'Medium', val: 28 },
    { label: 'Large', val: 31 },
    { label: 'Huge', val: 34 },
  ],
  ceilingHeight: [
    { label: 'Lots', val: 45 },
    { label: 'Some', val: 60 },
    { label: 'Less', val: 85 },
    { label: 'Not much', val: 115 },
  ],
  wallWidthPct: [
    { label: 'Narrow', val: 60 },
    { label: 'Medium', val: 80 },
    { label: 'Wide', val: 100 },
  ],
  speedUpPct: [
    { label: 'Off', val: 0 },
    { label: 'A little', val: 3 },
    { label: 'Medium', val: 5 },
    { label: 'A lot', val: 10 },
  ],
  letterMix: [
    { label: 'Friendly', val: 'friendly' as LetterMix },
    { label: 'Normal', val: 'normal' as LetterMix },
    { label: 'Tricky', val: 'tricky' as LetterMix },
  ],
};

const STORAGE_KEY = 'word_blitz_custom_settings_v1';

function pick<T>(raw: unknown, allowed: { val: T }[], fallback: T): T {
  return allowed.some((o) => o.val === raw) ? (raw as T) : fallback;
}

/** Returns saved custom settings, or null when the player hasn't saved any. */
export function loadCustomSettings(): CustomGameSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (!p || typeof p !== 'object') return null;
    const d = DEFAULT_CUSTOM_SETTINGS;
    return {
      fallSpeed: pick(p.fallSpeed, CUSTOM_OPTIONS.fallSpeed, d.fallSpeed),
      lettersAtOnce: pick(p.lettersAtOnce, CUSTOM_OPTIONS.lettersAtOnce, d.lettersAtOnce),
      tileRadius: pick(p.tileRadius, CUSTOM_OPTIONS.tileRadius, d.tileRadius),
      ceilingHeight: pick(p.ceilingHeight, CUSTOM_OPTIONS.ceilingHeight, d.ceilingHeight),
      wallWidthPct: pick(p.wallWidthPct, CUSTOM_OPTIONS.wallWidthPct, d.wallWidthPct),
      speedUpPct: pick(p.speedUpPct, CUSTOM_OPTIONS.speedUpPct, d.speedUpPct),
      letterMix: pick(p.letterMix, CUSTOM_OPTIONS.letterMix, d.letterMix),
    };
  } catch {
    return null;
  }
}

export function saveCustomSettings(settings: CustomGameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

export function clearCustomSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

const LETTER_MIX_MODS: Record<LetterMix, LetterSpawnModifiers | undefined> = {
  friendly: { vowelBoostPct: 6, rareLetterWeightMultiplier: 0.4 },
  normal: undefined,
  tricky: { rareLetterWeightMultiplier: 1.8 },
};

/** Turns saved custom settings into a full difficulty config the game loop can use. */
export function buildCustomConfig(cs: CustomGameSettings): DifficultyConfig {
  const pace = cs.speedUpPct > 0;
  return {
    id: 'custom',
    label: 'Custom',
    description: 'Your own settings',
    dropSpeed: cs.fallSpeed,
    spawnIntervalMs: 1200, // reference tempo; cadence comes from lettersAtOnce
    minSpawnIntervalMs: 480,
    spawnAccelFactor: pace ? 1 - cs.speedUpPct / 125 : 1,
    speedIncreaseRate: cs.speedUpPct,
    maxSpeedMultiplier: pace ? 1 + cs.speedUpPct * 0.25 : 1,
    ceilingHeight: cs.ceilingHeight,
    tileRadius: cs.tileRadius,
    maxInFlightOffset: 0,
    phoneTargetOnScreen: cs.lettersAtOnce,
    wallWidthPct: cs.wallWidthPct,
    paceEnabled: pace,
    letterMods: LETTER_MIX_MODS[cs.letterMix],
  };
}
