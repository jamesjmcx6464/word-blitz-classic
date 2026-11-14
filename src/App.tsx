/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HexTile,
  FloatingScore,
  GameScreen,
  ViewMode,
  WordEntry,
  FreePlaySettings,
  DEFAULT_FREE_PLAY_SETTINGS,
  DifficultyChoice,
  DifficultyConfig,
  ScreenModeType,
  ClassroomConfig,
  ClassroomMatchState,
  TurnSummary,
} from './types/game';
import {
  SPAWN_Y,
  GROUND_Y,
  BOARD_HEIGHT,
  BOARD_WIDTH_WIDE,
  findLandingY,
  findGroundedHexIds,
  computeScreenSpeedMultiplier,
} from './utils/hexPhysics';
import { drawRandomLetter, LetterTileInfo } from './utils/letterBag';
import { isValidWord, getWordScore } from './data/dictionary';
import { soundManager } from './utils/audio';
import { saveHighScore, makeTimeBucketKey } from './utils/highScores';
import { getSavedDifficulty, saveDifficulty, getDifficultyConfig } from './utils/difficulty';
import {
  CustomGameSettings,
  loadCustomSettings,
  saveCustomSettings,
  clearCustomSettings,
} from './utils/customSettings';
import { SettingsModal } from './components/SettingsModal';
import { recordSoloPlayerResult } from './utils/registeredPlayers';
import { detectDevice } from './utils/screenMode';

import { GameHUD } from './components/GameHUD';
import { WordBar } from './components/WordBar';
import { GameBoard } from './components/GameBoard';
import { StartMenu } from './components/StartMenu';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { HighScoresModal, LastSoloResult } from './components/HighScoresModal';
import { WordHistoryModal } from './components/WordHistoryModal';
import { TurnTransitionModal } from './components/TurnTransitionModal';
import { ClassroomVictoryModal } from './components/ClassroomVictoryModal';
import { ClassroomScoreboardModal } from './components/ClassroomScoreboardModal';
import { PlayNowModal } from './components/PlayNowModal';
import { SoloPlayerSetupModal } from './components/SoloPlayerSetupModal';
import confetti from 'canvas-confetti';

