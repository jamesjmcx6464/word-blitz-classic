import { LetterTileInfo, LetterSpawnModifiers } from '../utils/letterBag';

export interface HexTile {
  id: string;
  letter: LetterTileInfo;
  x: number;
  y: number;
  targetY: number;
  isFrozen: boolean;
  isFalling: boolean;
  isSelected: boolean;
  selectionIndex?: number;
  isClearing?: boolean;
}

export interface FloatingScore {
  id: string;
  text: string;
  points: number;
  x: number;
  y: number;
  fill?: string;
  stroke?: string;
}

export type GameScreen =
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAMEOVER'
  | 'HIGHSCORES'
  | 'CLASSROOM_SETUP'
  | 'CLASSROOM_TURN_TRANSITION'
  | 'CLASSROOM_VICTORY'
  | 'ADVENTURE';

export type ScreenModeType = 'pc' | 'phone';

export type ViewMode = 'narrow' | 'wide';

export interface GameSettings {
  soundEnabled: boolean;
  viewMode: ViewMode;
}

export interface WordEntry {
  id: string;
  word: string;
  score: number;
  length: number;
  timestamp: number;
}

export interface FreePlaySettings {
  dropSpeed: number; // pixels/sec (default 165)
  spawnDelayMs: number; // delay between settle and spawn in ms (default 320)
  timeLimit: number; // 0 = unlimited / endless, or seconds (e.g. 60, 120, 180, 300)
  tileRadius: number; // hex radius in pixels (default 28, range 18-36)
  speedIncreaseEnabled: boolean; // whether entered words increase fall speed
  speedIncreaseRate: number; // percentage speed bump per valid word (default 10%)
  wallWidthPct: number; // width percentage (default 100%, range 50% - 100%)
  ceilingHeight: number; // ceiling danger line Y coordinate (default 85, range 40 - 220)
}

export type DifficultyLevel = 'beginner' | 'easy' | 'normal' | 'hard' | 'nightmare';

/** A built-in preset, or 'custom' = the player's saved Settings. */
export type DifficultyChoice = DifficultyLevel | 'custom';

export type LeaderboardMode = 'quick' | 'solo' | 'team';

export interface DifficultyConfig {
  id: DifficultyChoice;
  label: string;
  description: string;
  dropSpeed: number; // constant base fall speed (px/sec in reference viewBox)
  spawnIntervalMs: number; // base spawn interval in ms
  minSpawnIntervalMs: number; // floor when pace accelerates
  spawnAccelFactor: number; // multiplier per word submitted
  speedIncreaseRate: number; // % speed increase per word submitted
  maxSpeedMultiplier: number; // max multiplier over base dropSpeed
  ceilingHeight: number; // danger line Y coordinate
  tileRadius: number; // hex radius
  maxInFlightOffset: number; // adjustment to max concurrent falling tiles
  phoneTargetOnScreen: number; // avg tiles falling at once on a phone-width board (scaled up on wider boards)
  wallWidthPct: number; // play area width percentage
  paceEnabled: boolean; // whether entering words speeds things up
  paceCurve?: 'compound' | 'log' | 'time'; // 'time' = ramp with play time (Hard); 'log' = words entered
  letterMods?: LetterSpawnModifiers; // letter mix tweaks (undefined = standard mix)
}

