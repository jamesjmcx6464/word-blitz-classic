import React, { useState } from 'react';
import {
  User,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  Edit3,
  Check,
  Plus,
  Trash2,
  Clock,
  Target,
  RotateCcw,
  Palette,
} from 'lucide-react';
import { ClassroomConfig, ClassroomTeam, TurnConditionType } from '../types/game';
import {
  TEAM_COLOR_PALETTES,
  TEAM_NAME_PRESETS,
  createDefaultTeam,
  saveClassroomConfig,
  loadClassroomConfig,
} from '../utils/classroomStorage';

interface PlayNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchSoloAllWords: () => void;
  onLaunchSoloWordList: () => void;
  onLaunchTeamMatch: (config: ClassroomConfig) => void;
  onOpenWordListSetup: () => void;
  wordListCount: number;
  wordListPreview?: string[];
  isWide: boolean;
  initialStep?: 'mode' | 'team_setup' | 'words';
  initialMode?: 'solo' | 'team';
}

export const PlayNowModal: React.FC<PlayNowModalProps> = ({
  isOpen,
  onClose,
  onLaunchSoloAllWords,
  onLaunchSoloWordList,
  onLaunchTeamMatch,
  onOpenWordListSetup,
  wordListCount,
  wordListPreview: _wordListPreview = [],
  isWide,
  initialStep = 'team_setup',
  initialMode = 'team',
}) => {
  // Step navigation:
  // For Solo: 'mode' -> 'words'
  // For Team: 'mode' -> 'team_setup' -> 'words'
  const [step, setStep] = useState<'mode' | 'team_setup' | 'words'>(initialStep);
  const [selectedMode, setSelectedMode] = useState<'solo' | 'team'>(initialMode);
  const [selectedWordSource, setSelectedWordSource] = useState<'all' | 'word_list'>('all');

  React.useEffect(() => {
    if (isOpen) {
      if (initialStep) setStep(initialStep);
      if (initialMode) setSelectedMode(initialMode);
    }
  }, [isOpen, initialStep, initialMode]);

  // Classroom team settings state (persisted via loadClassroomConfig)
  const [classroomConfig, setClassroomConfig] = useState<ClassroomConfig>(() => loadClassroomConfig());
  const [teams, setTeams] = useState<ClassroomTeam[]>(() => classroomConfig.teams);
  const [turnCondition, setTurnCondition] = useState<TurnConditionType>(() => classroomConfig.turnCondition);
  const [turnSeconds, setTurnSeconds] = useState<number>(() => classroomConfig.turnSeconds);
  const [turnWordsTarget, setTurnWordsTarget] = useState<number>(() => classroomConfig.turnWordsTarget);
  const [totalRounds, setTotalRounds] = useState<number>(() => classroomConfig.totalRounds);
  const [cleanBoardEachTurn, setCleanBoardEachTurn] = useState<boolean>(() => classroomConfig.cleanBoardEachTurn);
  const [activeTheme, setActiveTheme] = useState<'animals' | 'colors' | 'space' | 'all'>('animals');

  if (!isOpen) return null;

  const handleSelectSolo = () => {
    setSelectedMode('solo');
    setStep('words');
  };

  const handleSelectTeam = () => {
    setSelectedMode('team');
    setStep('team_setup');
  };

  const handleProceedFromTeamSetup = () => {
    // Save updated team config before moving to word selection
    const updatedConfig: ClassroomConfig = {
      ...classroomConfig,
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
      cleanBoardEachTurn,
    };
    setClassroomConfig(updatedConfig);
    saveClassroomConfig(updatedConfig);
    setStep('words');
  };

  const handleBack = () => {
    if (step === initialStep) {
      onClose();
      return;
    }
    if (step === 'team_setup') {
      setStep('mode');
    } else if (step === 'words') {
      if (selectedMode === 'team') {
        setStep('team_setup');
      } else {
        setStep('mode');
      }
    }
  };

  const handleLaunch = () => {
    if (selectedMode === 'solo') {
      if (selectedWordSource === 'all') {
        onLaunchSoloAllWords();
      } else {
        if (wordListCount === 0) {
          onOpenWordListSetup();
        } else {
          onLaunchSoloWordList();
        }
      }
    } else {
      // Team Match
      const finalConfig: ClassroomConfig = {
        ...classroomConfig,
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
        cleanBoardEachTurn,
        useSpellingList: selectedWordSource === 'word_list' && wordListCount > 0,
      };
      saveClassroomConfig(finalConfig);
      onLaunchTeamMatch(finalConfig);
    }
  };

  // Team editor handlers
  const handleApplyPreset = (presetType: 'animals' | 'colors' | 'space' | 'all') => {
    setActiveTheme(presetType);
    if (presetType === 'all') {
      // Keep existing teams or assign from all presets
      return;
    }
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
      // 'all'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md select-none text-slate-100 overflow-y-auto no-scrollbar animate-fade-in">
      <div
        className={`w-full ${
          isWide ? (step === 'team_setup' ? 'max-w-3xl' : 'max-w-2xl') : 'max-w-lg'
        } max-h-[94vh] bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {step !== 'mode' && (
              <button
                type="button"
                onClick={handleBack}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <span>Play Now</span>
                {step === 'team_setup' && (
                  <>
                    <span>›</span>
                    <span>Teams</span>
                  </>
                )}
                {step === 'words' && (
                  <>
                    <span>›</span>
                    <span>Words</span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-white leading-tight">
                {step === 'mode' && 'Play Now'}
                {step === 'team_setup' && 'Organize Teams'}
                {step === 'words' && 'Word Selection'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto no-scrollbar flex-1">
          {/* STEP 1: Solo Play vs Team Play */}
          {step === 'mode' && (
            <div className="space-y-4">
              <div className={`grid ${isWide ? 'grid-cols-2 gap-4' : 'grid-cols-1 gap-3'}`}>
                {/* Option 1: Solo Play */}
                <button
                  type="button"
                  onClick={handleSelectSolo}
                  className="w-full p-5 rounded-3xl bg-slate-800/90 hover:bg-slate-800 border-2 border-amber-500/50 hover:border-amber-400 text-left transition-all cursor-pointer shadow-lg hover:shadow-amber-500/10 group flex flex-col justify-between min-h-[140px]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                      <User className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="font-display font-black text-2xl text-white block">
                        Solo Play
                      </span>
                      <span className="text-sm font-semibold text-amber-400/90 block mt-0.5">
                        1 Player
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 pt-3 border-t border-slate-700/60 mt-4">
                    <span>Next: Choose Words</span>
                    <span className="text-base group-hover:translate-x-1 transition-transform">➔</span>
                  </div>
                </button>

                {/* Option 2: Team Play */}
                <button
                  type="button"
                  onClick={handleSelectTeam}
                  className="w-full p-5 rounded-3xl bg-slate-800/90 hover:bg-slate-800 border-2 border-indigo-500/50 hover:border-indigo-400 text-left transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10 group flex flex-col justify-between min-h-[140px]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="font-display font-black text-2xl text-white block">
                        Team Play
                      </span>
                      <span className="text-sm font-semibold text-indigo-300/90 block mt-0.5">
                        2 to 6 Teams · Rotations
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-indigo-300 pt-3 border-t border-slate-700/60 mt-4">
                    <span>Next: Organize Teams</span>
                    <span className="text-base group-hover:translate-x-1 transition-transform">➔</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 (Team Play Only): Organize Teams */}
          {step === 'team_setup' && (
            <div className="space-y-5">
              {/* Teams & Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-display font-black text-sm uppercase tracking-wider text-slate-300">
                    Teams ({teams.length} of 6)
                  </span>

                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('animals')}
                      className={`px-2.5 py-1 rounded-xl border font-bold transition-all cursor-pointer active:scale-95 ${
                        activeTheme === 'animals'
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-black'
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
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-black'
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
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-black'
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
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-black'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      ✨ All
                    </button>
                  </div>
                </div>

                {/* Team Cards Grid */}
                <div className={`grid ${isWide ? 'grid-cols-2 gap-2.5' : 'grid-cols-1 gap-2.5'}`}>
                  {teams.map((team, idx) => (
                    <div
                      key={team.id || idx}
                      className="p-3 rounded-2xl bg-slate-800/80 border-2 flex items-center gap-3 transition-all"
                      style={{ borderColor: team.color }}
                    >
                      <button
                        type="button"
                        onClick={() => handleCycleEmoji(idx)}
                        title="Tap to change emoji"
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0"
                        style={{ backgroundColor: `${team.color}30` }}
                      >
                        {team.emoji}
                      </button>

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={team.name}
                          maxLength={18}
                          onChange={(e) => handleUpdateTeamName(idx, e.target.value)}
                          placeholder={`Team ${idx + 1}`}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCycleColor(idx)}
                        title="Cycle color"
                        className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-90 shrink-0 border border-white/40"
                        style={{ backgroundColor: team.color }}
                      >
                        <Palette className="w-3.5 h-3.5 text-white drop-shadow" />
                      </button>

                      {teams.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTeam(idx)}
                          title="Remove team"
                          className="w-8 h-8 rounded-xl bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {teams.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddTeam}
                    className="w-full min-h-[44px] py-2 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-400 text-slate-400 hover:text-indigo-300 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ Add Team</span>
                  </button>
                )}
              </div>

              {/* Turn Rules */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <span className="font-display font-black text-sm uppercase tracking-wider text-slate-300 block">
                  Turn Rules
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTurnCondition('timer')}
                    className={`min-h-[46px] px-3 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      turnCondition === 'timer'
                        ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 font-black'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>⏱️ Timer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTurnCondition('words')}
                    className={`min-h-[46px] px-3 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      turnCondition === 'words'
                        ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 font-black'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    <span>🎯 Words Goal</span>
                  </button>
                </div>

                {turnCondition === 'timer' ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[30, 45, 60, 90].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setTurnSeconds(sec)}
                        className={`min-h-[40px] rounded-xl font-bold text-sm transition-all cursor-pointer ${
                          turnSeconds === sec
                            ? 'bg-indigo-500 text-white font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 5].map((words) => (
                      <button
                        key={words}
                        type="button"
                        onClick={() => setTurnWordsTarget(words)}
                        className={`min-h-[40px] rounded-xl font-bold text-sm transition-all cursor-pointer ${
                          turnWordsTarget === words
                            ? 'bg-indigo-500 text-white font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {words} {words === 1 ? 'word' : 'words'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Match Length (Rounds) */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <span className="font-display font-black text-sm uppercase tracking-wider text-slate-300 block">
                  Match Length
                </span>
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
                      className={`min-h-[40px] rounded-xl font-bold text-sm transition-all cursor-pointer ${
                        totalRounds === round.val
                          ? 'bg-indigo-500 text-white font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {round.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Board Clean Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCleanBoardEachTurn(!cleanBoardEachTurn)}
                  className={`w-full min-h-[48px] px-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                    cleanBoardEachTurn
                      ? 'bg-indigo-500/20 border-indigo-400 text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-bold text-sm">Fresh board each turn</span>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-indigo-500 text-white">
                    {cleanBoardEachTurn ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Next Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleProceedFromTeamSetup}
                  className="w-full min-h-[56px] px-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-display font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Next: Word Selection</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Word Selection (All Words vs Word List) */}
          {step === 'words' && (
            <div className="space-y-4">
              {/* Header Mode Indicator */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  {selectedMode === 'solo' ? (
                    <User className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Users className="w-4 h-4 text-indigo-400" />
                  )}
                  <span className="text-slate-400 font-medium">Mode:</span>
                  <strong className="text-white">
                    {selectedMode === 'solo' ? 'Solo Play' : `Team Play (${teams.length} Teams)`}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(selectedMode === 'team' ? 'team_setup' : 'mode')}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Cards for All Words vs Word List */}
              <div className={`grid ${isWide ? 'grid-cols-2 gap-4' : 'grid-cols-1 gap-3'}`}>
                {/* Option A: All Words */}
                <div
                  onClick={() => setSelectedWordSource('all')}
                  className={`p-5 rounded-3xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[140px] ${
                    selectedWordSource === 'all'
                      ? 'bg-amber-500/10 border-amber-400 shadow-xl shadow-amber-500/15'
                      : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      {selectedWordSource === 'all' && (
                        <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <span className="font-display font-black text-2xl text-white block">
                      All Words
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-amber-400 font-mono mt-3">
                    Full dictionary
                  </span>
                </div>

                {/* Option B: Word List */}
                <div
                  onClick={() => setSelectedWordSource('word_list')}
                  className={`p-5 rounded-3xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[140px] ${
                    selectedWordSource === 'word_list'
                      ? 'bg-teal-500/10 border-teal-400 shadow-xl shadow-teal-500/15'
                      : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      {selectedWordSource === 'word_list' && (
                        <div className="w-6 h-6 rounded-full bg-teal-400 text-teal-950 flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-black text-2xl text-white block">
                        Word List
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenWordListSetup();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-400/50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit words</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-teal-300 mt-3 pt-2 border-t border-slate-700/60">
                    <span>
                      {wordListCount > 0
                        ? `${wordListCount} ${wordListCount === 1 ? 'word' : 'words'} loaded`
                        : 'No words entered yet'}
                    </span>
                    {wordListCount === 0 && (
                      <span className="text-amber-400 font-bold">Tap Edit to add</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Start Game Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLaunch}
                  className={`w-full min-h-[56px] sm:min-h-[64px] px-6 rounded-2xl font-display font-black text-lg sm:text-xl flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer active:scale-[0.98] ${
                    selectedMode === 'solo'
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/25'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>
                    {selectedMode === 'solo' ? 'Start Game!' : 'Start Team Match!'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
