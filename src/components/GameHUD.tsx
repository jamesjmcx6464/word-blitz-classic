import React, { useMemo } from 'react';
import {
  Pause,
  Volume2,
  VolumeX,
  BookOpen,
  Clock,
  Target,
  Rocket,
  Star,
  Users,
} from 'lucide-react';
import { ViewMode, WordEntry, ClassroomMatchState } from '../types/game';
import { getSpellingProgress } from '../utils/spellingProgress';
import gsap from 'gsap';

interface GameHUDProps {
  score: number;
  longestWord: string;
  onPause: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  viewMode: ViewMode;
  timeLeftSec?: number | null;
  freePlaySpeedPct?: number;
  wordCount?: number;
  onOpenWordHistory?: () => void;
  isSpellingMode?: boolean;
  spellingWordsCount?: number;
  wordEntries?: WordEntry[];
  spellingWords?: string[];
  // Classroom Team mode props
  classroomMatch?: ClassroomMatchState | null;
  onOpenScoreboard?: () => void;
  // Solo Student Player
  soloPlayer?: { name: string; logo: string } | null;
}

interface RollingScoreProps {
  value: number;
  prefix?: string;
  className?: string;
}

const RollingScore: React.FC<RollingScoreProps> = ({ value, prefix = '', className = '' }) => {
  const displayRef = React.useRef<HTMLSpanElement>(null);
  const currentValRef = React.useRef<number>(value);

  React.useEffect(() => {
    const el = displayRef.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      el.textContent = `${prefix}${value.toLocaleString()}`;
      currentValRef.current = value;
      return;
    }

    const obj = { val: currentValRef.current };
    const tween = gsap.to(obj, {
      val: value,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto',
      onUpdate: () => {
        if (el) {
          el.textContent = `${prefix}${Math.round(obj.val).toLocaleString()}`;
        }
      },
      onComplete: () => {
        currentValRef.current = value;
        if (el) {
          el.textContent = `${prefix}${value.toLocaleString()}`;
        }
      },
    });

    return () => {
      tween.kill();
    };
  }, [value, prefix]);

  return (
    <span ref={displayRef} className={`tabular-nums font-mono ${className}`}>
      {prefix}{value.toLocaleString()}
    </span>
  );
};

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  longestWord,
  onPause,
  soundEnabled,
  onToggleSound,
  viewMode,
  timeLeftSec,
  freePlaySpeedPct,
  wordCount = 0,
  onOpenWordHistory,
  isSpellingMode = false,
  spellingWordsCount = 0,
  wordEntries = [],
  spellingWords = [],
  classroomMatch,
  onOpenScoreboard,
  soloPlayer,
}) => {
  const isWide = viewMode === 'wide';

  // Compute live spelling progress
  const progress = useMemo(() => {
    if (spellingWords && spellingWords.length > 0) {
      return getSpellingProgress(wordEntries, spellingWords);
    }
    return {
      foundCount: wordCount,
      totalCount: spellingWordsCount || 0,
      allFound: (spellingWordsCount || 0) > 0 && wordCount >= (spellingWordsCount || 0),
    };
  }, [wordEntries, spellingWords, wordCount, spellingWordsCount]);

  // If in Classroom Team Mode:
  if (classroomMatch) {
    const currentTeam = classroomMatch.config.teams[classroomMatch.currentTeamIndex];
    const isTimer = classroomMatch.config.turnCondition === 'timer';

    return (
      <header className="w-full h-14 sm:h-16 px-2 sm:px-3 flex items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950 select-none shrink-0 text-white">
        {/* Left: Active Team Pill & Score */}
        <div className="flex items-center gap-2 sm:gap-3 text-left min-w-0">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 shadow-sm shrink-0"
            style={{
              backgroundColor: `${currentTeam.color}25`,
              borderColor: currentTeam.color,
            }}
          >
            <span className="text-xl sm:text-2xl drop-shadow">{currentTeam.emoji}</span>
            <div className="min-w-0">
              <span className="font-display font-black text-sm sm:text-base text-white block leading-tight truncate max-w-[120px] sm:max-w-[180px]">
                {currentTeam.name}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-300 block leading-none">
                Round {classroomMatch.currentRound}/{classroomMatch.config.totalRounds}
              </span>
            </div>
          </div>

          {/* Points */}
          <div className="pl-1 sm:pl-2">
            <span className="text-[10px] sm:text-xs font-bold text-amber-400 block leading-tight">
              Team Total
            </span>
            <div className="text-lg sm:text-xl font-display font-black text-amber-300 font-mono leading-none">
              <RollingScore value={score} />
            </div>
          </div>
        </div>

        {/* Center: Turn Timer or Word Target Goal */}
        <div className="flex items-center gap-2 shrink-0">
          {isTimer ? (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border-2 font-mono font-black text-base sm:text-lg ${
                classroomMatch.turnTimeLeft <= 10
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 motion-safe:animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-slate-100'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {Math.floor(classroomMatch.turnTimeLeft / 60)}:
                {(classroomMatch.turnTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400 text-indigo-300 font-bold text-xs sm:text-sm">
              <Target className="w-4 h-4 text-indigo-300 shrink-0" />
              <span>
                {classroomMatch.turnWordsCount} of {classroomMatch.config.turnWordsTarget} words
              </span>
            </div>
          )}

          {/* Gained this turn indicator */}
          {classroomMatch.turnScoreGained > 0 && (
            <span className="hidden min-[520px]:inline px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-bold text-xs">
              +{classroomMatch.turnScoreGained} turn
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Scoreboard button */}
          {onOpenScoreboard && (
            <button
              type="button"
              onClick={onOpenScoreboard}
              className="min-h-[44px] px-3 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span className="hidden min-[440px]:inline">Scores</span>
            </button>
          )}

          {/* My Words Button */}
          {onOpenWordHistory && (
            <button
              type="button"
              onClick={onOpenWordHistory}
              className="min-h-[44px] px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Words</span>
            </button>
          )}

          {/* Audio Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Pause Button */}
          <button
            type="button"
            onClick={onPause}
            aria-label="Pause game"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </header>
    );
  }

  // Solo / Free Play Mode HUD
  return (
    <header className="w-full h-14 sm:h-16 px-2 sm:px-3 flex items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950 select-none shrink-0 text-white">
      {/* Zone 1 & 2: Score & Game Stats */}
      <div className="flex items-center gap-3 sm:gap-4 text-left min-w-0">
        {/* Solo Player Badge (if set) */}
        {soloPlayer && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400/50 shrink-0">
            <span className="text-xl sm:text-2xl drop-shadow">{soloPlayer.logo}</span>
            <div className="min-w-0">
              <span className="font-display font-black text-xs sm:text-sm text-white block leading-tight truncate max-w-[90px] sm:max-w-[130px]">
                {soloPlayer.name}
              </span>
              <span className="text-[10px] font-bold text-indigo-300 block leading-none">
                Solo
              </span>
            </div>
          </div>
        )}

        {/* Points */}
        <div>
          <div className="text-sm font-bold text-amber-400 flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Points</span>
          </div>
          <div className="text-xl sm:text-2xl font-display font-black text-amber-300 font-mono leading-none">
            <RollingScore value={score} />
          </div>
        </div>

        {/* Optional Timer */}
        {timeLeftSec !== undefined && timeLeftSec !== null && (
          <div className="pl-3 border-l border-slate-800">
            <div className="text-sm font-bold text-amber-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{timeLeftSec <= 15 ? 'Almost done!' : 'Time'}</span>
            </div>
            <div
              className={`text-lg sm:text-xl font-mono font-black ${
                timeLeftSec <= 15
                  ? 'text-amber-300 motion-safe:animate-pulse'
                  : 'text-slate-100'
              }`}
            >
              {Math.floor(timeLeftSec / 60)}:{(timeLeftSec % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Spelling Mode Progress */}
        {isSpellingMode && (
          <div className="pl-3 border-l border-slate-800 min-w-[110px]">
            <div className="text-sm font-bold text-teal-400 flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>
                {progress.foundCount} of {progress.totalCount} words
              </span>
            </div>
            {/* Thin progress bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-teal-400 transition-all duration-300"
                style={{
                  width: `${
                    progress.totalCount > 0
                      ? Math.min(100, (progress.foundCount / progress.totalCount) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Speeding up indicator */}
        {freePlaySpeedPct !== undefined && freePlaySpeedPct > 100 && (
          <div className="pl-3 border-l border-slate-800 hidden min-[540px]:flex items-center gap-1.5 text-purple-300 font-bold text-sm">
            <Rocket className="w-4 h-4 text-purple-400" />
            <span>Speeding up</span>
          </div>
        )}

        {/* Longest word (wide screens only) */}
        {isWide && longestWord && (
          <div className="pl-3 border-l border-slate-800 hidden md:block">
            <span className="text-sm text-slate-400 font-medium block">Longest word</span>
            <span className="text-base font-bold font-mono text-slate-200 uppercase">
              {longestWord}
            </span>
          </div>
        )}
      </div>

      {/* Zone 3: Buttons (min 48x48) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* My Words Button (shown on every screen size) */}
        {onOpenWordHistory && (
          <button
            type="button"
            onClick={onOpenWordHistory}
            className="min-h-[48px] px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 font-bold text-sm flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 active:scale-95 shadow-sm"
          >
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>My Words</span>
          </button>
        )}

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          className="min-h-[48px] min-w-[48px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 active:scale-95 shadow-sm"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-amber-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {/* Pause Button */}
        <button
          type="button"
          onClick={onPause}
          aria-label="Pause game"
          className="min-h-[48px] min-w-[48px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 active:scale-95 shadow-sm"
        >
          <Pause className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
