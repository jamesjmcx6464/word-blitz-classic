import React from 'react';
import { Lock, Play, Star, Zap } from 'lucide-react';
import {
  AdventureBandId,
  AdventureLevelDef,
  getBandDef,
} from '../../utils/adventureConfig';
import {
  AdventureCharacterProgress,
  getBandScore,
  getBonusBest,
  getTotalAdventureScore,
  isBandBossPassed,
  isBonusUnlocked,
  isBossUnlocked,
  isLevelPassed,
} from '../../utils/adventureProgress';
import { AdventureStickerBadge } from './AdventureStickerBadge';
import { AdventureHeader } from './AdventureHeader';
import { bonusSecondsFor } from '../../utils/adventureConfig';

interface AdventureMapProps {
  playerName: string;
  playerLogo: string;
  progress: AdventureCharacterProgress;
  band: AdventureBandId;
  onBack: () => void;
  onSelectLevel: (level: AdventureLevelDef) => void;
  onPlayBonus?: (level: AdventureLevelDef) => void;
}

/** Tile spots around the Boss: [line end x, line end y, wrapper classes]. */
const SPOTS: Record<number, [number, number, string][]> = {
  5: [
    [50, 18, 'left-1/2 top-0 -translate-x-1/2'],
    [82, 38, 'right-[2%] top-[28%]'],
    [72, 78, 'right-[12%] bottom-[8%]'],
    [28, 78, 'left-[12%] bottom-[8%]'],
    [18, 38, 'left-[2%] top-[28%]'],
  ],
  4: [
    [30, 30, 'left-[3%] top-[3%]'],
    [70, 30, 'right-[3%] top-[3%]'],
    [70, 72, 'right-[3%] bottom-[8%]'],
    [30, 72, 'left-[3%] bottom-[8%]'],
  ],
};

export const AdventureMap: React.FC<AdventureMapProps> = ({
  playerName,
  playerLogo,
  progress,
  band,
  onBack,
  onSelectLevel,
  onPlayBonus,
}) => {
  const bandDef = getBandDef(band);
  const LESSONS = bandDef.levels.filter((l) => l.kind !== 'boss');
  const BOSS = bandDef.levels.find((l) => l.kind === 'boss')!;
  const spots = SPOTS[LESSONS.length] ?? SPOTS[5];
  const bossOpen = isBossUnlocked(progress, band);
  const bandScore = getBandScore(progress, band);

  /** Bonus Blitz chip under a level tile: locked until the level is beaten, then shows its best. */
  const renderBonus = (level: AdventureLevelDef) => {
    const unlocked = isBonusUnlocked(progress, level);
    const best = getBonusBest(progress, level);
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
    const passed = isLevelPassed(progress, level);
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
      <AdventureHeader
        playerName={playerName}
        playerLogo={playerLogo}
        totalScore={getTotalAdventureScore(progress)}
        onBack={onBack}
        backLabel="Back to Adventure Home"
        title={<span data-testid={`map-title-${band}`}>{bandDef.stickerEmoji} {bandDef.title}</span>}
      />

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 py-4">
        <div
          data-testid={`${band}-score`}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-amber-400/40 shrink-0"
        >
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-[11px] font-display font-black uppercase tracking-widest text-amber-400">
            {bandDef.title} Score
          </span>
          <span className="font-display font-black text-xl text-amber-300 tabular-nums">
            {bandScore.toLocaleString()}
          </span>
        </div>
        {/* Map layout: up to 5 lessons ring the Boss; more use a grid */}
        {LESSONS.length <= 5 ? (
        <div className="relative w-full max-w-md aspect-square max-h-[min(68vh,420px)]">
          {/* connector lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            aria-hidden
          >
            {spots.map(([x, y], i) => (
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

          {LESSONS.map((lvl, i) => (
            <div key={lvl.id} className={`absolute ${spots[i]?.[2] ?? ''}`}>
              {renderTile(lvl, '')}
            </div>
          ))}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            {renderTile(
              BOSS,
              bossOpen
                ? 'ring-2 ring-fuchsia-400/60 shadow-fuchsia-500/30'
                : ''
            )}
          </div>
        </div>
        ) : (() => {
          // 6+ lessons: compact 3-wide grid with the Boss in the middle row.
          const bossTile = renderTile(BOSS, bossOpen ? 'ring-2 ring-fuchsia-400/60 shadow-fuchsia-500/30' : '');
          const rows = [LESSONS.slice(0, 3), [LESSONS[3], 'boss' as const, LESSONS[4]], LESSONS.slice(5)];
          return (
            <div data-testid="map-grid" className="w-full max-w-md flex flex-col items-center gap-6 sm:gap-8">
              {rows.map((row, ri) => (
                <div key={ri} className="flex justify-center gap-3 w-full">
                  {row.map((cell) =>
                    cell === 'boss' ? (
                      <div key="boss" className="w-[31%] max-w-[120px] [&>div>button]:w-full">{bossTile}</div>
                    ) : cell ? (
                      <div key={cell.id} className="w-[31%] max-w-[120px] [&>div>button]:w-full">{renderTile(cell, '')}</div>
                    ) : null
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {isBandBossPassed(progress, band) && (
          <div
            data-testid={`${band}-complete`}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-200 font-bold text-sm"
          >
            <AdventureStickerBadge band={bandDef} />
            {bandDef.title} complete — you beat the Boss!
          </div>
        )}
      </div>
    </div>
  );
};
