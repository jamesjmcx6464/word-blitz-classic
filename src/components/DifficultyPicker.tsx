import React from 'react';
import { Gauge, Flame, SlidersHorizontal } from 'lucide-react';
import { DifficultyChoice, DifficultyLevel, DIFFICULTY_PRESETS } from '../types/game';

const DIFFICULTY_ORDER: DifficultyLevel[] = ['beginner', 'easy', 'normal', 'hard', 'nightmare'];

const DIFFICULTY_STYLE: Record<DifficultyChoice, { activeClass: string; badgeText: string }> = {
  beginner: {
    activeClass: 'bg-sky-400 text-slate-950 border-sky-200 shadow-md shadow-sky-400/20',
    badgeText: 'text-sky-300',
  },
  easy: {
    activeClass: 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md shadow-emerald-500/20',
    badgeText: 'text-emerald-300',
  },
  normal: {
    activeClass: 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20',
    badgeText: 'text-amber-300',
  },
  hard: {
    activeClass: 'bg-orange-500 text-slate-950 border-orange-300 shadow-md shadow-orange-500/20',
    badgeText: 'text-orange-300',
  },
  nightmare: {
    activeClass: 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/25',
    badgeText: 'text-rose-300',
  },
  custom: {
    activeClass: 'bg-fuchsia-500 text-white border-fuchsia-300 shadow-md shadow-fuchsia-500/25',
    badgeText: 'text-fuchsia-300',
  },
};

interface DifficultyPickerProps {
  difficulty: DifficultyChoice;
  onChange: (level: DifficultyChoice) => void;
  /** Show the Custom option (only when the player has saved Settings). */
  hasCustom: boolean;
  className?: string;
}

/** Difficulty presets (+ Custom when saved). Shared by Home, Solo setup and Team setup. */
export const DifficultyPicker: React.FC<DifficultyPickerProps> = ({
  difficulty,
  onChange,
  hasCustom,
  className = '',
}) => {
  const active: DifficultyChoice = difficulty === 'custom' && !hasCustom ? 'normal' : difficulty;
  const description =
    active === 'custom' ? 'Your own settings' : DIFFICULTY_PRESETS[active].description;
  const options: DifficultyChoice[] = hasCustom ? [...DIFFICULTY_ORDER, 'custom'] : DIFFICULTY_ORDER;

  return (
    <div
      className={`w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {active === 'custom' ? (
            <SlidersHorizontal className="w-4 h-4 text-fuchsia-400" />
          ) : active === 'nightmare' ? (
            <Flame className="w-4 h-4 text-rose-400" />
          ) : (
            <Gauge className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-[11px] font-display font-black uppercase tracking-widest text-slate-300">
            Difficulty
          </span>
        </div>
        <span className={`text-xs font-bold truncate ${DIFFICULTY_STYLE[active].badgeText}`}>
          {description}
        </span>
      </div>

      <div className={`grid grid-cols-3 gap-1.5 ${hasCustom ? 'sm:grid-cols-6' : 'sm:grid-cols-5'}`}>
        {options.map((lvl) => {
          const isSelected = active === lvl;
          const label = lvl === 'custom' ? 'Custom' : DIFFICULTY_PRESETS[lvl].label;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => onChange(lvl)}
              aria-pressed={isSelected}
              className={`min-h-[40px] px-1.5 py-1.5 rounded-xl border-2 font-display font-black text-xs transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? DIFFICULTY_STYLE[lvl].activeClass
                  : lvl === 'custom'
                  ? 'bg-slate-800/80 border-fuchsia-500/50 text-fuchsia-200 hover:bg-slate-800'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
