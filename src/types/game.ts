import { LetterTileInfo } from '../utils/letterBag';

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
}

export type GameScreen =
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAMEOVER'
  | 'HIGHSCORES'
  | 'CLASSROOM_SETUP'
  | 'CLASSROOM_TURN_TRANSITION'
  | 'CLASSROOM_VICTORY';

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
  spellingWordsEnabled: boolean; // whether spelling words mode is active
  spellingWordsList: string; // text list of words entered by player/teacher/parent
}

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'nightmare';

export type LeaderboardMode = 'quick' | 'solo' | 'team';

export interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  description: string;
  dropSpeed: number; // constant base fall speed (px/sec in reference viewBox)
  spawnIntervalMs: number; // base spawn interval in ms
  minSpawnIntervalMs: number; // floor when pace accelerates
  spawnAccelFactor: number; // multiplier per word submitted (e.g. 0.92)
  speedIncreaseRate: number; // % speed increase per word submitted
  maxSpeedMultiplier: number; // max multiplier over base dropSpeed
  ceilingHeight: number; // danger line Y coordinate
  tileRadius: number; // hex radius
  maxInFlightOffset: number; // adjustment to max concurrent falling tiles
}

export const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
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
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    description: 'Balanced classic pace',
    dropSpeed: 260,
    spawnIntervalMs: 850,
    minSpawnIntervalMs: 300,
    spawnAccelFactor: 0.92,
    speedIncreaseRate: 10,
    maxSpeedMultiplier: 3.5,
    ceilingHeight: 85,
    tileRadius: 28,
    maxInFlightOffset: 0,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    description: 'Fast drops · Higher ceiling',
    dropSpeed: 340,
    spawnIntervalMs: 640,
    minSpawnIntervalMs: 230,
    spawnAccelFactor: 0.9,
    speedIncreaseRate: 14,
    maxSpeedMultiplier: 4.0,
    ceilingHeight: 105,
    tileRadius: 26,
    maxInFlightOffset: 1,
  },
  nightmare: {
    id: 'nightmare',
    label: 'Nightmare',
    description: 'Extreme speed & spawns',
    dropSpeed: 430,
    spawnIntervalMs: 460,
    minSpawnIntervalMs: 180,
    spawnAccelFactor: 0.88,
    speedIncreaseRate: 18,
    maxSpeedMultiplier: 4.5,
    ceilingHeight: 130,
    tileRadius: 25,
    maxInFlightOffset: 2,
  },
};

export const DEFAULT_FREE_PLAY_SETTINGS: FreePlaySettings = {
  dropSpeed: 260,
  spawnDelayMs: 80,
  timeLimit: 0,
  tileRadius: 28,
  speedIncreaseEnabled: false,
  speedIncreaseRate: 10,
  wallWidthPct: 100,
  ceilingHeight: 85,
  spellingWordsEnabled: false,
  spellingWordsList: 'CAT, DOG, BIRD, FISH, TREE, BOOK, STAR, PLAY',
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
  useSpellingList: boolean;
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
