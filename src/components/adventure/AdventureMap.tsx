import React from 'react';
import { ArrowLeft, Lock, Star, Zap } from 'lucide-react';
import {
  AdventureLevelDef,
  AdventureLevelId,
  SPARK_LEVELS,
} from '../../utils/adventureConfig';
import {
  AdventureCharacterProgress,
  isBossUnlocked,
  isLevelPassed,
} from '../../utils/adventureProgress';

interface AdventureMapProps {
  playerName: string;
  playerLogo: string;
  progress: AdventureCharacterProgress;
  onBack: () => void;
  onSelectLevel: (level: AdventureLevelDef) => void;
}

const VOWELS = SPARK_LEVELS.filter((l) => l.kind === 'vowel');
const BOSS = SPARK_LEVELS.find((l) => l.kind === 'boss')!;

export const AdventureMap: React.FC<AdventureMapProps> = ({
  playerName,
  playerLogo,
  progress,
  onBack,
  onSelectLevel,
}) => {
  const bossOpen = isBossUnlocked(progress);

  const renderTile = (level: AdventureLevelDef, className: string) => {
    const passed = isLevelPassed(progress, level.id as AdventureLevelId);
    const locked = level.kind === 'boss' && !bossOpen;
    return (
      <button
        key={level.id}
        type="button"
        disabled={locked}
        onClick={() => !locked && onSelectLevel(level)}
        className={`relative flex flex-col items-center justify-center gap-1 rounded-3xl border-2 p-3 min-h-[96px] min-w-[96px] sm:min-h-[110px] sm:min-w-[110px] transition-all ${className} ${
          locked
            ? 'bg-slate-900/80 border-slate-700 text-slate-500 cursor-not-allowed opacity-70'
            : passed
              ? 'bg-emerald-500/15 border-emerald-400/70 text-white shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95 hover:bg-emerald-500/25'
              : 'bg-slate-900/90 border-amber-400/50 text-white shadow-md shadow-amber-500/10 cursor-pointer active:scale-95 hover:border-amber-300'
        }`}
      >
        <span className="text-3xl sm:text-4xl leading-none">{level.emoji}</span>
        <span className="font-display font-black text-sm sm:text-base leading-tight">
          {level.title}
        </span>
        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 leading-tight text-center">
          {level.subtitle}
        </span>
        {locked && (
          <span className="absolute top-2 right-2">
            <Lock className="w-4 h-4 text-slate-500" />
          </span>
        )}
        {passed && (
          <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
            <Star className="w-4 h-4 fill-current" />
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col text-slate-100 select-none px-3 sm:px-5 py-3 safe-area-pad">
      <header className="flex items-center justify-between gap-3 shrink-0 pb-3 border-b border-slate-800/80">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] px-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 flex items-center justify-center gap-2 font-bold text-sm cursor-pointer active:scale-95"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Home</span>
        </button>
        <div className="text-center min-w-0">
          <div className="font-display font-black text-lg sm:text-xl text-white leading-tight">
            Spark Adventure
          </div>
          <div className="text-xs font-semibold text-amber-400 truncate">
            Kindergarten · Short vowels
          </div>
        </div>
        <div className="flex items-center gap-2 min-h-[44px] px-3 rounded-2xl bg-slate-900 border border-slate-700">
          <span className="text-xl">{playerLogo}</span>
          <span className="font-bold text-sm text-slate-200 max-w-[72px] truncate">
            {playerName}
          </span>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 py-4">
        <p className="text-xs sm:text-sm text-slate-400 font-medium text-center max-w-md">
          Clear all five vowel levels, then take on the Boss. Tap a tile to play.
        </p>

        {/* Map layout: 5 vowels around boss */}
        <div className="relative w-full max-w-md aspect-square max-h-[min(68vh,420px)]">
          {/* connector lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            aria-hidden
          >
            {[
              [50, 18],
              [82, 38],
              [72, 78],
              [28, 78],
              [18, 38],
            ].map(([x, y], i) => (
              <line
                key={i}
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                stroke={bossOpen ? '#34d399' : '#334155'}
                strokeWidth="1.5"
                strokeDasharray={bossOpen ? undefined : '3 3'}
              />
            ))}
          </svg>

          <div className="absolute left-1/2 top-[6%] -translate-x-1/2">
            {renderTile(VOWELS[0], '')}
          </div>
          <div className="absolute right-[2%] top-[28%]">
            {renderTile(VOWELS[1], '')}
          </div>
          <div className="absolute right-[12%] bottom-[8%]">
            {renderTile(VOWELS[2], '')}
          </div>
          <div className="absolute left-[12%] bottom-[8%]">
            {renderTile(VOWELS[3], '')}
          </div>
          <div className="absolute left-[2%] top-[28%]">
            {renderTile(VOWELS[4], '')}
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            {renderTile(
              BOSS,
              bossOpen
                ? 'ring-2 ring-fuchsia-400/60 shadow-fuchsia-500/30'
                : ''
            )}
          </div>
        </div>

        {progress.bossPassed && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-200 font-bold text-sm">
            <Zap className="w-4 h-4" />
            Spark complete — you beat the Boss!
          </div>
        )}
      </div>
    </div>
  );
};
