import React from 'react';
import { ArrowLeft, Lock, Play, Star, Zap } from 'lucide-react';
import {
  AdventureLevelDef,
  AdventureLevelId,
  SPARK_LEVELS,
} from '../../utils/adventureConfig';
import {
  AdventureCharacterProgress,
  getBonusBest,
  getSparkScore,
  isBonusUnlocked,
  isBossUnlocked,
  isLevelPassed,
} from '../../utils/adventureProgress';
import { bonusSecondsFor } from '../../utils/adventureConfig';

interface AdventureMapProps {
  playerName: string;
  playerLogo: string;
  progress: AdventureCharacterProgress;
  onBack: () => void;
  onSelectLevel: (level: AdventureLevelDef) => void;
  onPlayBonus?: (level: AdventureLevelDef) => void;
}

const VOWELS = SPARK_LEVELS.filter((l) => l.kind === 'vowel');
const BOSS = SPARK_LEVELS.find((l) => l.kind === 'boss')!;

export const AdventureMap: React.FC<AdventureMapProps> = ({
  playerName,
  playerLogo,
  progress,
  onBack,
  onSelectLevel,
  onPlayBonus,
}) => {
  const bossOpen = isBossUnlocked(progress);
  const sparkScore = getSparkScore(progress);

  /** Bonus Blitz chip under a level tile: locked until the level is beaten, then shows its best. */
  const renderBonus = (level: AdventureLevelDef) => {
    const unlocked = isBonusUnlocked(progress, level.id);
    const best = getBonusBest(progress, level.id);
    if (!unlocked) {
      return (
        <span
          data-testid={`bonus-${level.id}`}
          data-locked="true"
          aria-label={`${level.title} Blitz locked`}
          className="absolute left-1/2 -translate-x-1/2 -bottom-5 z-20 h-8 px-2.5 rounded-full bg-slate-900 border border-slate-700 text-slate-500 text-[11px] font-black flex items-center gap-1 whitespace-nowrap pointer-events-none"
        >
          <Lock className="w-3 h-3" />
          Blitz
        </span>
      );
    }
    return (
      <button
        type="button"
        data-testid={`bonus-${level.id}`}
        data-locked="false"
        onClick={() => onPlayBonus?.(level)}
        aria-label={`Play ${level.title} Blitz (${bonusSecondsFor(level)} seconds)`}
        className="absolute left-1/2 -translate-x-1/2 -bottom-5 z-20 h-8 px-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-[11px] font-black flex items-center gap-1 whitespace-nowrap shadow-md shadow-amber-500/30 cursor-pointer active:scale-95"
      >
        <Play className="w-3 h-3 fill-current" />
        {best === null ? 'Play Blitz' : <span className="tabular-nums">Blitz · {best.toLocaleString()}</span>}
      </button>
    );
  };

  const renderTile = (level: AdventureLevelDef, className: string) => {
    const passed = isLevelPassed(progress, level.id as AdventureLevelId);
    const locked = level.kind === 'boss' && !bossOpen;
    return (
      <div key={level.id} className="relative">
      <button
        type="button"
        disabled={locked}
        onClick={() => !locked && onSelectLevel(level)}
        className={`relative flex flex-col items-center justify-center gap-1 rounded-3xl border-2 px-3 pt-3 pb-4 min-h-[96px] min-w-[96px] sm:min-h-[110px] sm:min-w-[110px] transition-all ${className} ${
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
      {renderBonus(level)}
      </div>
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
        </div>
        <div className="flex items-center gap-2 min-h-[44px] px-3 rounded-2xl bg-slate-900 border border-slate-700">
          <span className="text-xl">{playerLogo}</span>
          <span className="font-bold text-sm text-slate-200 max-w-[72px] truncate">
            {playerName}
          </span>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 py-4">
        <div
          data-testid="spark-score"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-amber-400/40 shrink-0"
        >
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-[11px] font-display font-black uppercase tracking-widest text-amber-400">
            Spark Score
          </span>
          <span className="font-display font-black text-xl text-amber-300 tabular-nums">
            {sparkScore.toLocaleString()}
          </span>
        </div>
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

          <div className="absolute left-1/2 top-0 -translate-x-1/2">
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
