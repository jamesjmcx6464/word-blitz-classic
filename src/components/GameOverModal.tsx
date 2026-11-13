import React, { useEffect, useState, useMemo } from 'react';
import { Play, Trophy, Home, Sparkles, BookOpen, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WordEntry } from '../types/game';
import { getSpellingProgress } from '../utils/spellingProgress';

interface GameOverModalProps {
  finalScore: number;
  longestWord: string;
  totalWords: number;
  rank: number;
  isNewHighScore: boolean;
  onNewGame: () => void;
  onViewHighScores: () => void;
  onBackToMenu: () => void;
  reason?: string;
  onViewWords?: () => void;
  wordEntries?: WordEntry[];
  spellingWords?: string[];
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  finalScore,
  longestWord,
  totalWords,
  rank,
  isNewHighScore,
  onNewGame,
  onViewHighScores,
  onBackToMenu,
  reason = 'The letters reached the top!',
  onViewWords,
  wordEntries = [],
  spellingWords,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const isTimeOut = /time/i.test(reason);
  const title = isTimeOut ? "Time's up!" : 'Nice try!';
  const reasonText = isTimeOut ? reason : 'The letters reached the top!';

  const spellingProgress = useMemo(() => {
    if (!spellingWords || spellingWords.length === 0) return null;
    return getSpellingProgress(wordEntries, spellingWords);
  }, [wordEntries, spellingWords]);

  useEffect(() => {
    if (isNewHighScore || (rank > 0 && rank <= 3) || spellingProgress?.allFound) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [isNewHighScore, rank, spellingProgress?.allFound]);

  const handleCopyResults = async () => {
    if (!spellingProgress) return;
    try {
      const summary = [
        `Word Blitz Spelling Results:`,
        `Score: ${finalScore} points`,
        `Found (${spellingProgress.foundCount}/${spellingProgress.totalCount}): ${spellingProgress.foundWords.join(', ') || 'None'}`,
        spellingProgress.missingWords.length > 0
          ? `Still to practice: ${spellingProgress.missingWords.join(', ')}`
          : 'All words completed!',
      ].join('\n');

      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy spelling results:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none animate-fade-in">
      <div className="w-full max-w-md bg-white border-4 border-amber-300 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center text-slate-800">
        {/* Banner */}
        {isNewHighScore ? (
          <div className="mb-3 px-4 py-1.5 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-950 text-sm font-black flex items-center gap-2 uppercase tracking-wider motion-safe:animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span>New high score!</span>
          </div>
        ) : rank > 0 ? (
          <div className="mb-3 px-4 py-1.5 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-950 text-sm font-black flex items-center gap-2 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-emerald-600" />
            <span>You are #{rank} on the scoreboard!</span>
          </div>
        ) : null}

        {/* Title & Reason (NEVER "Game Over") */}
        <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight mb-1">
          {title}
        </h2>
        <p className="text-base text-slate-600 font-medium mb-5">
          {reasonText}
        </p>

        {/* Score Card */}
        <div className="w-full bg-amber-50 border-4 border-amber-200 rounded-3xl p-5 mb-5 space-y-3">
          <div>
            <span className="text-sm font-bold text-slate-600 uppercase tracking-wider block">
              You scored
            </span>
            <span className="text-4xl sm:text-5xl font-display font-black text-amber-950 tabular-nums font-mono leading-none my-1 block">
              {finalScore.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-slate-600">
              points
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t-2 border-amber-200 text-left">
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 block">
                Words found
              </span>
              <span className="text-lg font-black font-mono text-slate-900">
                {totalWords}
              </span>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 block">
                Longest word
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 truncate block">
                {longestWord || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Spelling Words Progress Section */}
        {spellingProgress && (
          <div className="w-full bg-teal-50 border-2 border-teal-300 rounded-2xl p-4 mb-5 text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-display font-black text-base text-teal-950">
                You found {spellingProgress.foundCount} of {spellingProgress.totalCount} spelling words
              </span>
              <button
                type="button"
                onClick={handleCopyResults}
                className="min-h-[44px] px-3 rounded-xl bg-white hover:bg-teal-100 border border-teal-300 text-teal-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-teal-700" />
                    <span>Copy results</span>
                  </>
                )}
              </button>
            </div>

            {spellingProgress.missingWords.length > 0 ? (
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1">
                  Still to practice:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {spellingProgress.missingWords.map((word) => (
                    <span
                      key={word}
                      className="px-2.5 py-1 rounded-xl bg-white border border-teal-200 text-teal-950 text-sm font-bold font-mono"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm font-bold text-emerald-800">
                🎉 Awesome! You spelled every word on today's list!
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Play Again (72px) */}
          <button
            type="button"
            onClick={onNewGame}
            className="w-full min-h-[72px] px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-display font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-amber-400/25 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>▶ Play Again</span>
          </button>

          {onViewWords && totalWords > 0 && (
            <button
              type="button"
              onClick={onViewWords}
              className="w-full min-h-[56px] px-5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base flex items-center justify-center gap-2 border-2 border-slate-300 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <BookOpen className="w-5 h-5 text-amber-500" />
              <span>📖 My Words ({totalWords})</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onViewHighScores}
              className="min-h-[56px] px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-1.5 border-2 border-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>⭐ High Scores</span>
            </button>

            <button
              type="button"
              onClick={onBackToMenu}
              className="min-h-[56px] px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-1.5 border-2 border-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-600" />
              <span>🏠 Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
