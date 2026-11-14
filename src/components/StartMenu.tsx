import React from 'react';
import {
  Trophy,
  Volume2,
  VolumeX,
  Play,
  User,
  Users,
  Zap,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { ScreenModeType, DifficultyChoice, DIFFICULTY_PRESETS } from '../types/game';
import { DifficultyPicker } from './DifficultyPicker';

interface StartMenuProps {
  onQuickPlay: () => void;
  onOpenSoloSetup: () => void;
  onOpenTeamSetup: () => void;
  onOpenHighScores: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  screenMode: ScreenModeType;
  difficulty: DifficultyChoice;
  onChangeDifficulty: (level: DifficultyChoice) => void;
  /** True once the player has saved custom Settings (shows the Custom difficulty). */
  hasCustomSettings: boolean;
  onOpenSettings: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  onQuickPlay,
  onOpenSoloSetup,
  onOpenTeamSetup,
  onOpenHighScores,
  soundEnabled,
  onToggleSound,
  screenMode,
  difficulty,
  onChangeDifficulty,
  hasCustomSettings,
  onOpenSettings,
}) => {
  const isWide = screenMode === 'pc';
  const activeLabel =
    difficulty === 'custom'
      ? hasCustomSettings
        ? 'Custom'
        : DIFFICULTY_PRESETS.normal.label
      : DIFFICULTY_PRESETS[difficulty].label;

  return (
    <div
      className={`w-full h-full ${
        isWide ? 'w-full md:w-[50vw] md:max-w-[50vw] md:min-w-[480px] px-6 py-4' : 'w-full max-w-full px-4 py-3.5'
      } mx-auto flex flex-col justify-between select-none text-slate-100 no-scrollbar overflow-y-auto`}
    >
      {/* Top Header */}
      <header className="w-full flex items-center justify-between pb-2.5 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          {/* Hex W Logo */}
          <div className="relative">
            <svg width="44" height="50" viewBox="0 0 84 96" className="drop-shadow-md">
              <polygon
                points="42,4 80,26 80,70 42,92 4,70 4,26"
                fill="#f59e0b"
                stroke="#d97706"
                strokeWidth="5"
              />
              <text
                x="42"
                y="53"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="42"
                fontWeight="900"
                fill="#0f172a"
                className="font-display select-none"
              >
                W
              </text>
            </svg>
          </div>

          <div>
            <span className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white block leading-tight">
              Word Blitz Classic
            </span>
          </div>
        </div>

        {/* Header Action: Sound Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label="Turn sound on or off"
            className="min-h-[44px] min-w-[44px] px-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 flex items-center justify-center gap-2 font-bold text-sm shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 active:scale-95"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-amber-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound' : 'Muted'}</span>
          </button>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-1 flex flex-col items-center justify-center py-3 sm:py-4 space-y-3">
        {/* 1. How to play (3-steps strip) */}
        <div className="w-full bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 sm:p-3.5 shadow-sm">
          <span className="text-[11px] font-display font-black text-amber-400 uppercase tracking-widest block mb-2 text-center sm:text-left">
            How to play
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium text-slate-300">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">
                1
              </span>
              <span>Tap letters to spell words</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                2
              </span>
              <span>Press GO! to pop your word</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-rose-400 text-slate-950 font-black flex items-center justify-center shrink-0">
                3
              </span>
              <span>Keep pile below ceiling!</span>
            </div>
          </div>
        </div>
        {/* 2. Quick Play Button */}
        <div className="w-full">
          <button
            type="button"
            onClick={onQuickPlay}
            className="w-full min-h-[88px] sm:min-h-[96px] p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 border-3 border-amber-300 text-slate-950 flex items-center justify-between shadow-2xl shadow-amber-500/25 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-950/20 flex items-center justify-center text-slate-950 shrink-0">
                <Zap className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
              </div>
              <div>
                <span className="font-display font-black text-3xl sm:text-4xl text-slate-950 tracking-tight block leading-tight">
                  Quick Play
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900/80 block mt-0.5">
                  2-Minute Round · {activeLabel} Mode
                </span>
              </div>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </button>
        </div>

        {/* 3. Solo Play & Team Play Buttons */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {/* Solo Play */}
          <button
            type="button"
            onClick={onOpenSoloSetup}
            className="w-full min-h-[70px] p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border-2 border-indigo-500/40 hover:border-indigo-400 text-white flex items-center gap-3 shadow-md shadow-indigo-500/10 transition-all cursor-pointer active:scale-[0.98] text-left group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-base sm:text-lg text-white block leading-tight">
                  Solo Play
                </span>
                <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="text-xs text-indigo-300 font-semibold block mt-0.5 truncate">
                Name &amp; Unique Logo
              </span>
            </div>
          </button>

          {/* Team Play */}
          <button
            type="button"
            onClick={onOpenTeamSetup}
            className="w-full min-h-[70px] p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border-2 border-emerald-500/40 hover:border-emerald-400 text-white flex items-center gap-3 shadow-md shadow-emerald-500/10 transition-all cursor-pointer active:scale-[0.98] text-left group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-base sm:text-lg text-white block leading-tight">
                  Team Play
                </span>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="text-xs text-emerald-300 font-semibold block mt-0.5 truncate">
                Classroom Team Match
              </span>
            </div>
          </button>
        </div>

        {/* 4. Difficulty (presets + Custom once Settings are saved) */}
        <DifficultyPicker
          difficulty={difficulty}
          onChange={onChangeDifficulty}
          hasCustom={hasCustomSettings}
        />
      </main>

      {/* Footer Row */}
      <footer className="w-full flex items-center justify-between pt-2.5 border-t border-slate-800/80 shrink-0 gap-4">
        <button
          type="button"
          onClick={onOpenHighScores}
          className="min-h-[44px] px-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 font-bold text-xs sm:text-sm text-slate-200 flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Leaderboard</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="min-h-[44px] px-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 font-bold text-xs sm:text-sm text-slate-200 flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Settings className="w-4 h-4 text-fuchsia-400" />
          <span>Settings</span>
        </button>
      </footer>
    </div>
  );
};
