import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Delete,
  Play,
  RotateCcw,
  Star,
  Volume2,
} from 'lucide-react';
import { AdventureLexiconEntry } from '../../data/adventureLexicon';
import {
  ADVENTURE_BOSS_MAX_MISSES,
  ADVENTURE_PASS_THRESHOLD,
  ADVENTURE_ROUNDS_PER_LEVEL,
  AdventureLevelDef,
} from '../../utils/adventureConfig';
import { playWordAudio, stopWordAudio } from '../../utils/adventureAudio';
import {
  buildLetterTray,
  buildLevelRounds,
} from '../../utils/adventureWordSelect';

interface Tile {
  id: string;
  letter: string;
  used: boolean;
}

interface AdventurePlayProps {
  level: AdventureLevelDef;
  playerName: string;
  playerLogo: string;
  onExitToMap: () => void;
  onLevelFinished: (passed: boolean) => void;
}

type Phase = 'playing' | 'result';

export const AdventurePlay: React.FC<AdventurePlayProps> = ({
  level,
  playerName,
  playerLogo,
  onExitToMap,
  onLevelFinished,
}) => {
  const seed = useMemo(
    () => Date.now() ^ (level.id.charCodeAt(0) * 997),
    [level.id]
  );

  const [rounds] = useState(() => buildLevelRounds(level.soundGroup, seed));
  const [roundIndex, setRoundIndex] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set());
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('playing');
  const [passed, setPassed] = useState(false);
  const [entering, setEntering] = useState(false);
  const [dropIn, setDropIn] = useState(false);

  const cards = rounds[roundIndex] ?? [];
  const isBoss = level.kind === 'boss';
  const spelled = selectedIds
    .map((id) => tiles.find((t) => t.id === id)?.letter ?? '')
    .join('');

  const setupRound = useCallback(
    (idx: number, roundSeed: number) => {
      const round = rounds[idx] ?? [];
      const letters = buildLetterTray(round, roundSeed);
      setTiles(
        letters.map((letter, i) => ({
          id: `t${idx}-${i}-${letter}`,
          letter,
          used: false,
        }))
      );
      setSelectedIds([]);
      setDoneIds(new Set());
      setFeedback(null);
      setDropIn(false);
      requestAnimationFrame(() => setDropIn(true));
    },
    [rounds]
  );

  useEffect(() => {
    setupRound(0, seed);
    return () => stopWordAudio();
  }, [setupRound, seed]);

  const remainingCards = cards.filter((c) => !doneIds.has(c.id));

  const handleCardTap = (entry: AdventureLexiconEntry) => {
    if (doneIds.has(entry.id) || phase !== 'playing') return;
    playWordAudio(entry.word);
  };

  const handleTileTap = (tile: Tile) => {
    if (phase !== 'playing' || tile.used || entering) return;
    setTiles((prev) =>
      prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t))
    );
    setSelectedIds((prev) => [...prev, tile.id]);
    setFeedback(null);
  };

  const handleBackspace = () => {
    if (phase !== 'playing' || selectedIds.length === 0) return;
    const last = selectedIds[selectedIds.length - 1];
    setSelectedIds((prev) => prev.slice(0, -1));
    setTiles((prev) =>
      prev.map((t) => (t.id === last ? { ...t, used: false } : t))
    );
  };

  const handleClear = () => {
    if (phase !== 'playing') return;
    setSelectedIds([]);
    setTiles((prev) => prev.map((t) => ({ ...t, used: false })));
    setFeedback(null);
  };

  const finishLevel = (didPass: boolean) => {
    setPassed(didPass);
    setPhase('result');
    onLevelFinished(didPass);
  };

  const handleEnter = () => {
    if (phase !== 'playing' || !spelled || entering) return;
    setEntering(true);
    const match = remainingCards.find(
      (c) => c.word.toUpperCase() === spelled.toUpperCase()
    );
    if (match) {
      // Clear used tiles for this word; leave unused tiles for others
      const usedSet = new Set(selectedIds);
      setTiles((prev) => prev.filter((t) => !usedSet.has(t.id)));
      setSelectedIds([]);
      const nextDone = new Set(doneIds);
      nextDone.add(match.id);
      setDoneIds(nextDone);
      setFeedback(`Nice! ${match.emoji}`);
      playWordAudio(match.word);

      if (nextDone.size >= cards.length) {
        // Round complete
        if (roundIndex + 1 >= ADVENTURE_ROUNDS_PER_LEVEL) {
          const accuracy =
            misses === 0 ? 1 : Math.max(0, 1 - misses / (cards.length * ADVENTURE_ROUNDS_PER_LEVEL));
          // Pass rules
          if (isBoss) {
            const bossPass = misses < ADVENTURE_BOSS_MAX_MISSES;
            setTimeout(() => finishLevel(bossPass), 450);
          } else {
            const vowelPass = misses === 0 && accuracy >= ADVENTURE_PASS_THRESHOLD;
            // 100% = no wrong Enters
            setTimeout(() => finishLevel(misses === 0 && vowelPass), 450);
          }
        } else {
          setTimeout(() => {
            const next = roundIndex + 1;
            setRoundIndex(next);
            setupRound(next, seed + next * 17);
            setEntering(false);
          }, 500);
          return;
        }
      }
    } else {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setFeedback('Try again!');
      setSelectedIds([]);
      setTiles((prev) => prev.map((t) => ({ ...t, used: false })));
      if (isBoss && nextMisses >= ADVENTURE_BOSS_MAX_MISSES) {
        setTimeout(() => finishLevel(false), 600);
      }
    }
    setTimeout(() => setEntering(false), 280);
  };

  if (phase === 'result') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-4 text-center text-slate-100">
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl ${
            passed
              ? 'bg-emerald-500/20 border-2 border-emerald-400'
              : 'bg-slate-800 border-2 border-slate-600'
          }`}
        >
          {passed ? <Star className="w-10 h-10 text-amber-400 fill-amber-400" /> : level.emoji}
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl">
          {passed ? 'Level Clear!' : isBoss ? 'Boss Needs Another Try' : 'Almost — Try Again'}
        </h2>
        <p className="text-sm text-slate-400 max-w-sm">
          {passed
            ? isBoss
              ? 'You beat the Spark Boss! Spark is complete.'
              : `Great spelling on ${level.title}.`
            : isBoss
              ? `Three misses — replay the Boss when you are ready.`
              : `Spark levels need a perfect round (no wrong answers). You had ${misses} miss${misses === 1 ? '' : 'es'}.`}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <button
            type="button"
            onClick={onExitToMap}
            className="min-h-[48px] px-5 rounded-2xl bg-slate-800 border border-slate-600 font-bold text-sm cursor-pointer active:scale-95"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-0 flex flex-col text-slate-100 select-none px-3 sm:px-4 py-2 safe-area-pad">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 shrink-0 pb-2">
        <button
          type="button"
          onClick={onExitToMap}
          className="min-h-[44px] min-w-[44px] rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center cursor-pointer"
          aria-label="Back to map"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center min-w-0">
          <div className="font-display font-black text-base sm:text-lg truncate">
            {level.emoji} {level.title}
          </div>
          <div className="text-[11px] font-semibold text-slate-400">
            Round {roundIndex + 1}/{ADVENTURE_ROUNDS_PER_LEVEL}
            {isBoss ? ` · Misses ${misses}/${ADVENTURE_BOSS_MAX_MISSES}` : misses > 0 ? ` · Misses ${misses}` : ''}
          </div>
        </div>
        <div className="text-sm font-bold flex items-center gap-1">
          <span>{playerLogo}</span>
          <span className="hidden sm:inline max-w-[64px] truncate">{playerName}</span>
        </div>
      </header>

      {/* Emoji cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 shrink-0 py-2">
        {cards.map((card) => {
          const done = doneIds.has(card.id);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardTap(card)}
              disabled={done}
              className={`relative min-h-[88px] sm:min-h-[100px] rounded-3xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                done
                  ? 'bg-emerald-500/15 border-emerald-400/60 opacity-80'
                  : 'bg-slate-900/90 border-amber-400/40 hover:border-amber-300 cursor-pointer active:scale-[0.98]'
              }`}
            >
              <span className="text-[42px] sm:text-[48px] leading-none drop-shadow">
                {card.emoji}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                {done ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Done
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Tap to hear
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Spelled word + controls */}
      <div className="shrink-0 flex flex-col items-center gap-2 py-2">
        <div className="min-h-[48px] w-full max-w-md rounded-2xl bg-slate-950 border-2 border-slate-700 flex items-center justify-center px-3">
          <span className="font-display font-black text-2xl sm:text-3xl tracking-[0.2em] text-amber-300 uppercase">
            {spelled || '· · ·'}
          </span>
        </div>
        {feedback && (
          <div
            className={`text-sm font-bold ${
              feedback.startsWith('Nice') ? 'text-emerald-400' : 'text-rose-300'
            }`}
          >
            {feedback}
          </div>
        )}
        <div className="flex items-center gap-2 w-full max-w-md">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 min-h-[44px] rounded-2xl bg-slate-800 border border-slate-600 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" /> Clear
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="flex-1 min-h-[44px] rounded-2xl bg-slate-800 border border-slate-600 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
          >
            <Delete className="w-4 h-4" /> Back
          </button>
          <button
            type="button"
            onClick={handleEnter}
            disabled={!spelled}
            className={`flex-[1.4] min-h-[48px] rounded-2xl font-display font-black text-sm flex items-center justify-center gap-1 transition-all ${
              spelled
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current" /> Enter
          </button>
        </div>
      </div>

      {/* Even-layer letter tray */}
      <div className="flex-1 min-h-0 flex items-end justify-center pb-3 pt-1">
        <div
          className={`w-full max-w-lg flex flex-wrap justify-center content-end gap-2 transition-transform duration-700 ease-out ${
            dropIn ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'
          }`}
        >
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              disabled={tile.used}
              onClick={() => handleTileTap(tile)}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl font-display font-black text-xl sm:text-2xl border-2 flex items-center justify-center transition-all ${
                tile.used
                  ? 'opacity-0 scale-75 pointer-events-none border-transparent'
                  : 'bg-indigo-500/20 border-indigo-300/60 text-white shadow-md shadow-indigo-500/20 cursor-pointer active:scale-90 hover:bg-indigo-500/30'
              }`}
            >
              {tile.letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
