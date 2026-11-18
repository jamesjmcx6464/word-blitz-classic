import React, { useEffect, useState } from 'react';
import { useTapReady } from '../hooks/useTapReady';
import { Play, Trophy, Home, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WordEntry } from '../types/game';
import { WordChips } from './WordChips';

interface GameOverModalProps {
  finalScore: number;
  longestWord: string;
  totalWords: number;
  wordEntries?: WordEntry[];
  rank: number;
  isNewHighScore: boolean;
  onNewGame: () => void;
  onBackToMenu: () => void;
  onOpenLeaderboards: () => void;
  reason?: string;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  finalScore,
  longestWord,
  totalWords,
  wordEntries = [],
  rank,
  isNewHighScore,
  onNewGame,
  onBackToMenu,
  onOpenLeaderboards,
  reason = 'The letters reached the top!',
}) => {
  const tapReady = useTapReady(600);
  const isTimeOut = /time/i.test(reason);
  const title = isTimeOut ? "Time's up!" : 'Nice try!';
  const reasonText = isTimeOut ? reason : 'The letters reached the top!';
  const hasWords = wordEntries.length > 0;
  const [wordsOpen, setWordsOpen] = useState(true);

  useEffect(() => {
    if (isNewHighScore || (rank > 0 && rank <= 3)) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [isNewHighScore, rank]);

  return (
    <div
      data-armed={tapReady ? 'true' : 'false'}
      className="game-over-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md select-none animate-fade-in overflow-hidden"
    >
      <div className="game-over-card w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center text-slate-100 overflow-hidden min-h-0">
        {isNewHighScore ? (
          <div className="mb-3 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs sm:text-sm font-black flex items-center gap-2 tracking-wide shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>New high score!</span>
          </div>
        ) : rank > 0 ? (
          <div className="mb-3 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-black flex items-center gap-2 tracking-wide shrink-0">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>You&apos;re #{rank}</span>
          </div>
        ) : null}

        <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight mb-1 shrink-0">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-slate-400 font-medium mb-3 shrink-0">
          {reasonText}
        </p>

        <div className="w-full min-h-0 rounded-3xl bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950/60 border border-amber-400/40 p-4 sm:p-5 mb-4 flex flex-col">
          <span className="text-[11px] font-display font-black text-amber-400 uppercase tracking-widest block shrink-0">
            Score
          </span>
          <span className="text-5xl sm:text-6xl font-display font-black text-amber-300 tabular-nums leading-none my-1 block shrink-0">
            {finalScore.toLocaleString()}
          </span>
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-amber-400/20 shrink-0">
            {hasWords ? (
              <button
                type="button"
                onClick={() => setWordsOpen((open) => !open)}
                aria-expanded={wordsOpen}
                aria-controls="end-screen-words"
                className="rounded-2xl bg-slate-950/70 border border-slate-700/70 px-3 py-2.5 text-center cursor-pointer hover:border-amber-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors"
              >
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center justify-center gap-1">
                  Words found
                  {wordsOpen ? (
                    <ChevronUp className="w-3 h-3 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-amber-400" />
                  )}
                </span>
                <span className="text-xl font-display font-black text-white tabular-nums">
                  {totalWords}
                </span>
              </button>
            ) : (
              <div className="rounded-2xl bg-slate-950/70 border border-slate-700/70 px-3 py-2.5">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                  Words found
                </span>
                <span className="text-xl font-display font-black text-white tabular-nums">
                  {totalWords}
                </span>
              </div>
            )}
            <div className="rounded-2xl bg-slate-950/70 border border-slate-700/70 px-3 py-2.5 min-w-0">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                Longest word
              </span>
              <span
                className={`${
                  (longestWord || '').length > 7 ? 'text-base sm:text-lg' : 'text-xl'
                } font-display font-black text-white break-all block leading-tight`}
              >
                {longestWord || '-'}
              </span>
            </div>
          </div>

          {hasWords && wordsOpen && (
            <div id="end-screen-words" className="mt-3 pt-3 border-t border-amber-400/20 text-left min-h-0 flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2 block">
                Your words
              </span>
              <WordChips
                words={wordEntries}
                emptyText="No words this round"
                maxHeightClass="max-h-32 sm:max-h-40"
              />
            </div>
          )}

          {!hasWords && (
            <p className="mt-3 pt-3 border-t border-amber-400/20 text-xs sm:text-sm font-semibold text-slate-500">
              No words this round
            </p>
          )}
        </div>

        <div className="w-full flex flex-col gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onNewGame}
            className="w-full min-h-[56px] px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-amber-500/25 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>Play Again</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onOpenLeaderboards}
              className="w-full min-h-[52px] px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-display font-black text-sm sm:text-base flex items-center justify-center gap-2 border border-slate-600/80 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
            >
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Leaderboards</span>
            </button>
            <button
              type="button"
              onClick={onBackToMenu}
              className="w-full min-h-[52px] px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-display font-black text-sm sm:text-base flex items-center justify-center gap-2 border border-slate-600/80 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400"
            >
              <Home className="w-4 h-4 text-slate-300 shrink-0" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
