import React, { useState, useEffect, useMemo } from 'react';
import {
  getHighScores,
  clearHighScores,
  clearHighScoreSection,
  wordListSectionKey,
  ALL_WORDS_SECTION,
  formatTimeBucketLabel,
  sortTimeBuckets,
  HighScoreEntry,
} from '../utils/highScores';
import { LeaderboardMode } from '../types/game';
import {
  Trophy,
  ArrowLeft,
  Trash2,
  UserPlus,
  Play,
  Sparkles,
  Zap,
  User,
  Users,
  Clock,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface LastSoloResult {
  entryId?: string;
  mode?: LeaderboardMode;
  timeBucket?: string;
  wordList?: string;
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

const MODE_META: Record<
  LeaderboardMode,
  { label: string; icon: React.ReactNode; activeClasses: string }
> = {
  quick: {
    label: 'Quick Play',
    icon: <Zap className="w-3.5 h-3.5" />,
    activeClasses: 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20',
  },
  solo: {
    label: 'Solo Play',
    icon: <User className="w-3.5 h-3.5" />,
    activeClasses: 'bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/20',
  },
  team: {
    label: 'Team Play',
    icon: <Users className="w-3.5 h-3.5" />,
    activeClasses: 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20',
  },
};

const MODE_ORDER: LeaderboardMode[] = ['quick', 'solo', 'team'];

export const HighScoresModal: React.FC<HighScoresModalProps> = ({
  onBack,
  onPlayAgain,
  onStartNextStudent,
  lastResult = null,
}) => {
  const [scores, setScores] = useState<HighScoreEntry[]>(() => getHighScores());
  const [confirmClear, setConfirmClear] = useState<'none' | 'section' | 'all'>('none');

  const availableModes = useMemo(() => {
    const present = new Set<LeaderboardMode>(scores.map((s) => s.mode));
    return MODE_ORDER.filter((m) => present.has(m));
  }, [scores]);

  const [activeMode, setActiveMode] = useState<LeaderboardMode>(() => {
    if (lastResult?.mode && availableModes.includes(lastResult.mode)) {
      return lastResult.mode;
    }
    return availableModes[0] || 'quick';
  });

  // Word list sections within the active mode ("All words" first, then lists A-Z)
  const availableSections = useMemo(() => {
    const labels = new Map<string, string>();
    for (const s of scores) {
      if (s.mode !== activeMode) continue;
      const key = wordListSectionKey(s.wordList);
      if (!labels.has(key)) labels.set(key, s.wordList || 'All words');
    }
    const keys = Array.from(labels.keys()).sort((a, b) => {
      if (a === ALL_WORDS_SECTION) return -1;
      if (b === ALL_WORDS_SECTION) return 1;
      return (labels.get(a) || '').localeCompare(labels.get(b) || '');
    });
    return keys.map((key) => ({ key, label: labels.get(key) || 'All words' }));
  }, [scores, activeMode]);

  const [activeSection, setActiveSection] = useState<string>(() =>
    wordListSectionKey(lastResult?.wordList)
  );

  const activeSectionLabel =
    availableSections.find((sec) => sec.key === activeSection)?.label || 'All words';

  const availableTimeBuckets = useMemo(() => {
    const modeScores = scores.filter(
      (s) => s.mode === activeMode && wordListSectionKey(s.wordList) === activeSection
    );
    const unique = Array.from(new Set<string>(modeScores.map((s) => s.timeBucket)));
    return sortTimeBuckets(unique);
  }, [scores, activeMode, activeSection]);

  const [activeTimeBucket, setActiveTimeBucket] = useState<string>(() => {
    if (lastResult?.timeBucket && availableTimeBuckets.includes(lastResult.timeBucket)) {
      return lastResult.timeBucket;
    }
    return availableTimeBuckets[0] || '';
  });

  // Sync scores and default selections when lastResult updates
  useEffect(() => {
    const fresh = getHighScores();
    setScores(fresh);

    const presentModes = MODE_ORDER.filter((m) => fresh.some((s) => s.mode === m));
    const nextMode =
      lastResult?.mode && presentModes.includes(lastResult.mode)
        ? lastResult.mode
        : presentModes[0] || 'quick';
    setActiveMode(nextMode);

    const nextSection = wordListSectionKey(lastResult?.wordList);
    setActiveSection(nextSection);

    const buckets = sortTimeBuckets(
      Array.from(
        new Set<string>(
          fresh
            .filter((s) => s.mode === nextMode && wordListSectionKey(s.wordList) === nextSection)
            .map((s) => s.timeBucket)
        )
      )
    );
    const nextBucket =
      lastResult?.timeBucket && buckets.includes(lastResult.timeBucket)
        ? lastResult.timeBucket
        : buckets[0] || '';
    setActiveTimeBucket(nextBucket);

    if (lastResult && (lastResult.isNewHighScore || (lastResult.rank > 0 && lastResult.rank <= 3))) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.55 },
      });
    }
  }, [lastResult]);

  // Keep activeMode valid if scores change
  useEffect(() => {
    if (availableModes.length > 0 && !availableModes.includes(activeMode)) {
      setActiveMode(availableModes[0]);
    }
  }, [availableModes, activeMode]);

  // Keep activeSection valid when mode or scores change
  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.some((sec) => sec.key === activeSection)) {
      setActiveSection(availableSections[0].key);
    }
  }, [availableSections, activeSection]);

  // Keep activeTimeBucket valid when activeMode or availableTimeBuckets change
  useEffect(() => {
    if (availableTimeBuckets.length === 0) {
      setActiveTimeBucket('');
    } else if (!availableTimeBuckets.includes(activeTimeBucket)) {
      setActiveTimeBucket(availableTimeBuckets[0]);
    }
  }, [availableTimeBuckets, activeTimeBucket]);

  const filteredScores = useMemo(() => {
    if (!activeTimeBucket) return [];
    return scores
      .filter(
        (s) =>
          s.mode === activeMode &&
          s.timeBucket === activeTimeBucket &&
          wordListSectionKey(s.wordList) === activeSection
      )
      .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
  }, [scores, activeMode, activeTimeBucket, activeSection]);

  const handleClearAll = () => {
    clearHighScores();
    setScores([]);
    setConfirmClear('none');
  };

  const handleClearSection = () => {
    const remaining = clearHighScoreSection(activeMode, activeSection);
    setScores(remaining);
    setConfirmClear('none');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md select-none text-slate-100 overflow-y-auto no-scrollbar animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-white">
                Leaderboard
              </h2>
              <span className="text-xs font-semibold text-amber-400/90 block">
                High Scores by Mode, Word List &amp; Time
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

        {/* Mode Tabs & Time Sub-Tabs (Hidden automatically if no scores exist) */}
        {availableModes.length > 0 && (
          <div className="pt-3.5 space-y-2.5 shrink-0">
            {/* Top Mode Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {availableModes.map((mode) => {
                const meta = MODE_META[mode];
                const isSelected = activeMode === mode;
                const modeCount = scores.filter((s) => s.mode === mode).length;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setActiveMode(mode);
                      setConfirmClear('none');
                    }}
                    className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl border font-display font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? meta.activeClasses
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {meta.icon}
                    <span>{meta.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isSelected ? 'bg-slate-950/25' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {modeCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Word List Section Tabs */}
            {availableSections.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {availableSections.map((sec) => {
                  const isSelected = activeSection === sec.key;
                  const secCount = scores.filter(
                    (s) => s.mode === activeMode && wordListSectionKey(s.wordList) === sec.key
                  ).length;
                  return (
                    <button
                      key={sec.key}
                      type="button"
                      onClick={() => {
                        setActiveSection(sec.key);
                        setConfirmClear('none');
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-400 text-slate-950 border-teal-200 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <BookOpen className="w-3 h-3" />
                      <span className="max-w-[140px] truncate">{sec.label}</span>
                      <span
                        className={`text-[10px] font-mono ${
                          isSelected ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      >
                        ({secCount})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Time Option Sub-Tabs */}
            {availableTimeBuckets.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {availableTimeBuckets.map((bucket) => {
                  const isSelected = activeTimeBucket === bucket;
                  const bucketCount = scores.filter(
                    (s) =>
                      s.mode === activeMode &&
                      s.timeBucket === bucket &&
                      wordListSectionKey(s.wordList) === activeSection
                  ).length;
                  return (
                    <button
                      key={bucket}
                      type="button"
                      onClick={() => setActiveTimeBucket(bucket)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 text-slate-950 border-white shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeBucketLabel(bucket)}</span>
                      <span
                        className={`text-[10px] font-mono ${
                          isSelected ? 'text-slate-700' : 'text-slate-400'
                        }`}
                      >
                        ({bucketCount})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Just-Completed Run Banner (when arriving directly from Solo Play) */}
        {lastResult && (
          <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-slate-900 border-2 border-amber-400/60 flex items-center justify-between gap-3 shrink-0 shadow-lg shadow-amber-500/10">
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
                  {lastResult.timeBucket ? ` · ${formatTimeBucketLabel(lastResult.timeBucket)}` : ''}
                  {` · ${lastResult.wordList || 'All words'}`}
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
                Pick a player or add your name &amp; logo!
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
          {filteredScores.length === 0 ? (
            <div className="py-14 text-center text-slate-500 text-sm space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-400 text-base">No high scores yet</p>
              <p className="text-xs text-slate-500">
                Finish a game to set the first record!
              </p>
            </div>
          ) : (
            filteredScores.map((entry, idx) => {
              const isJustAdded = lastResult?.entryId && entry.id === lastResult.entryId;
              const fallbackName =
                entry.mode === 'team'
                  ? 'Team'
                  : entry.mode === 'solo'
                  ? 'Student'
                  : 'Quick Player';
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
                        <span>{entry.playerName || fallbackName}</span>
                        {isJustAdded && (
                          <span className="text-[10px] font-black uppercase bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-md">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium truncate">
                        Best: <span className="font-mono font-bold text-slate-300">{entry.longestWord}</span> · {entry.totalWords} words
                        {entry.difficulty && (
                          <span className="ml-1.5 capitalize text-slate-500">· {entry.difficulty}</span>
                        )}
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
          {confirmClear !== 'none' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-rose-400 font-bold">
                {confirmClear === 'all'
                  ? 'Delete ALL scores in every section?'
                  : `Delete all ${MODE_META[activeMode].label} scores for "${activeSectionLabel}"?`}
              </span>
              <button
                type="button"
                onClick={confirmClear === 'all' ? handleClearAll : handleClearSection}
                className="px-3 py-1.5 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
              >
                Yes, delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear('none')}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : scores.length > 0 ? (
            <div className="flex flex-col items-start gap-1">
              {availableSections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClear('section')}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer py-0.5"
                  title="Reset only this section of the leaderboard"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="max-w-[170px] truncate">Reset "{activeSectionLabel}"</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmClear('all')}
                className="text-[11px] font-semibold text-slate-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer py-0.5"
                title="Reset every leaderboard section"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset all</span>
              </button>
            </div>
          ) : (
            <div />
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