export default function App() {
  // Screen state
  const [screen, setScreen] = useState<GameScreen>('MENU');

  // Solo student player identity for classroom leaderboards
  const [currentSoloPlayer, setCurrentSoloPlayer] = useState<{
    name: string;
    logo: string;
  } | null>(null);
  const currentSoloPlayerRef = useRef<{ name: string; logo: string } | null>(null);
  currentSoloPlayerRef.current = currentSoloPlayer;

  // Most recent completed named Solo Play result (shown on Leaderboard screen)
  const [lastSoloResult, setLastSoloResult] = useState<LastSoloResult | null>(null);

  // Modals for Solo Player Setup and Team Play Setup
  const [isSoloSetupOpen, setIsSoloSetupOpen] = useState<boolean>(false);
  const [isTeamSetupOpen, setIsTeamSetupOpen] = useState<boolean>(false);

  // Selected Difficulty (Easy, Normal, Hard, Nightmare) persisted across sessions
  const [difficulty, setDifficulty] = useState<DifficultyChoice>(() => getSavedDifficulty());
  const difficultyRef = useRef<DifficultyChoice>(difficulty);
  difficultyRef.current = difficulty;

  // Player's own gameplay settings (Home > Settings); enables the 'Custom' difficulty when saved
  const [customSettings, setCustomSettings] = useState<CustomGameSettings | null>(() =>
    loadCustomSettings()
  );
  const customSettingsRef = useRef<CustomGameSettings | null>(customSettings);
  customSettingsRef.current = customSettings;
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  /** Full gameplay config for a difficulty choice (presets or saved Custom settings). */
  const configFor = (choice: DifficultyChoice): DifficultyConfig =>
    getDifficultyConfig(choice, customSettingsRef.current);

  /** Settings fields every run takes from its difficulty config. */
  const settingsFromConfig = (c: DifficultyConfig) => ({
    dropSpeed: c.dropSpeed,
    tileRadius: c.tileRadius,
    ceilingHeight: c.ceilingHeight,
    speedIncreaseRate: c.speedIncreaseRate,
    wallWidthPct: c.wallWidthPct,
  });

  // Dynamic spawn interval tempo & dynamic pace flag (accelerates on word enter)
  const spawnIntervalRef = useRef<number>(
    getDifficultyConfig(difficulty, customSettings).spawnIntervalMs
  );
  const dynamicPaceEnabledRef = useRef<boolean>(true);
  const activeRoundSecondsRef = useRef<number>(60);
  const lastQuickPlayConfigRef = useRef<{
    difficulty: DifficultyChoice;
    timeLimit: number;
  }>({ difficulty, timeLimit: 120 });

  // Screen Mode: 'pc' (about half width) vs 'phone' (fits screen) - automatically detected by device
  const [screenMode, setScreenMode] = useState<ScreenModeType>(() => detectDevice());
  const screenModeRef = useRef<ScreenModeType>(screenMode);
  screenModeRef.current = screenMode;

  // Proportional falling/moving speed multiplier computed from play area size (desktop ref = 1.0)
  const speedMultiplierRef = useRef<number>(1.0);

  // Auto-detect device mode on resize/orientation change
  useEffect(() => {
    const handleDeviceCheck = () => {
      const detected = detectDevice();
      setScreenMode(detected);
      screenModeRef.current = detected;
    };

    window.addEventListener('resize', handleDeviceCheck);
    window.addEventListener('orientationchange', handleDeviceCheck);
    return () => {
      window.removeEventListener('resize', handleDeviceCheck);
      window.removeEventListener('orientationchange', handleDeviceCheck);
    };
  }, []);

  // ViewMode layout derived strictly from screenMode: 'pc' -> 'wide', 'phone' -> 'narrow'
  const viewMode: ViewMode = screenMode === 'pc' ? 'wide' : 'narrow';

  // Score tracking
  const [score, setScore] = useState<number>(0);
  const [longestWord, setLongestWord] = useState<string>('');
  const [totalWordsCleared, setTotalWordsCleared] = useState<number>(0);

  // Audio settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.enabled);

  // Hexagons state
  const [frozenTiles, setFrozenTiles] = useState<HexTile[]>([]);
  const [fallingTiles, setFallingTiles] = useState<HexTile[]>([]);
  const fallingTilesRef = useRef<HexTile[]>([]);
  fallingTilesRef.current = fallingTiles;

  // Backwards compatibility alias: first falling tile if any
  const fallingTile = fallingTiles[0] || null;
  const setFallingTile = (tile: HexTile | null) => {
    if (tile === null) {
      setFallingTiles([]);
      fallingTilesRef.current = [];
    } else {
      setFallingTiles([tile]);
      fallingTilesRef.current = [tile];
    }
  };

  const [selectedTiles, setSelectedTiles] = useState<HexTile[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [pulsingTileIds, setPulsingTileIds] = useState<Set<string>>(new Set());

  // Word submission & UI feedback
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Game Over summary & reason (Solo)
  const [gameOverStats, setGameOverStats] = useState<{
    rank: number;
    isNewHighScore: boolean;
  }>({ rank: -1, isNewHighScore: false });
  const [gameOverReason, setGameOverReason] = useState<string>('The letters reached the top!');

  // Free Play Settings (persistent in localStorage)
  const [freePlaySettings, setFreePlaySettings] = useState<FreePlaySettings>(() => {
    try {
      const saved = localStorage.getItem('word_blitz_free_play_settings');
      if (saved) {
        // Drop fields from the retired word list feature (old saves may still have them)
        const parsed = JSON.parse(saved) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object') {
          delete parsed.spellingWordsEnabled;
          delete parsed.spellingWordsList;
          delete parsed.wordListName;
          return { ...DEFAULT_FREE_PLAY_SETTINGS, ...parsed };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_FREE_PLAY_SETTINGS;
  });
  const freePlaySettingsRef = useRef<FreePlaySettings>(freePlaySettings);
  freePlaySettingsRef.current = freePlaySettings;

  // In-Run dynamic speed and time limit countdown (Solo)
  const freePlaySpeedRef = useRef<number>(freePlaySettings.dropSpeed);
  const [freePlayTimeLeft, setFreePlayTimeLeft] = useState<number | null>(null);

  // Word History tracking
  const [wordHistory, setWordHistory] = useState<WordEntry[]>([]);
  const [isWordHistoryOpen, setIsWordHistoryOpen] = useState<boolean>(false);

  // Classroom Team Match State
  const [classroomMatch, setClassroomMatch] = useState<ClassroomMatchState | null>(null);
  const classroomMatchRef = useRef<ClassroomMatchState | null>(null);
  classroomMatchRef.current = classroomMatch;

  const [isClassroomScoreboardOpen, setIsClassroomScoreboardOpen] = useState<boolean>(false);
  const [activeTurnWords, setActiveTurnWords] = useState<WordEntry[]>([]);
  const activeTurnWordsRef = useRef<WordEntry[]>(activeTurnWords);
  activeTurnWordsRef.current = activeTurnWords;

  const handleUpdateFreePlaySettings = (newSettings: FreePlaySettings) => {
    setFreePlaySettings(newSettings);
    freePlaySettingsRef.current = newSettings;
    try {
      localStorage.setItem('word_blitz_free_play_settings', JSON.stringify(newSettings));
    } catch {
      // ignore
    }
    if (freePlaySpeedRef.current < newSettings.dropSpeed) {
      freePlaySpeedRef.current = newSettings.dropSpeed;
    }
  };

  const handleResetFreePlaySettings = () => {
    setFreePlaySettings(DEFAULT_FREE_PLAY_SETTINGS);
    freePlaySettingsRef.current = DEFAULT_FREE_PLAY_SETTINGS;
    freePlaySpeedRef.current = DEFAULT_FREE_PLAY_SETTINGS.dropSpeed;
    try {
      localStorage.removeItem('word_blitz_free_play_settings');
    } catch {
      // ignore
    }
  };

  const handleChangeDifficulty = (level: DifficultyChoice) => {
    setDifficulty(level);
    difficultyRef.current = level;
    saveDifficulty(level);
    const preset = configFor(level);
    spawnIntervalRef.current = preset.spawnIntervalMs;
    handleUpdateFreePlaySettings({
      ...freePlaySettingsRef.current,
      ...settingsFromConfig(preset),
    });
  };

  // Settings screen: save custom settings and switch to the Custom difficulty
  const handleSaveCustomSettings = (next: CustomGameSettings) => {
    saveCustomSettings(next);
    setCustomSettings(next);
    customSettingsRef.current = next;
    handleChangeDifficulty('custom');
    setIsSettingsOpen(false);
  };

  // Settings screen: forget custom settings (Custom option disappears)
  const handleResetCustomSettings = () => {
    clearCustomSettings();
    setCustomSettings(null);
    customSettingsRef.current = null;
    if (difficultyRef.current === 'custom') {
      handleChangeDifficulty('normal');
    }
  };

  // Refs for requestAnimationFrame loop
  const animFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const isSpawningRef = useRef<boolean>(false);

  // Ref wrappers for animation loop and closures
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  const frozenTilesRef = useRef(frozenTiles);
  frozenTilesRef.current = frozenTiles;
  const fallingTileRef = useRef(fallingTile);
  fallingTileRef.current = fallingTile;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const longestWordRef = useRef(longestWord);
  longestWordRef.current = longestWord;
  const totalWordsClearedRef = useRef(totalWordsCleared);
  totalWordsClearedRef.current = totalWordsCleared;

  // Dynamic Board Container reference & responsive board width to stretch to fit the screen
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const availW = Math.max(420, window.innerWidth - 32);
      const availH = Math.max(300, window.innerHeight - 170);
      return Math.max(480, Math.round(BOARD_HEIGHT * (availW / availH)));
    }
    return BOARD_WIDTH_WIDE;
  });
  const boardWidthRef = useRef<number>(boardWidth);
  boardWidthRef.current = boardWidth;

  // Dynamically observe board container size so the game area stretches and speed scales proportionally
  useEffect(() => {
    const updateDimensions = () => {
      const el = boardContainerRef.current;
      if (!el) {
        if (typeof window !== 'undefined') {
          const estW =
            screenModeRef.current === 'pc'
              ? Math.max(480, Math.min(window.innerWidth * 0.5, window.innerWidth)) - 16
              : Math.max(280, window.innerWidth - 16);
          const estH = Math.max(260, window.innerHeight - 170);
          const computed = Math.max(480, Math.round(BOARD_HEIGHT * (estW / estH)));
          setBoardWidth(computed);
          boardWidthRef.current = computed;
          speedMultiplierRef.current = computeScreenSpeedMultiplier(estW, estH);
        }
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 50) {
        const computed = Math.max(480, Math.round(BOARD_HEIGHT * (rect.width / rect.height)));
        setBoardWidth(computed);
        boardWidthRef.current = computed;
        speedMultiplierRef.current = computeScreenSpeedMultiplier(rect.width, rect.height);
      }
    };

    updateDimensions();
    const el = boardContainerRef.current;
    let observer: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateDimensions);
      observer.observe(el);
    }
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, [screen, screenMode]);

  // Active ceiling Y coordinate
  const activeCeilingY = freePlaySettings.ceilingHeight;

  // Active horizontal wall boundaries
  const activeWallBounds = React.useMemo(() => {
    const activeWidth = boardWidth;
    if (freePlaySettings.wallWidthPct < 100) {
      const effectiveWidth = Math.round(activeWidth * (freePlaySettings.wallWidthPct / 100));
      const margin = Math.round((activeWidth - effectiveWidth) / 2);
      return { left: margin, right: margin + effectiveWidth, width: effectiveWidth };
    }
    return { left: 0, right: activeWidth, width: activeWidth };
  }, [boardWidth, freePlaySettings.wallWidthPct]);

  // Active board width (for GameBoard viewBox)
  const activeBoardWidth = boardWidth;

  // Toggle audio
  const handleToggleSound = () => {
    const nextState = soundManager.toggle();
    setSoundEnabled(nextState);
  };

  // Trigger Game Over (Solo play & Quick Play)
  const triggerGameOver = useCallback((customReason?: string) => {
    if (screenRef.current !== 'PLAYING') return;

    soundManager.playGameOver();
    const reasonText = customReason || 'The letters reached the top!';
    setGameOverReason(reasonText);

    const activePlayer = currentSoloPlayerRef.current;
    const roundSec = activeRoundSecondsRef.current;
    const timeBucket = makeTimeBucketKey('timer', roundSec);
    const mode = activePlayer ? 'solo' : 'quick';

    if (activePlayer) {
      recordSoloPlayerResult(activePlayer.name, activePlayer.logo, scoreRef.current);
    }

    const stats = saveHighScore({
      mode,
      timeBucket,
      timeSeconds: roundSec,
      difficulty: difficultyRef.current,
      score: scoreRef.current,
      longestWord: longestWordRef.current,
      totalWords: totalWordsClearedRef.current,
      playerName: activePlayer?.name,
      playerLogo: activePlayer?.logo,
    });
    setGameOverStats({ rank: stats.rank, isNewHighScore: stats.isNewHighScore });

    if (activePlayer) {
      // Classroom Solo Play: record score in Solo bucket and go straight to Leaderboard screen
      setLastSoloResult({
        entryId: stats.entryId,
        mode: 'solo',
        timeBucket,
        playerName: activePlayer.name,
        playerLogo: activePlayer.logo,
        score: scoreRef.current,
        totalWords: totalWordsClearedRef.current,
        longestWord: longestWordRef.current || '-',
        rank: stats.rank,
        isNewHighScore: stats.isNewHighScore,
        reason: reasonText,
      });
      setScreen('HIGHSCORES');
    } else {
      setLastSoloResult(null);
      setScreen('GAMEOVER');
    }
  }, []);

  // Classroom: Complete current turn and rotate to next team
  const handleCompleteTurn = useCallback(
    (reason: 'time_up' | 'words_met' | 'board_filled' | 'passed') => {
      soundManager.playWordSuccess(4);
      if (!classroomMatchRef.current) return;

      const cur = classroomMatchRef.current;
      const curTeamIdx = cur.currentTeamIndex;
      const curTeam = cur.config.teams[curTeamIdx];

      // Stop falling tiles immediately
      fallingTilesRef.current = [];
      setFallingTiles([]);
      setSelectedTiles([]);

      const turnSummary: TurnSummary = {
        teamName: curTeam.name,
        teamEmoji: curTeam.emoji,
        teamColor: curTeam.color,
        pointsEarned: cur.turnScoreGained,
        wordsFound: [...activeTurnWordsRef.current],
        reason,
      };

      // Update team in config
      const updatedTeams = cur.config.teams.map((t, idx) => {
        if (idx === curTeamIdx) {
          return {
            ...t,
            score: t.score + cur.turnScoreGained,
            wordsFound: [...t.wordsFound, ...activeTurnWordsRef.current],
            turnsCompleted: t.turnsCompleted + 1,
          };
        }
        return t;
      });

      // Rotate to next team & check round completion
      const nextTeamIndex = (curTeamIdx + 1) % updatedTeams.length;
      let nextRound = cur.currentRound;
      if (nextTeamIndex === 0) {
        nextRound += 1;
      }

      const isFinished = cur.config.totalRounds > 0 && nextRound > cur.config.totalRounds;

      const updatedMatch: ClassroomMatchState = {
        ...cur,
        config: {
          ...cur.config,
          teams: updatedTeams,
        },
        currentTeamIndex: nextTeamIndex,
        currentRound: nextRound,
        isMatchFinished: isFinished,
        turnWordsCount: 0,
        turnScoreGained: 0,
        turnTimeLeft: cur.config.turnSeconds,
        lastTurnSummary: turnSummary,
      };

      setClassroomMatch(updatedMatch);
      classroomMatchRef.current = updatedMatch;

      if (isFinished) {
        // Save each team's match score into the Team Play leaderboard bucket
        const teamBucket =
          cur.config.turnCondition === 'timer'
            ? makeTimeBucketKey('timer', cur.config.turnSeconds)
            : makeTimeBucketKey('words', cur.config.turnWordsTarget);
        const teamTimeSec =
          cur.config.turnCondition === 'timer' ? cur.config.turnSeconds : undefined;

        updatedTeams.forEach((team) => {
          const teamLongest = team.wordsFound.reduce(
            (max, w) => (w.word.length > max.length ? w.word : max),
            ''
          );
          saveHighScore({
            mode: 'team',
            timeBucket: teamBucket,
            timeSeconds: teamTimeSec,
            difficulty: difficultyRef.current,
            score: team.score,
            longestWord: teamLongest || '-',
            totalWords: team.wordsFound.length,
            playerName: team.name,
            playerLogo: team.emoji,
            allowZeroScore: true,
          });
        });

        setScreen('CLASSROOM_VICTORY');
      } else {
        setScreen('CLASSROOM_TURN_TRANSITION');
      }
    },
    []
  );

  // Spawn next falling hexagon
  const spawnNextHexagon = useCallback(() => {
    if (screenRef.current !== 'PLAYING') return;

    const activeWidth = boardWidthRef.current;
    const curTileRadius = freePlaySettingsRef.current.tileRadius;
    const curTileH = (Math.sqrt(3) * curTileRadius) / 2;

    const wallPct = freePlaySettingsRef.current.wallWidthPct;
    let left = 0;
    let right = activeWidth;
    if (wallPct < 100) {
      const effW = Math.round(activeWidth * (wallPct / 100));
      left = Math.round((activeWidth - effW) / 2);
      right = left + effW;
    }
    let minX = left + curTileRadius + 8;
    let maxX = right - curTileRadius - 8;
    if (minX >= maxX) {
      minX = left + curTileRadius;
      maxX = right - curTileRadius;
    }

    const randomX = minX + Math.random() * (maxX - minX);

    // Check if an existing frozen tile is already completely above the ceiling line
    const curCeilingY = freePlaySettingsRef.current.ceilingHeight;
    const liveFrozen = frozenTilesRef.current.filter((t) => t.isFrozen);
    if (liveFrozen.some((t) => t.y + curTileH <= curCeilingY)) {
      if (classroomMatchRef.current) {
        handleCompleteTurn('board_filled');
        return;
      }
      triggerGameOver();
      return;
    }

    const letter: LetterTileInfo = drawRandomLetter();

    const newTile: HexTile = {
      id: `tile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${Math.floor(performance.now() * 100)}`,
      letter,
      x: randomX,
      y: SPAWN_Y,
      targetY: SPAWN_Y,
      isFrozen: false,
      isFalling: true,
      isSelected: false,
    };

    const nextList = [...fallingTilesRef.current, newTile];
    fallingTilesRef.current = nextList;
    setFallingTiles(nextList);
  }, [triggerGameOver, handleCompleteTurn]);

  // Free Play Round Timer (when timeLimit > 0 and not in classroom mode)
  useEffect(() => {
    if (screen !== 'PLAYING' || freePlayTimeLeft === null || classroomMatch !== null) return;

    const timer = setInterval(() => {
      setFreePlayTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          triggerGameOver("Time's up! Outstanding run!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, freePlayTimeLeft, classroomMatch, triggerGameOver]);

  // Classroom Turn Timer (when turnCondition === 'timer' and in classroom mode)
  useEffect(() => {
    if (
      screen !== 'PLAYING' ||
      !classroomMatch ||
      classroomMatch.config.turnCondition !== 'timer'
    ) {
      return;
    }

    const timer = setInterval(() => {
      setClassroomMatch((prev) => {
        if (!prev) return null;
        if (prev.turnTimeLeft <= 1) {
          clearInterval(timer);
          handleCompleteTurn('time_up');
          return { ...prev, turnTimeLeft: 0 };
        }
        return { ...prev, turnTimeLeft: prev.turnTimeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    screen,
    classroomMatch?.currentTeamIndex,
    classroomMatch?.currentRound,
    classroomMatch?.config.turnCondition,
    handleCompleteTurn,
  ]);

  // Reset and start new solo game (with optional overrides for Quick Play or Named Solo Play)
  const handleStartGame = (overrides?: {
    timeLimit?: number;
    dropSpeed?: number;
    spawnIntervalMs?: number;
    dynamicPace?: boolean;
  }) => {
    setClassroomMatch(null);
    classroomMatchRef.current = null;

    const preset = configFor(difficultyRef.current);

    setScore(0);
    scoreRef.current = 0;
    setLongestWord('');
    setTotalWordsCleared(0);
    setWordHistory([]);
    frozenTilesRef.current = [];
    fallingTilesRef.current = [];
    setFrozenTiles([]);
    setFallingTiles([]);
    setSelectedTiles([]);
    setFloatingScores([]);
    setPulsingTileIds(new Set());
    setErrorMessage(null);
    setIsShaking(false);
    isSpawningRef.current = false;
    spawnTimerRef.current = 0;
    lastTimeRef.current = performance.now();

    freePlaySpeedRef.current = overrides?.dropSpeed ?? freePlaySettingsRef.current.dropSpeed ?? preset.dropSpeed;
    spawnIntervalRef.current = overrides?.spawnIntervalMs ?? preset.spawnIntervalMs;
    dynamicPaceEnabledRef.current =
      overrides?.dynamicPace ?? freePlaySettingsRef.current.speedIncreaseEnabled;

    const effectiveTimeLimit =
      overrides?.timeLimit !== undefined
        ? overrides.timeLimit
        : freePlaySettingsRef.current.timeLimit;
    activeRoundSecondsRef.current = effectiveTimeLimit;

    if (effectiveTimeLimit > 0) {
      setFreePlayTimeLeft(effectiveTimeLimit);
    } else {
      setFreePlayTimeLeft(null);
    }

    setScreen('PLAYING');

    spawnTimerRef.current = 0; // loop spawns the first tile
  };

  // Start Quick Play using a specific DifficultyLevel & timeLimit
  const launchQuickPlayWithConfig = (diffLevel: DifficultyChoice, timeLimitSec: number) => {
    setCurrentSoloPlayer(null);
    currentSoloPlayerRef.current = null;
    setLastSoloResult(null);

    const preset = configFor(diffLevel);
    lastQuickPlayConfigRef.current = {
      difficulty: diffLevel,
      timeLimit: timeLimitSec,
    };

    const quickSettings: FreePlaySettings = {
      ...DEFAULT_FREE_PLAY_SETTINGS,
      ...settingsFromConfig(preset),
      timeLimit: timeLimitSec,
      speedIncreaseEnabled: preset.paceEnabled,
    };
    handleUpdateFreePlaySettings(quickSettings);

    handleStartGame({
      timeLimit: timeLimitSec,
      dropSpeed: preset.dropSpeed,
      spawnIntervalMs: preset.spawnIntervalMs,
      dynamicPace: preset.paceEnabled,
    });
  };

  // Quick Play timer on/off (persisted). Off = endless round, ends when the pile reaches the line.
  const QUICK_TIMER_KEY = 'word_blitz_quick_play_timer_v1';
  const [quickPlayTimerOn, setQuickPlayTimerOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('word_blitz_quick_play_timer_v1') !== 'off';
    } catch {
      return true;
    }
  });
  const quickPlayTimerOnRef = useRef<boolean>(quickPlayTimerOn);
  quickPlayTimerOnRef.current = quickPlayTimerOn;
  const handleChangeQuickPlayTimer = (on: boolean) => {
    setQuickPlayTimerOn(on);
    quickPlayTimerOnRef.current = on;
    try {
      localStorage.setItem(QUICK_TIMER_KEY, on ? 'on' : 'off');
    } catch {
      // ignore storage errors
    }
  };

  // Quick Play: Immediate start with active Difficulty defaults (2 min timer or no timer, pace rises on word enter)
  const handleQuickPlay = () => {
    launchQuickPlayWithConfig(difficultyRef.current, quickPlayTimerOnRef.current ? 120 : 0);
  };

  // Quick Play "Play Again": restart Quick Play with the exact same settings as the finished run
  const handleQuickPlayAgain = () => {
    const { difficulty: savedDiff, timeLimit } = lastQuickPlayConfigRef.current;
    launchQuickPlayWithConfig(savedDiff, timeLimit);
  };

  // Named Solo Play (Classroom student picks/enters name, logo, words & timer; uses selected Difficulty)
  const handleStartNamedSolo = (
    playerName: string,
    playerLogo: string,
    roundSeconds: number
  ) => {
    const player = { name: playerName, logo: playerLogo };
    setCurrentSoloPlayer(player);
    currentSoloPlayerRef.current = player;
    setLastSoloResult(null);
    setIsSoloSetupOpen(false);

    const preset = configFor(difficultyRef.current);
    const soloSettings: FreePlaySettings = {
      ...freePlaySettingsRef.current,
      ...settingsFromConfig(preset),
      timeLimit: roundSeconds,
      speedIncreaseEnabled: preset.paceEnabled,
    };
    handleUpdateFreePlaySettings(soloSettings);

    handleStartGame({
      timeLimit: roundSeconds,
      dropSpeed: preset.dropSpeed,
      spawnIntervalMs: preset.spawnIntervalMs,
      dynamicPace: preset.paceEnabled,
    });
  };

  // Classroom: Start Match from Setup
  const handleStartClassroomMatch = (config: ClassroomConfig) => {
    const preset = configFor(difficultyRef.current);
    handleUpdateFreePlaySettings({
      ...freePlaySettingsRef.current,
      ...settingsFromConfig(preset),
    });
    spawnIntervalRef.current = preset.spawnIntervalMs;

    const initialState: ClassroomMatchState = {
      config,
      currentTeamIndex: 0,
      currentRound: 1,
      isMatchFinished: false,
      turnWordsCount: 0,
      turnScoreGained: 0,
      turnTimeLeft: config.turnSeconds,
      lastTurnSummary: null,
    };

    setClassroomMatch(initialState);
    classroomMatchRef.current = initialState;
    setWordHistory([]);
    setScreen('CLASSROOM_TURN_TRANSITION');
  };

  // Classroom: Start specific team's turn
  const handleStartClassroomTurn = () => {
    if (!classroomMatchRef.current) return;
    const cur = classroomMatchRef.current;
    const activeTeam = cur.config.teams[cur.currentTeamIndex];
    const preset = configFor(difficultyRef.current);
    spawnIntervalRef.current = preset.spawnIntervalMs;
    freePlaySpeedRef.current = preset.dropSpeed;

    // Clear board if cleanBoardEachTurn is enabled
    if (cur.config.cleanBoardEachTurn) {
      frozenTilesRef.current = [];
      setFrozenTiles([]);
      fallingTilesRef.current = [];
      setFallingTiles([]);
      setSelectedTiles([]);
      setFloatingScores([]);
      setPulsingTileIds(new Set());
    } else {
      fallingTilesRef.current = [];
      setFallingTiles([]);
    }

    setActiveTurnWords([]);
    activeTurnWordsRef.current = [];

    // Score HUD shows active team's score
    setScore(activeTeam.score);
    scoreRef.current = activeTeam.score;

    setClassroomMatch({
      ...cur,
      turnWordsCount: 0,
      turnScoreGained: 0,
      turnTimeLeft: cur.config.turnSeconds,
    });

    setErrorMessage(null);
    setIsShaking(false);
    isSpawningRef.current = false;
    lastTimeRef.current = performance.now();

    setScreen('PLAYING');

    spawnTimerRef.current = 0; // loop spawns the first tile
  };

  // Classroom: Rematch with same teams
  const handleClassroomRematch = () => {
    if (!classroomMatchRef.current) return;
    const cur = classroomMatchRef.current;
    const resetTeams = cur.config.teams.map((t) => ({
      ...t,
      score: 0,
      wordsFound: [],
      turnsCompleted: 0,
    }));

    const freshMatch: ClassroomMatchState = {
      ...cur,
      config: {
        ...cur.config,
        teams: resetTeams,
      },
      currentTeamIndex: 0,
      currentRound: 1,
      isMatchFinished: false,
      turnWordsCount: 0,
      turnScoreGained: 0,
      turnTimeLeft: cur.config.turnSeconds,
      lastTurnSummary: null,
    };

    setClassroomMatch(freshMatch);
    classroomMatchRef.current = freshMatch;
    setWordHistory([]);
    setScreen('CLASSROOM_TURN_TRANSITION');
  };

  // Classroom: Exit to main menu
  const handleExitClassroomToMenu = () => {
    setClassroomMatch(null);
    classroomMatchRef.current = null;
    setScreen('MENU');
  };

  // Brief light flash feedback in place without moving or scaling
  const pulseTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const triggerTilePulse = (tileId: string) => {
    const existingTimer = pulseTimeoutsRef.current.get(tileId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    setPulsingTileIds((prev) => {
      const next = new Set(prev);
      next.add(tileId);
      return next;
    });

    const timer = setTimeout(() => {
      pulseTimeoutsRef.current.delete(tileId);
      setPulsingTileIds((prev) => {
        const next = new Set(prev);
        next.delete(tileId);
        return next;
      });
    }, 175);
    pulseTimeoutsRef.current.set(tileId, timer);
  };

  // Tile Selection Toggle (allows both falling and landed tiles)
  const handleTileClick = (tile: HexTile) => {
    if (screen !== 'PLAYING' || tile.isClearing) return;

    setErrorMessage(null);
    triggerTilePulse(tile.id);

    const isAlreadySelected = selectedTiles.some((t) => t.id === tile.id);
    if (isAlreadySelected) {
      soundManager.playDeselect();
      setSelectedTiles((prev) => prev.filter((t) => t.id !== tile.id));
    } else {
      soundManager.playSelect();
      setSelectedTiles((prev) => [...prev, tile]);
    }
  };

  // Clear all selections
  const handleClearSelection = () => {
    if (selectedTiles.length === 0) return;
    soundManager.playDeselect();
    selectedTiles.forEach((t) => triggerTilePulse(t.id));
    setSelectedTiles([]);
    setErrorMessage(null);
  };

  // Remove a specific tile from selection (from word bar)
  const handleRemoveTileFromWord = (tile: HexTile) => {
    soundManager.playDeselect();
    triggerTilePulse(tile.id);
    setSelectedTiles((prev) => prev.filter((t) => t.id !== tile.id));
    setErrorMessage(null);
  };

  // Bump both fall speed and spawn rate whenever a word is entered (success or failure)
  const bumpPaceOnWordEnter = () => {
    if (
      !classroomMatchRef.current &&
      (dynamicPaceEnabledRef.current || freePlaySettingsRef.current.speedIncreaseEnabled)
    ) {
      const preset = configFor(difficultyRef.current);
      const baseSpeed = freePlaySettingsRef.current.dropSpeed || preset.dropSpeed;
      const bump = 1 + (freePlaySettingsRef.current.speedIncreaseRate || preset.speedIncreaseRate) / 100;
      freePlaySpeedRef.current = Math.min(
        freePlaySpeedRef.current * bump,
        baseSpeed * preset.maxSpeedMultiplier
      );
      spawnIntervalRef.current = Math.max(
        preset.minSpawnIntervalMs,
        Math.round(spawnIntervalRef.current * preset.spawnAccelFactor)
      );
    }
  };

  // Submit current word (Enter pressed)
  const handleSubmitWord = () => {
    if (screen !== 'PLAYING') return;

    // If selection is empty
    if (selectedTiles.length === 0) {
      return;
    }

    const wordString = selectedTiles.map((t) => t.letter.value).join('');

    // Minimum length check
    if (wordString.length < 2) {
      bumpPaceOnWordEnter();
      soundManager.playWordInvalid();
      setIsShaking(true);
      setErrorMessage('Minimum 2 letters required');
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    // Standard dictionary validity check
    if (!isValidWord(wordString)) {
      bumpPaceOnWordEnter();
      soundManager.playWordInvalid();
      setIsShaking(true);
      setErrorMessage(`"${wordString}" is not in dictionary`);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    // VALID WORD!
    bumpPaceOnWordEnter();
    const pointsAwarded = getWordScore(wordString.length);
    const popupText = `+${pointsAwarded}`;

    // Record in wordHistory
    const newWordEntry: WordEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      word: wordString,
      score: pointsAwarded,
      length: wordString.length,
      timestamp: Date.now(),
    };
    setWordHistory((prev) => [...prev, newWordEntry]);

    const newScore = score + pointsAwarded;
    setScore(newScore);
    scoreRef.current = newScore;
    setTotalWordsCleared((prev) => prev + 1);

    if (wordString.length > longestWord.length) {
      setLongestWord(wordString);
    }

    soundManager.playWordSuccess(wordString.length);

    // Confetti on big words (5+ letters)
    if (wordString.length >= 5) {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.4 },
      });
    }

    // Floating score popup at live centroid (falling tiles may have moved since selection)
    const liveTileLookup = new Map<string, HexTile>();
    for (const t of frozenTilesRef.current) liveTileLookup.set(t.id, t);
    for (const t of fallingTilesRef.current) liveTileLookup.set(t.id, t);
    const liveSelected = selectedTiles.map((t) => liveTileLookup.get(t.id) || t);
    const avgX = liveSelected.reduce((sum, t) => sum + t.x, 0) / liveSelected.length;
    const avgY = liveSelected.reduce((sum, t) => sum + t.y, 0) / liveSelected.length;

    const newScorePopup: FloatingScore = {
      id: 'score_' + Date.now(),
      text: popupText,
      points: pointsAwarded,
      x: avgX,
      y: avgY,
    };
    setFloatingScores((prev) => [...prev, newScorePopup]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((s) => s.id !== newScorePopup.id));
    }, 850);

    // Track for Classroom Match if active
    let shouldCompleteWordsGoal = false;
    if (classroomMatchRef.current) {
      const cur = classroomMatchRef.current;
      const nextTurnScore = cur.turnScoreGained + pointsAwarded;
      const nextTurnWords = cur.turnWordsCount + 1;
      setActiveTurnWords((prev) => [...prev, newWordEntry]);
      activeTurnWordsRef.current = [...activeTurnWordsRef.current, newWordEntry];

      const updatedMatch: ClassroomMatchState = {
        ...cur,
        turnScoreGained: nextTurnScore,
        turnWordsCount: nextTurnWords,
      };
      setClassroomMatch(updatedMatch);
      classroomMatchRef.current = updatedMatch;

      if (cur.config.turnCondition === 'words' && nextTurnWords >= cur.config.turnWordsTarget) {
        shouldCompleteWordsGoal = true;
      }
    }

    // 1. Mark submitted tiles (landed or still falling) as clearing
    const selectedIds = new Set(selectedTiles.map((t) => t.id));
    frozenTilesRef.current = frozenTilesRef.current.map((t) =>
      selectedIds.has(t.id) ? { ...t, isClearing: true } : t
    );
    fallingTilesRef.current = fallingTilesRef.current.map((t) =>
      selectedIds.has(t.id) ? { ...t, isClearing: true } : t
    );
    setFrozenTiles([...frozenTilesRef.current]);
    setFallingTiles([...fallingTilesRef.current]);
    setSelectedTiles([]);
    setErrorMessage(null);

    // Coordinate collapse after the GSAP tile clear animation
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const collapseDelayMs = prefersReducedMotion ? 40 : 320;

    setTimeout(() => {
      const remainingFalling = fallingTilesRef.current.filter((t) => !selectedIds.has(t.id));
      fallingTilesRef.current = remainingFalling;
      setFallingTiles(remainingFalling);

      const remainingTiles = frozenTilesRef.current.filter((t) => !selectedIds.has(t.id));

      // Identify which tiles remain connected to ground
      const curTileRadius = freePlaySettingsRef.current.tileRadius;
      const groundedIds = findGroundedHexIds(remainingTiles, GROUND_Y, curTileRadius);

      const updated = remainingTiles.map((t) => {
        const isGrounded = groundedIds.has(t.id);
        return {
          ...t,
          isFrozen: isGrounded,
          isFalling: !isGrounded,
        };
      });

      frozenTilesRef.current = updated;
      setFrozenTiles(updated);

      // If classroom turn target met, transition after tile collapse
      if (shouldCompleteWordsGoal) {
        setTimeout(() => {
          handleCompleteTurn('words_met');
        }, 300);
      }
    }, collapseDelayMs);
  };

  // Keyboard Shortcuts (Desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'PLAYING') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitWord();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClearSelection();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (selectedTiles.length > 0) {
          handleRemoveTileFromWord(selectedTiles[selectedTiles.length - 1]);
        }
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setScreen('PAUSED');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, selectedTiles, score, longestWord]);

  // Main Physics & Falling Loop
  useEffect(() => {
    if (screen !== 'PLAYING') {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
        animFrameId.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      const curTileRadius = freePlaySettingsRef.current.tileRadius;
      const curTileH = (Math.sqrt(3) * curTileRadius) / 2;

      const curCeiling = freePlaySettingsRef.current.ceilingHeight;
      const effectiveGroundY = GROUND_Y;
      const baseFallSpeed =
        !classroomMatchRef.current &&
        (dynamicPaceEnabledRef.current || freePlaySettingsRef.current.speedIncreaseEnabled)
          ? freePlaySpeedRef.current
          : freePlaySettingsRef.current.dropSpeed;
      // Apply screen-size multiplier on top of base/difficulty speed in ALL modes
      const activeFallSpeed = baseFallSpeed * speedMultiplierRef.current;

      // 1. Update falling hexagons
      const currentFallingList = [...fallingTilesRef.current];
      if (currentFallingList.length > 0) {
        // Sort lowest Y first (descending y) so lower tiles land first
        currentFallingList.sort((a, b) => b.y - a.y);
        const liveFrozen = frozenTilesRef.current.filter((t) => t.isFrozen);
        const remainingFalling: HexTile[] = [];
        let anyLanded = false;

        for (const tile of currentFallingList) {
          if (tile.isClearing) {
            remainingFalling.push(tile);
            continue;
          }

          const liveLandingY = findLandingY(tile.x, tile.y, liveFrozen, effectiveGroundY, curTileRadius);
          const nextY = tile.y + activeFallSpeed * dt;

          if (nextY >= liveLandingY) {
            soundManager.playTileDrop();
            anyLanded = true;
            const frozenHex: HexTile = {
              ...tile,
              y: liveLandingY,
              isFalling: false,
              isFrozen: true,
            };

            liveFrozen.push(frozenHex);
            if (!frozenTilesRef.current.some((t) => t.id === frozenHex.id)) {
              frozenTilesRef.current = [...frozenTilesRef.current, frozenHex];
            }

            // Check if tile is frozen and completely above the ceiling line
            if (frozenHex.y + curTileH <= curCeiling) {
              setFrozenTiles([...frozenTilesRef.current]);
              fallingTilesRef.current = [];
              setFallingTiles([]);
              if (classroomMatchRef.current) {
                handleCompleteTurn('board_filled');
                return;
              }
              triggerGameOver();
              return;
            }
          } else {
            tile.y = nextY;
            remainingFalling.push(tile);
          }
        }

        fallingTilesRef.current = remainingFalling;
        setFallingTiles(remainingFalling);

        if (anyLanded) {
          setFrozenTiles([...frozenTilesRef.current]);
        }
      }

      // 2. Animate disconnected tiles falling
      const fallingGrounded = frozenTilesRef.current.filter((t) => t.isFalling && !t.isClearing);
      if (fallingGrounded.length > 0) {
        fallingGrounded.sort((a, b) => b.y - a.y);
        const liveFrozen = frozenTilesRef.current.filter((t) => t.isFrozen);

        for (const tile of fallingGrounded) {
          const liveLandingY = findLandingY(tile.x, tile.y, liveFrozen, effectiveGroundY, curTileRadius);
          const nextY = tile.y + activeFallSpeed * dt;

          if (nextY >= liveLandingY) {
            tile.y = liveLandingY;
            tile.isFalling = false;
            tile.isFrozen = true;
            liveFrozen.push(tile);
            soundManager.playTileDrop();

            if (tile.y + curTileH <= curCeiling) {
              setFrozenTiles([...frozenTilesRef.current]);
              if (classroomMatchRef.current) {
                handleCompleteTurn('board_filled');
                return;
              }
              triggerGameOver();
              return;
            }
          } else {
            tile.y = nextY;
          }
        }

        setFrozenTiles([...frozenTilesRef.current]);
      }

      // 3. Rain-like spawn cadence. No hard cap: the interval is derived so that,
      // on average, TARGET_ON_SCREEN tiles are falling at once (phone baseline,
      // scaled up for wider boards). Word-enter acceleration shortens it further.
      const preset = configFor(difficultyRef.current);
      const width = boardWidthRef.current;
      const widthScale = width > 1200 ? 5 / 3 : width > 850 ? 4 / 3 : 1;
      const targetOnScreen = (preset.phoneTargetOnScreen || 3) * widthScale;
      const fallTimeMs = ((effectiveGroundY - SPAWN_Y) / Math.max(1, activeFallSpeed)) * 1000;
      const accelRatio = (spawnIntervalRef.current || preset.spawnIntervalMs) / preset.spawnIntervalMs;
      const meanInterval = Math.max(150, (fallTimeMs / targetOnScreen) * accelRatio);
      const SAFETY_MAX = 12;
      const activeFallingCount = fallingTilesRef.current.filter((t) => !t.isClearing).length;
      if (spawnTimerRef.current === 0) {
        // First spawn of a round: one tile now, next after a jittered gap
        spawnTimerRef.current = currentTime;
      }
      if (activeFallingCount < SAFETY_MAX && currentTime >= spawnTimerRef.current) {
        const jitter = 0.6 + Math.random() * 0.8; // 0.6x to 1.4x
        spawnTimerRef.current = currentTime + meanInterval * jitter;
        spawnNextHexagon();
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
        animFrameId.current = null;
      }
    };
  }, [screen, spawnNextHexagon, triggerGameOver, handleCompleteTurn]);

  // Check if any frozen hexagon is near the ceiling line
  const nearCeiling = React.useMemo(() => {
    return frozenTiles.some(
      (t) => t.isFrozen && t.y - (Math.sqrt(3) * freePlaySettings.tileRadius) / 2 <= activeCeilingY + 45
    );
  }, [frozenTiles, activeCeilingY, freePlaySettings.tileRadius]);

  return (
    <main className="w-full h-[100dvh] max-h-[100dvh] flex flex-col items-center justify-between overflow-hidden select-none bg-slate-950 text-slate-100">
      {screen === 'MENU' && (
        <StartMenu
          onQuickPlay={handleQuickPlay}
          onOpenSoloSetup={() => setIsSoloSetupOpen(true)}
          onOpenTeamSetup={() => setIsTeamSetupOpen(true)}
          onOpenHighScores={() => {
            setLastSoloResult(null);
            setScreen('HIGHSCORES');
          }}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          screenMode={screenMode}
          difficulty={difficulty}
          onChangeDifficulty={handleChangeDifficulty}
          hasCustomSettings={customSettings !== null}
          onOpenSettings={() => setIsSettingsOpen(true)}
          quickPlayTimerOn={quickPlayTimerOn}
          onChangeQuickPlayTimer={handleChangeQuickPlayTimer}
        />
      )}

      {/* Solo Player Sign-In & Logo Picker Modal */}
      <SoloPlayerSetupModal
        isOpen={isSoloSetupOpen}
        onClose={() => setIsSoloSetupOpen(false)}
        onStartSolo={handleStartNamedSolo}
        difficulty={difficulty}
        onChangeDifficulty={handleChangeDifficulty}
        hasCustomSettings={customSettings !== null}
        isWide={viewMode === 'wide'}
      />

      {/* Settings (custom gameplay settings -> Custom difficulty) */}
      {isSettingsOpen && (
        <SettingsModal
          saved={customSettings}
          onSave={handleSaveCustomSettings}
          onReset={handleResetCustomSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Team Play Organize Teams Modal */}
      <PlayNowModal
        isOpen={isTeamSetupOpen}
        onClose={() => setIsTeamSetupOpen(false)}
        onLaunchSolo={() => {
          setIsTeamSetupOpen(false);
          handleQuickPlay();
        }}
        difficulty={difficulty}
        onChangeDifficulty={handleChangeDifficulty}
        hasCustomSettings={customSettings !== null}
        onLaunchTeamMatch={(config) => {
          setIsTeamSetupOpen(false);
          handleStartClassroomMatch(config);
        }}
        isWide={viewMode === 'wide'}
        initialStep="team_setup"
        initialMode="team"
      />

      {/* Classroom Turn Transition Modal */}
      {screen === 'CLASSROOM_TURN_TRANSITION' && classroomMatch && (
        <TurnTransitionModal
          matchState={classroomMatch}
          onStartTurn={handleStartClassroomTurn}
          onFinishMatchEarly={() => setScreen('CLASSROOM_VICTORY')}
          isWide={viewMode === 'wide'}
        />
      )}

      {/* Classroom Victory Screen */}
      {screen === 'CLASSROOM_VICTORY' && classroomMatch && (
        <ClassroomVictoryModal
          matchState={classroomMatch}
          onRematch={handleClassroomRematch}
          onNewMatchSetup={() => {
            setScreen('MENU');
            setIsTeamSetupOpen(true);
          }}
          onExitToMenu={handleExitClassroomToMenu}
          isWide={viewMode === 'wide'}
        />
      )}

      {/* Classroom Mid-game Scoreboard Modal */}
      {isClassroomScoreboardOpen && classroomMatch && (
        <ClassroomScoreboardModal
          matchState={classroomMatch}
          onClose={() => setIsClassroomScoreboardOpen(false)}
          onPassTurn={() => {
            setIsClassroomScoreboardOpen(false);
            handleCompleteTurn('passed');
          }}
          onFinishMatchEarly={() => {
            setIsClassroomScoreboardOpen(false);
            setScreen('CLASSROOM_VICTORY');
          }}
          isWide={viewMode === 'wide'}
        />
      )}

      {/* Active Play Viewport (About half-width on PC mode, fits screen on Phone mode) */}
      {(screen === 'PLAYING' || screen === 'PAUSED' || screen === 'GAMEOVER') && (
        <div
          className={`w-full h-full ${
            screenMode === 'pc'
              ? 'w-full md:w-[50vw] md:max-w-[50vw] md:min-w-[480px]'
              : 'w-full max-w-full'
          } mx-auto flex flex-col justify-between py-1 px-2 min-h-0 overflow-hidden`}
        >
          {/* Top HUD */}
          <GameHUD
            score={score}
            longestWord={longestWord}
            onPause={() => setScreen('PAUSED')}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            viewMode={viewMode}
            timeLeftSec={freePlayTimeLeft}
            freePlaySpeedPct={
              !classroomMatch &&
              (dynamicPaceEnabledRef.current || freePlaySettings.speedIncreaseEnabled)
                ? (freePlaySpeedRef.current / freePlaySettings.dropSpeed) * 100
                : undefined
            }
            onOpenWordHistory={() => setIsWordHistoryOpen(true)}
            classroomMatch={classroomMatch}
            onOpenScoreboard={() => setIsClassroomScoreboardOpen(true)}
            soloPlayer={currentSoloPlayer}
          />

          {/* Word Bar */}
          <WordBar
            selectedTiles={selectedTiles}
            onClear={handleClearSelection}
            onSubmit={handleSubmitWord}
            onRemoveTile={handleRemoveTileFromWord}
            isShaking={isShaking}
            errorMessage={errorMessage}
            isWide={viewMode === 'wide'}
            lastFoundWord={wordHistory[wordHistory.length - 1] ?? null}
          />

          {/* Continuous Physics Game Board */}
          <div
            ref={boardContainerRef}
            className="flex-1 w-full flex items-center justify-center min-h-0 min-w-0 overflow-hidden pb-1"
          >
            <GameBoard
              boardWidth={activeBoardWidth}
              boardHeight={undefined}
              groundY={undefined}
              frozenTiles={frozenTiles}
              fallingTile={fallingTile}
              fallingTiles={fallingTiles}
              selectedTiles={selectedTiles}
              floatingScores={floatingScores}
              pulsingTileIds={pulsingTileIds}
              onTileClick={handleTileClick}
              isPaused={screen === 'PAUSED'}
              nearCeiling={nearCeiling}
              ceilingY={activeCeilingY}
              wallLeft={activeWallBounds.left}
              wallRight={activeWallBounds.right}
              viewMode={viewMode}
              tileRadius={freePlaySettings.tileRadius}
            />
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {screen === 'PAUSED' && (
        <PauseModal
          onResume={() => setScreen('PLAYING')}
          onRestart={
            classroomMatch
              ? handleStartClassroomTurn
              : () => {
                  const preset = configFor(difficultyRef.current);
                  if (currentSoloPlayer) {
                    handleStartGame({
                      timeLimit: activeRoundSecondsRef.current, // 0 = no timer
                      dropSpeed: preset.dropSpeed,
                      spawnIntervalMs: preset.spawnIntervalMs,
                      dynamicPace: preset.paceEnabled,
                    });
                  } else {
                    handleQuickPlayAgain();
                  }
                }
          }
          onQuitToMenu={classroomMatch ? handleExitClassroomToMenu : () => setScreen('MENU')}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          viewMode={viewMode}
          freePlaySettings={freePlaySettings}
          onUpdateFreePlaySettings={handleUpdateFreePlaySettings}
          onResetFreePlaySettings={handleResetFreePlaySettings}
          wordEntries={wordHistory}
          classroomMatch={classroomMatch}
          onPassTurn={() => {
            setScreen('PLAYING');
            handleCompleteTurn('passed');
          }}
          onFinishMatchEarly={() => setScreen('CLASSROOM_VICTORY')}
        />
      )}

      {/* Game Over Modal (Quick Play) */}
      {screen === 'GAMEOVER' && (
        <GameOverModal
          finalScore={score}
          longestWord={longestWord}
          totalWords={totalWordsCleared}
          rank={gameOverStats.rank}
          isNewHighScore={gameOverStats.isNewHighScore}
          onNewGame={handleQuickPlayAgain}
          onBackToMenu={() => setScreen('MENU')}
          reason={gameOverReason}
        />
      )}

      {/* High Scores / Classroom Leaderboard Modal */}
      {screen === 'HIGHSCORES' && (
        <HighScoresModal
          onBack={() => {
            setLastSoloResult(null);
            setScreen('MENU');
          }}
          onPlayAgain={handleQuickPlay}
          onStartNextStudent={() => {
            setLastSoloResult(null);
            setScreen('MENU');
            setIsSoloSetupOpen(true);
          }}
          lastResult={lastSoloResult}
        />
      )}

      {/* Word History Modal */}
      {isWordHistoryOpen && (
        <WordHistoryModal
          wordEntries={wordHistory}
          onClose={() => setIsWordHistoryOpen(false)}
        />
      )}

    </main>
  );
}
