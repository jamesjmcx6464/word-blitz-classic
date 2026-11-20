import React from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';

interface AdventureHeaderProps {
  playerName: string;
  playerLogo: string;
  totalScore: number;
  onBack: () => void;
  backLabel: string;
  /** Optional centre title (the adventure name on a map). */
  title?: React.ReactNode;
}

/** Top bar for Adventure Home and every adventure map: back, title, adventurer + total score. */
export const AdventureHeader: React.FC<AdventureHeaderProps> = ({
  playerName,
  playerLogo,
  totalScore,
  onBack,
  backLabel,
  title,
}) => (
  <header className="flex items-center justify-between gap-2 shrink-0 pb-3 border-b border-slate-800/80">
    <button
      type="button"
      onClick={onBack}
      className="min-h-[44px] min-w-[44px] px-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
      aria-label={backLabel}
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
    {title ? (
      <div className="font-display font-black text-lg text-white leading-tight truncate min-w-0">{title}</div>
    ) : null}
    <div
      data-testid="adventurer-chip"
      className="flex items-center gap-1.5 min-h-[44px] pl-2.5 pr-3 rounded-2xl bg-slate-900 border border-slate-700 min-w-0"
    >
      <span className="text-xl leading-none">{playerLogo}</span>
      <span className="font-bold text-sm text-slate-200 max-w-[80px] truncate">{playerName}</span>
      <span className="flex items-center gap-1 pl-1.5 ml-0.5 border-l border-slate-700">
        <Trophy className="w-3.5 h-3.5 text-amber-400" />
        <span data-testid="adventure-total-score" className="font-display font-black text-sm text-amber-300 tabular-nums">
          {totalScore.toLocaleString()}
        </span>
      </span>
    </div>
  </header>
);
