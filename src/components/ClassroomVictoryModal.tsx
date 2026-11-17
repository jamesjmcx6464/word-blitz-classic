import React, { useEffect } from 'react';
import { useTapReady } from '../hooks/useTapReady';
import { Trophy, Medal, Star, RotateCcw, Users, Home, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClassroomMatchState, ClassroomTeam } from '../types/game';
import { WordChips } from './WordChips';

interface ClassroomVictoryModalProps {
  matchState: ClassroomMatchState;
  onRematch: () => void;
  onNewMatchSetup: () => void;
  onExitToMenu: () => void;
  isWide: boolean;
}

export const ClassroomVictoryModal: React.FC<ClassroomVictoryModalProps> = ({
  matchState,
  onRematch,
  onNewMatchSetup,
  onExitToMenu,
  isWide,
}) => {
  const tapReady = useTapReady(600);
  const { config } = matchState;
  const sortedTeams = [...config.teams].sort((a, b) => b.score - a.score);
  const winner = sortedTeams[0];

  useEffect(() => {
    // Big confetti fanfare
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.35 },
    });
    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 120,
        origin: { y: 0.5 },
      });
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const getRankBadge = (rankIndex: number) => {
    if (rankIndex === 0) return { label: '1st', bg: 'bg-amber-400 text-amber-950 border-amber-300', icon: '🏆' };
    if (rankIndex === 1) return { label: '2nd', bg: 'bg-slate-300 text-slate-900 border-slate-200', icon: '🥈' };
    if (rankIndex === 2) return { label: '3rd', bg: 'bg-amber-700 text-amber-100 border-amber-600', icon: '🥉' };
    return { label: `${rankIndex + 1}th`, bg: 'bg-slate-800 text-slate-400 border-slate-700', icon: '⭐' };
  };

  return (
    <div data-armed={tapReady ? 'true' : 'false'} className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md select-none text-slate-100 overflow-y-auto no-scrollbar">
      <div
        className={`w-full ${
          isWide ? 'max-w-3xl' : 'max-w-md'
        } max-h-[94vh] bg-slate-900 border-4 border-amber-400/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-center`}
      >
        {/* Header */}
        <div className="p-5 sm:p-7 border-b border-slate-800 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 text-center space-y-2 shrink-0">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-400 text-slate-950 shadow-xl shadow-amber-400/30 mb-1">
            <Trophy className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>

          <span className="text-xs sm:text-sm font-display font-black uppercase tracking-widest text-amber-400 block">
            Classroom Champions
          </span>

          <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
            {winner.name} Wins!
          </h1>
          <p className="text-sm font-semibold text-slate-300">
            Fantastic effort from all {config.teams.length} teams across {config.totalRounds} {config.totalRounds === 1 ? 'round' : 'rounds'}!
          </p>
        </div>

        {/* Scrollable Team Rankings */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto no-scrollbar flex-1">
          <div className="grid grid-cols-1 gap-3">
            {sortedTeams.map((team, idx) => {
              const badge = getRankBadge(idx);
              const isWinner = idx === 0;

              // Find longest word by this team
              const longest = team.wordsFound.reduce(
                (max, w) => (w.word.length > max.length ? w.word : max),
                ''
              );

              return (
                <div
                  key={team.id}
                  className={`p-4 rounded-2xl border-2 flex flex-col gap-3 text-left transition-all ${
                    isWinner
                      ? 'bg-amber-400/10 border-amber-400 shadow-lg'
                      : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                  style={!isWinner ? { borderColor: `${team.color}60` } : {}}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      {/* Rank pill */}
                      <div
                        className={`w-11 h-11 rounded-2xl border flex items-center justify-center font-display font-black text-base shrink-0 shadow-sm ${badge.bg}`}
                      >
                        {badge.label}
                      </div>

                      {/* Team info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{team.emoji}</span>
                          <span className="font-display font-black text-xl text-white">
                            {team.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold mt-0.5">
                          <span>{team.wordsFound.length} words found</span>
                          {longest && <span>· Longest: &quot;{longest}&quot;</span>}
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="self-end sm:self-center">
                      <span className="font-mono font-black text-2xl text-amber-300">
                        {team.score.toLocaleString()} pts
                      </span>
                    </div>
                  </div>

                  <WordChips
                    words={team.wordsFound}
                    emptyText="No words this match"
                    maxHeightClass="max-h-24 sm:max-h-32"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onExitToMenu}
            className="w-full sm:w-auto min-h-[50px] px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>

          <button
            type="button"
            onClick={onNewMatchSetup}
            className="w-full sm:w-auto min-h-[50px] px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Edit Teams</span>
          </button>

          <button
            type="button"
            onClick={onRematch}
            className="w-full sm:flex-1 min-h-[50px] px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Play Rematch!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
