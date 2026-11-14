import React from 'react';
import { Clock, Infinity as InfinityIcon } from 'lucide-react';

interface TimerToggleProps {
  timerOn: boolean;
  onChange: (on: boolean) => void;
  /** Label for the On side, e.g. "Timer on · 2 min" */
  onLabel?: string;
  /** Label for the Off side, e.g. "Timer off" */
  offLabel?: string;
  /** Accent colour of the active side */
  tone?: 'amber' | 'indigo';
  className?: string;
}

/** Phone-friendly two-way switch: Timer on / Timer off. */
export const TimerToggle: React.FC<TimerToggleProps> = ({
  timerOn,
  onChange,
  onLabel = 'Timer on',
  offLabel = 'Timer off',
  tone = 'amber',
  className = '',
}) => {
  const activeClass =
    tone === 'indigo'
      ? 'bg-indigo-500 text-white border-indigo-300 shadow-md shadow-indigo-500/20'
      : 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20';
  const idleClass = 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800';
  const base =
    'min-h-[44px] px-3 rounded-xl border-2 font-display font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95';
  return (
    <div role="radiogroup" aria-label="Timer" className={`grid grid-cols-2 gap-1.5 ${className}`}>
      <button
        type="button"
        role="radio"
        aria-checked={timerOn}
        onClick={() => onChange(true)}
        className={`${base} ${timerOn ? activeClass : idleClass}`}
      >
        <Clock className="w-4 h-4 shrink-0" />
        <span className="truncate">{onLabel}</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={!timerOn}
        onClick={() => onChange(false)}
        className={`${base} ${!timerOn ? activeClass : idleClass}`}
      >
        <InfinityIcon className="w-4 h-4 shrink-0" />
        <span className="truncate">{offLabel}</span>
      </button>
    </div>
  );
};