export const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultyConfig> = {
  beginner: {
    id: 'beginner',
    label: 'Beginner',
    description: 'Very gentle pace · Largest tiles',
    dropSpeed: 85,
    spawnIntervalMs: 2200,
    minSpawnIntervalMs: 900,
    spawnAccelFactor: 0.98,
    speedIncreaseRate: 2,
    maxSpeedMultiplier: 1.6,
    ceilingHeight: 45,
    tileRadius: 34,
    maxInFlightOffset: -2,
    phoneTargetOnScreen: 2,
    wallWidthPct: 100,
    paceEnabled: true,
  },
  easy: {
    id: 'easy',
    label: 'Easy',
    description: 'Relaxed pace · Big tiles',
    dropSpeed: 120,
    spawnIntervalMs: 1650,
    minSpawnIntervalMs: 650,
    spawnAccelFactor: 0.97,
    speedIncreaseRate: 3,
    maxSpeedMultiplier: 1.9,
    ceilingHeight: 50,
    tileRadius: 32,
    maxInFlightOffset: -1,
    phoneTargetOnScreen: 2.5,
    wallWidthPct: 100,
    paceEnabled: true,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    description: 'Gentle pace · Larger tiles',
    dropSpeed: 170,
    spawnIntervalMs: 1200,
    minSpawnIntervalMs: 480,
    spawnAccelFactor: 0.96,
    speedIncreaseRate: 5,
    maxSpeedMultiplier: 2.2,
    ceilingHeight: 60,
    tileRadius: 31,
    maxInFlightOffset: -1,
    phoneTargetOnScreen: 3,
    wallWidthPct: 100,
    paceEnabled: true,
    paceCurve: 'log',
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    description: 'Starts like Normal · Speeds up over time',
    // Starts at Normal's speed, tiles, ceiling and phone cadence; time ramp caps near old Hard.
    dropSpeed: 170,
    spawnIntervalMs: 1200,
    minSpawnIntervalMs: 900,
    spawnAccelFactor: 0.96,
    speedIncreaseRate: 5,
    maxSpeedMultiplier: 260 / 170,
    ceilingHeight: 60,
    tileRadius: 31,
    maxInFlightOffset: -1,
    phoneTargetOnScreen: 3,
    wallWidthPct: 100,
    paceEnabled: true,
    paceCurve: 'time',
  },
  nightmare: {
    id: 'nightmare',
    label: 'Nightmare',
    description: 'Fast from the start',
    // Former Hard settings (constant speed, denser phone cadence, tighter ceiling).
    dropSpeed: 260,
    spawnIntervalMs: 850,
    minSpawnIntervalMs: 300,
    spawnAccelFactor: 0.92,
    speedIncreaseRate: 10,
    maxSpeedMultiplier: 3.5,
    ceilingHeight: 85,
    tileRadius: 28,
    maxInFlightOffset: 0,
    phoneTargetOnScreen: 4,
    wallWidthPct: 100,
    paceEnabled: false,
  },
};

export const DEFAULT_FREE_PLAY_SETTINGS: FreePlaySettings = {
  dropSpeed: 170,
  spawnDelayMs: 80,
  timeLimit: 0,
  tileRadius: 31,
  speedIncreaseEnabled: false,
  speedIncreaseRate: 5,
  wallWidthPct: 100,
  ceilingHeight: 60,
};

// Classroom / Team Mode Types
export interface ClassroomTeam {
  id: string;
  name: string;
  color: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  emoji: string;
  score: number;
  wordsFound: WordEntry[];
  turnsCompleted: number;
}

export type TurnConditionType = 'timer' | 'words';

export interface ClassroomConfig {
  teams: ClassroomTeam[];
  turnCondition: TurnConditionType; // 'timer' or 'words'
  turnSeconds: number; // e.g. 30, 45, 60, 90
  turnWordsTarget: number; // e.g. 1, 2, 3, 5
  totalRounds: number; // 0 = endless / teacher controls, or 1, 2, 3, 4, 5 rounds
  cleanBoardEachTurn: boolean;
}

export interface TurnSummary {
  teamName: string;
  teamEmoji: string;
  teamColor: string;
  pointsEarned: number;
  wordsFound: WordEntry[];
  reason: 'time_up' | 'words_met' | 'board_filled' | 'passed';
}

export interface ClassroomMatchState {
  config: ClassroomConfig;
  currentTeamIndex: number;
  currentRound: number;
  isMatchFinished: boolean;
  turnWordsCount: number;
  turnScoreGained: number;
  turnTimeLeft: number;
  lastTurnSummary: TurnSummary | null;
}
