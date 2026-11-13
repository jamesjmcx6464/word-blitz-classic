import React, { useState, useEffect } from 'react';
import { getHighScores, clearHighScores, HighScoreEntry } from '../utils/highScores';
import { Trophy, ArrowLeft, Trash2, UserPlus, Play, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface LastSoloResult {
  entryId?: string;
  playerName: string;
  playerLogo: string;
  score: number;
  totalWords: number;
  longestWord: string;
  rank: number;
  isNewHighScore: boolean;
  reason?: string;
}

interface HighScoresModalProps {
  onBack: () => void;
  onPlayAgain?: () => void;
  onStartNextStudent?: () => void;
  lastResult?: LastSoloResult | null;
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({
  onBack,
  onPlayAgain,
  onStartNextStudent,
  lastResult = null,
}) => {
  const [scores, setScores] = useState<HighScoreEntry[]>(() => getHighScores());
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    setScores(getHighScores());
    if (lastResult && (lastResult.isNewHighScore || (lastResult.rank > 0 && lastResult.rank <= 3))) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.55 },
      });
    }
  }, [lastResult]);

  const handleClear = () => {
    clearHighScores();
    setScores([]);
    setShowConfirmClear(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md select-none text-slate-100 overflow-y-auto no-scrollbar animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-white">
                Leaderboard
              </h2>
              <span className="text-xs font-semibold text-amber-400/90 block">
                Classroom High Scores
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Back to menu"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Just-Completed Run Banner (when arriving directly from Solo Play) */}
        {lastResult && (
          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-slate-900 border-2 border-amber-400/60 flex items-center justify-between gap-3 shrink-0 shadow-lg shadow-amber-500/10">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-3xl shrink-0 drop-shadow">{lastResult.playerLogo}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-black text-base text-white truncate">
                    {lastResult.playerName}
                  </span>
                  {lastResult.isNewHighScore ? (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                      #1 High Score!
                    </span>
                  ) : lastResult.rank > 0 ? (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 font-black text-[10px] uppercase tracking-wider">
                      Rank #{lastResult.rank}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-slate-300 font-medium block truncate">
                  {lastResult.totalWords} words · Longest: {lastResult.longestWord || '-'}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-display font-black text-2xl text-amber-300 font-mono block leading-none">
                {lastResult.score.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-amber-400/80 uppercase">pts</span>
            </div>
          </div>
        )}

        {/* Quick Action Banner: Next Student Button */}
        {onStartNextStudent && (
          <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-indigo-900/50 via-purple-900/40 to-slate-900 border border-indigo-500/40 flex items-center justify-between gap-3 shrink-0 shadow-sm">
            <div className="min-w-0">
              <span className="font-display font-extrabold text-sm text-indigo-200 block truncate">
                Next student ready?
              </span>
              <span className="text-xs text-slate-400 block truncate">
                Enter your name, pick a logo & play!
              </span>
            </div>
            <button
              type="button"
              onClick={onStartNextStudent}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-display font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Next Student</span>
            </button>
          </div>
        )}

        {/* Scores Table */}
        <div className="flex-1 overflow-y-auto py-3.5 space-y-2.5 my-1">
          {scores.length === 0 ? (
            <div className="py-14 text-center text-slate-500 text-sm space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-400 text-base">No high scores yet</p>
              <p className="text-xs text-slate-500">
                Finish a game to set the first class record!
              </p>
            </div>
          ) : (
            scores.map((entry, idx) => {
              const isJustAdded = lastResult?.entryId && entry.id === lastResult.entryId;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isJustAdded
                      ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/15 ring-1 ring-amber-400/60 text-amber-100'
                      : idx === 0
                      ? 'bg-amber-500/15 border-amber-400/50 shadow-md shadow-amber-500/10 text-amber-200'
                      : idx === 1
                      ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                      : idx === 2
                      ? 'bg-slate-800/60 border-slate-800 text-slate-300'
                      : 'bg-slate-900/50 border-slate-800/60 text-slate-400'
                  }`}
                >
                  {/* Left: Rank + Logo + Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {/* Logo Emoji (if any) */}
                    {entry.playerLogo && (
                      <span className="text-2xl shrink-0 drop-shadow">
                        {entry.playerLogo}
                      </span>
                    )}

                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-display font-black text-white truncate flex items-center gap-1.5">
                        <span>{entry.playerName || 'Quick Player'}</span>
                        {isJustAdded && (
                          <span className="text-[10px] font-black uppercase bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-md">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium truncate">
                        Best: <span className="font-mono font-bold text-slate-300">{entry.longestWord}</span> · {entry.totalWords} words
                      </div>
                    </div>
                  </div>

                  {/* Right: Score & Date */}
                  <div className="text-right shrink-0 pl-2">
                    <div className="text-base sm:text-lg font-display font-black tabular-nums tracking-tight text-amber-300 font-mono">
                      {entry.score.toLocaleString()} <span className="text-xs font-bold text-amber-400/80">pts</span>
                    </div>
                    <div className="text-[10px] text-slate-500 tabular-nums">
                      {entry.date}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {showConfirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400 font-bold">Clear all scores?</span>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
              >
                Yes, clear
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            scores.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                className="text-xs font-semibold text-slate-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
                title="Reset all high scores"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Leaderboard</span>
              </button>
            ) : <div />
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onPlayAgain && (
              <button
                type="button"
                onClick={onPlayAgain}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Quick Play</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold active:scale-95 transition-all cursor-pointer"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
