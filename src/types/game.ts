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
