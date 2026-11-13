import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Clock,
  Target,
  Sparkles,
  BookOpen,
  X,
  Play,
  RotateCcw,
  Palette,
  Shuffle,
} from 'lucide-react';
import { ClassroomConfig, ClassroomTeam, TurnConditionType } from '../types/game';
import {
  TEAM_COLOR_PALETTES,
  TEAM_NAME_PRESETS,
  createDefaultTeam,
  saveClassroomConfig,
} from '../utils/classroomStorage';
import { parseSpellingWords } from '../utils/spellingWords';

interface ClassroomSetupModalProps {
  initialConfig: ClassroomConfig;
  spellingWordsList: string;
  onStartMatch: (config: ClassroomConfig) => void;
  onClose: () => void;
  isWide: boolean;
}

export const ClassroomSetupModal: React.FC<ClassroomSetupModalProps> = ({
  initialConfig,
  spellingWordsList,
  onStartMatch,
  onClose,
  isWide,
}) => {
  const [teams, setTeams] = useState<ClassroomTeam[]>(initialConfig.teams);
  const [turnCondition, setTurnCondition] = useState<TurnConditionType>(initialConfig.turnCondition);
  const [turnSeconds, setTurnSeconds] = useState<number>(initialConfig.turnSeconds);
  const [turnWordsTarget, setTurnWordsTarget] = useState<number>(initialConfig.turnWordsTarget);
  const [totalRounds, setTotalRounds] = useState<number>(initialConfig.totalRounds);
  const [useSpellingList, setUseSpellingList] = useState<boolean>(initialConfig.useSpellingList);
  const [cleanBoardEachTurn, setCleanBoardEachTurn] = useState<boolean>(initialConfig.cleanBoardEachTurn);

  const spellingCount = parseSpellingWords(spellingWordsList).length;

  const [activeTheme, setActiveTheme] = useState<'animals' | 'colors' | 'space' | 'all'>('animals');

  const handleApplyPreset = (presetType: 'animals' | 'colors' | 'space' | 'all') => {
    setActiveTheme(presetType);
    if (presetType === 'all') return;
    const preset = TEAM_NAME_PRESETS[presetType];
    const updated = teams.map((team, idx) => {
      const item = preset[idx % preset.length];
      const palette = TEAM_COLOR_PALETTES[idx % TEAM_COLOR_PALETTES.length];
      return {
        ...team,
        name: item.name,
        emoji: item.emoji,
        color: palette.color,
        colorBg: palette.colorBg,
        colorBorder: palette.colorBorder,
        colorText: palette.colorText,
      };
    });
    setTeams(updated);
  };

  const handleAddTeam = () => {
    if (teams.length >= 6) return;
    const themeToUse = activeTheme === 'all' ? 'animals' : activeTheme;
    const newTeam = createDefaultTeam(teams.length, themeToUse);
    setTeams([...teams, newTeam]);
  };

  const handleRemoveTeam = (index: number) => {
    if (teams.length <= 2) return;
    const updated = teams.filter((_, idx) => idx !== index);
    setTeams(updated);
  };

  const handleUpdateTeamName = (index: number, name: string) => {
    const updated = [...teams];
    updated[index] = { ...updated[index], name };
    setTeams(updated);
  };

  const handleCycleColor = (index: number) => {
    const updated = [...teams];
    const currentColor = updated[index].color;
    const paletteIndex = TEAM_COLOR_PALETTES.findIndex((p) => p.color === currentColor);
    const nextPalette = TEAM_COLOR_PALETTES[(paletteIndex + 1) % TEAM_COLOR_PALETTES.length];
    updated[index] = {
      ...updated[index],
      color: nextPalette.color,
      colorBg: nextPalette.colorBg,
      colorBorder: nextPalette.colorBorder,
      colorText: nextPalette.colorText,
    };
    setTeams(updated);
  };

  const handleCycleEmoji = (index: number) => {
    let pool: string[];
    if (activeTheme === 'animals') {
      pool = ['🦁', '🐬', '🦅', '🐼', '🦊', '🐻', '🐯', '🦉', '🦖', '🦄', '🐺', '🐨'];
    } else if (activeTheme === 'colors') {
      pool = ['🔵', '🔴', '🟢', '🟡', '🟣', '🌸', '🟠', '⚪', '⚫', '🟤'];
    } else if (activeTheme === 'space') {
      pool = ['🚀', '☄️', '⭐', '⚡', '🪐', '🔥', '🛰️', '🛸', '🌌', '🌙'];
    } else {
      pool = [
        '🦁', '🐬', '🦅', '🐼', '🦊', '🐻', '🐯', '🦉', '🦖', '🦄',
        '🔵', '🔴', '🟢', '🟡', '🟣', '🌸', '🟠',
        '🚀', '☄️', '⭐', '⚡', '🪐', '🔥', '🛰️', '🛸',
      ];
    }

    const updated = [...teams];
    const currentEmoji = updated[index].emoji;
    const emojiIdx = pool.indexOf(currentEmoji);
    const nextEmoji = pool[(emojiIdx + 1) % pool.length];
    updated[index] = { ...updated[index], emoji: nextEmoji };
    setTeams(updated);
  };

  const handleStart = () => {
    const finalConfig: ClassroomConfig = {
      teams: teams.map((t) => ({
        ...t,
        score: 0,
        wordsFound: [],
        turnsCompleted: 0,
        name: t.name.trim() || `Team ${t.emoji}`,
      })),
      turnCondition,
      turnSeconds,
      turnWordsTarget,
      totalRounds,
      useSpellingList: useSpellingList && spellingCount > 0,
      cleanBoardEachTurn,
    };

    saveClassroomConfig(finalConfig);
    onStartMatch(finalConfig);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md select-none text-slate-100 overflow-y-auto no-scrollbar">
      <div
        className={`w-full ${
          isWide ? 'max-w-3xl' : 'max-w-lg'
        } max-h-[92vh] bg-slate-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-white leading-tight">
                Classroom Team Match
              </h2>
              <p className="text-xs sm:text-sm text-indigo-300/90 font-medium">
                Take turns at the board and compete for high scores!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* Section 1: Teams & Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="font-display font-black text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>Teams ({teams.length} of 6)</span>
              </label>

              {/* Quick Themes */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-semibold hidden sm:inline">Theme:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('animals')}
                  className={`px-2.5 py-1 rounded-xl border font-bold transition-all cursor-pointer active:scale-95 ${
                    activeTheme === 'animals'
                      ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  🐾 Animals
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('colors')}
                  className={`px-2.5 py-1 rounded-xl border font-bold transition-all cursor-pointer active:scale-95 ${
                    activeTheme === 'colors'
                      ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  🎨 Colors
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('space')}
                  className={`px-2.5 py-1 rounded-xl border font-bold transition-all cursor-pointer active:scale-95 ${
                    activeTheme === 'space'
                      ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  🚀 Space
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  className={`px-2.5 py-1 rounded-xl border font-bold transition-all cursor-pointer active:scale-95 ${
                    activeTheme === 'all'
                      ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  ✨ All
                </button>
              </div>
            </div>

            {/* Team Cards Grid */}
            <div className={`grid ${isWide ? 'grid-cols-2 gap-3' : 'grid-cols-1 gap-2.5'}`}>
              {teams.map((team, idx) => (
                <div
                  key={team.id || idx}
                  className="p-3 rounded-2xl bg-slate-800/80 border-2 flex items-center gap-3 transition-all"
                  style={{ borderColor: team.color }}
                >
                  {/* Emoji Button (clickable to cycle) */}
                  <button
                    type="button"
                    onClick={() => handleCycleEmoji(idx)}
                    title="Tap to change team emoji"
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0 shadow-inner"
                    style={{ backgroundColor: `${team.color}30` }}
                  >
                    {team.emoji}
                  </button>

                  {/* Team Name Input */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={team.name}
                      maxLength={18}
                      onChange={(e) => handleUpdateTeamName(idx, e.target.value)}
                      placeholder={`Team ${idx + 1}`}
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  {/* Color Cycle Button */}
                  <button
                    type="button"
                    onClick={() => handleCycleColor(idx)}
                    title="Cycle team color"
                    className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-90 shrink-0 border-2 border-white/40 shadow-sm"
                    style={{ backgroundColor: team.color }}
                  >
                    <Palette className="w-4 h-4 text-white drop-shadow" />
                  </button>

                  {/* Delete Button (if > 2 teams) */}
                  {teams.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTeam(idx)}
                      title="Remove team"
                      className="w-9 h-9 rounded-xl bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Team Button (max 6) */}
            {teams.length < 6 && (
              <button
                type="button"
                onClick={handleAddTeam}
                className="w-full min-h-[44px] py-2.5 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-400 text-slate-400 hover:text-indigo-300 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add another team</span>
              </button>
            )}
          </div>

          {/* Section 2: Turn Rules */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="font-display font-black text-sm uppercase tracking-wider text-slate-300 block">
              Turn Rules
            </label>

            {/* Turn Condition Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTurnCondition('timer')}
                className={`min-h-[50px] px-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  turnCondition === 'timer'
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-md font-black'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>⏱️ Timed Turns</span>
              </button>

              <button
                type="button"
                onClick={() => setTurnCondition('words')}
                className={`min-h-[50px] px-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  turnCondition === 'words'
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-md font-black'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>🎯 Words Goal</span>
              </button>
            </div>

            {/* Turn Condition Values */}
            {turnCondition === 'timer' ? (
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">
                  Time per student turn:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 45, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTurnSeconds(sec)}
                      className={`min-h-[44px] rounded-xl font-bold text-sm transition-all cursor-pointer ${
                        turnSeconds === sec
                          ? 'bg-indigo-500 text-white shadow-md font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">
                  Words to spell before passing to next team:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((words) => (
                    <button
                      key={words}
                      type="button"
                      onClick={() => setTurnWordsTarget(words)}
                      className={`min-h-[44px] rounded-xl font-bold text-sm transition-all cursor-pointer ${
                        turnWordsTarget === words
                          ? 'bg-indigo-500 text-white shadow-md font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {words} {words === 1 ? 'word' : 'words'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Match Length (Rounds) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="font-display font-black text-sm uppercase tracking-wider text-slate-300 block">
              Match Length (Rounds)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 1, label: '1 Round' },
                { val: 2, label: '2 Rounds' },
                { val: 3, label: '3 Rounds' },
                { val: 5, label: '5 Rounds' },
              ].map((round) => (
                <button
                  key={round.val}
                  type="button"
                  onClick={() => setTotalRounds(round.val)}
                  className={`min-h-[44px] rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    totalRounds === round.val
                      ? 'bg-indigo-500 text-white shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {round.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Each round guarantees every team gets 1 full turn at the board.
            </p>
          </div>

          {/* Section 4: Word Source & Board Reset */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="font-display font-black text-sm uppercase tracking-wider text-slate-300 block">
              Word List & Board Settings
            </label>

            {/* Spelling list toggle */}
            <button
              type="button"
              onClick={() => {
                if (spellingCount > 0) {
                  setUseSpellingList(!useSpellingList);
                }
              }}
              className={`w-full min-h-[52px] px-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                spellingCount === 0
                  ? 'opacity-60 bg-slate-900 border-slate-800 cursor-not-allowed'
                  : useSpellingList
                  ? 'bg-teal-500/20 border-teal-400 text-white cursor-pointer'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <span className="font-bold text-sm block">
                    Use My Spelling List
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {spellingCount > 0
                      ? `${spellingCount} custom spelling words loaded`
                      : 'No spelling list configured yet (uses regular dictionary)'}
                  </span>
                </div>
              </div>
              <span
                className={`font-black text-sm px-3 py-1 rounded-xl ${
                  useSpellingList && spellingCount > 0
                    ? 'bg-teal-500 text-teal-950'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {useSpellingList && spellingCount > 0 ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Clean board toggle */}
            <button
              type="button"
              onClick={() => setCleanBoardEachTurn(!cleanBoardEachTurn)}
              className={`w-full min-h-[52px] px-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all cursor-pointer ${
                cleanBoardEachTurn
                  ? 'bg-indigo-500/20 border-indigo-400 text-white'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="font-bold text-sm block">
                    Fresh board each turn (Fair play)
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {cleanBoardEachTurn
                      ? 'Clears the pile so each team starts with an empty board'
                      : 'Shared board (pile carries over between teams)'}
                  </span>
                </div>
              </div>
              <span
                className={`font-black text-sm px-3 py-1 rounded-xl ${
                  cleanBoardEachTurn
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {cleanBoardEachTurn ? 'FAIR' : 'SHARED'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer with Start CTA */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[52px] px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStart}
            className="flex-1 min-h-[52px] px-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-display font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Classroom Match!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
