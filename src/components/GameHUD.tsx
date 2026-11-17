import React from 'react';
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
import { ViewMode, ClassroomMatchState } from '../types/game';
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
  onOpenWordHistory?: () => void;
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
  onOpenWordHistory,
  classroomMatch,
  onOpenScoreboard,
}) => {
  const isWide = viewMode === 'wide';

  // If in Classroom Team Mode:
  if (classroomMatch) {
    const isTimer = classroomMatch.config.turnCondition === 'timer';

    return (
      <header className="@container/hud w-full h-14 sm:h-16 px-2 sm:px-3 flex items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950 select-none shrink-0 text-white">
        {/* Left: Score (team name lives in the arena ground strip) */}
        <div className="flex items-center gap-2 sm:gap-3 text-left min-w-0">
          <div className="shrink-0">
            <span className="text-[10px] sm:text-xs font-bold text-amber-400 block leading-tight">
              Points
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
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-2xl border-2 font-mono font-black text-sm sm:text-base ${
                classroomMatch.turnTimeLeft <= 10
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 motion-safe:animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {Math.floor(classroomMatch.turnTimeLeft / 60)}:
                {(classroomMatch.turnTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400 text-indigo-300 font-bold text-xs sm:text-sm">
              <Target className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
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
        <div className="flex items-center gap-1 @[400px]/hud:gap-1.5 shrink-0">
          {onOpenScoreboard && (
            <button
              type="button"
              onClick={onOpenScoreboard}
              aria-label="Scores"
              className="min-h-[40px] min-w-[40px] @[400px]/hud:min-h-[44px] @[400px]/hud:min-w-[44px] @[600px]/hud:px-3 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span className="hidden @[600px]/hud:inline">Scores</span>
            </button>
          )}

          {onOpenWordHistory && (
            <button
              type="button"
              onClick={onOpenWordHistory}
              aria-label="My Words"
              className="min-h-[40px] min-w-[40px] @[400px]/hud:min-h-[44px] @[400px]/hud:min-w-[44px] @[600px]/hud:px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="hidden @[600px]/hud:inline">Words</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="min-h-[40px] min-w-[40px] @[400px]/hud:min-h-[44px] @[400px]/hud:min-w-[44px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
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
            className="min-h-[40px] min-w-[40px] @[400px]/hud:min-h-[44px] @[400px]/hud:min-w-[44px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </header>
    );
  }

  // Solo / Free Play Mode HUD
  return (
    <header className="@container/hud w-full h-14 sm:h-16 px-1.5 @[400px]/hud:px-2 sm:px-3 flex items-center justify-between gap-1 @[400px]/hud:gap-1.5 sm:gap-2 border-b border-slate-800/80 bg-slate-950 select-none shrink-0 text-white">
      {/* Score & game stats — Longest word hides on tighter widths. Never clip the gauge. */}
      <div className="flex items-center gap-1 @[400px]/hud:gap-1.5 sm:gap-2 text-left min-w-0">
        {/* Points */}
        <div className="shrink-0">
          <div className="text-[10px] @[400px]/hud:text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-0.5 @[400px]/hud:gap-1">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
            <span className="hidden @[400px]/hud:inline">Points</span>
          </div>
          <div className="text-base @[400px]/hud:text-lg sm:text-xl font-display font-black text-amber-300 font-mono leading-none">
            <RollingScore value={score} />
          </div>
        </div>

        {/* Optional Timer — drop the "Time" label on narrow phones to keep the gauge visible */}
        {timeLeftSec !== undefined && timeLeftSec !== null && (
          <div className="pl-1.5 @[400px]/hud:pl-2 sm:pl-3 border-l border-slate-800 shrink-0">
            <div className="text-[10px] @[400px]/hud:text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-0.5 @[400px]/hud:gap-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden @[400px]/hud:inline">{timeLeftSec <= 15 ? 'Almost done!' : 'Time'}</span>
            </div>
            <div
              className={`text-sm @[400px]/hud:text-base sm:text-lg font-mono font-black ${
                timeLeftSec <= 15
                  ? 'text-amber-300 motion-safe:animate-pulse'
                  : 'text-slate-100'
              }`}
            >
              {Math.floor(timeLeftSec / 60)}:{(timeLeftSec % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Speeding up indicator */}
        {freePlaySpeedPct !== undefined && freePlaySpeedPct >= 108 && (
          <div className="pl-2 sm:pl-3 border-l border-slate-800 hidden @[540px]/hud:flex items-center gap-1.5 text-purple-300 font-bold text-xs sm:text-sm shrink-0">
            <Rocket className="w-4 h-4 text-purple-400" />
            <span>Speeding up</span>
          </div>
        )}


        {/* Longest word — hides on tighter HUD widths */}
        {isWide && longestWord && (
          <div className="pl-2 sm:pl-3 border-l border-slate-800 hidden @[560px]/hud:block min-w-0">
            <span className="text-xs sm:text-sm text-slate-400 font-medium block">Longest word</span>
            <span className="text-sm sm:text-base font-bold font-mono text-slate-200 uppercase truncate block max-w-[9rem]">
              {longestWord}
            </span>
          </div>
        )}
      </div>

      {/* Buttons: keep all three; shrink the Words label before dropping it */}
      <div className="flex items-center gap-1 @[400px]/hud:gap-1.5 sm:gap-2 shrink-0">
        {onOpenWordHistory && (
          <button
            type="button"
            onClick={onOpenWordHistory}
            aria-label="My Words"
            className="min-h-[40px] min-w-[40px] @[400px]/hud:min-h-[44px] @[400px]/hud:min-w-[44px] @[600px]/hud:min-h-[48px] px-1.5 @[400px]/hud:px-2 @[600px]/hud:px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 active:scale-95 shadow-sm"
          >
            <BookOpen className="w-4 h-4 @[400px]/hud:w-5 @[400px]/hud:h-5 text-amber-400 shrink-0" />
            <span className="hidden @[600px]/hud:inline">Words</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          className="min-h-[40px] min-w-[40px] @[400px]/hud:min-h-[44px] @[400px]/hud:min-w-[44px] @[520px]/hud:min-h-[48px] @[520px]/hud:min-w-[48px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 active:scale-95 shadow-sm"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 @[400px]/hud:w-5 @[400px]/hud:h-5 text-amber-400" />
          ) : (
            <VolumeX className="w-4 h-4 @[400px]/hud:w-5 @[400px]/hud:h-5 text-slate-500" />
          )}
        </button>

        <button
          type="button"
          onClick={onPause}
          aria-label="Pause game"
          className="min-h-[40px] min-w-[40px] @[400px]/hud:min-h-[44px] @[400px]/hud:min-w-[44px] @[520px]/hud:min-h-[48px] @[520px]/hud:min-w-[48px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 active:scale-95 shadow-sm"
        >
          <Pause className="w-4 h-4 @[400px]/hud:w-5 @[400px]/hud:h-5" />
        </button>
      </div>
    </header>
  );
};
