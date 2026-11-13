import React, { useState, useMemo } from 'react';
import { X, BookOpen, Star, Flame, Hash, Check } from 'lucide-react';
import { WordEntry } from '../types/game';
import { getSpellingProgress } from '../utils/spellingProgress';
import { getUiPrefs } from '../utils/savedSpellingLists';

interface WordHistoryModalProps {
  wordEntries: WordEntry[];
  onClose: () => void;
  spellingWords?: string[];
}

type SortOption = 'recent' | 'score' | 'length' | 'alpha';

export const WordHistoryModal: React.FC<WordHistoryModalProps> = ({
  wordEntries,
  onClose,
  spellingWords,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const uiPrefs = useMemo(() => getUiPrefs(), []);

  // Compute spelling progress checklist if spellingWords provided
  const spellingProgress = useMemo(() => {
    if (!spellingWords || spellingWords.length === 0) return null;
    return getSpellingProgress(wordEntries, spellingWords);
  }, [wordEntries, spellingWords]);

  const totalPoints = useMemo(
    () => wordEntries.reduce((sum, entry) => sum + entry.score, 0),
    [wordEntries]
  );

  const longestWord = useMemo(() => {
    if (wordEntries.length === 0) return '-';
    return wordEntries.reduce(
      (best, entry) => (entry.word.length > best.length ? entry.word : best),
      ''
    );
  }, [wordEntries]);

  // Unique words with repeat count
  const uniqueWordsMap = useMemo(() => {
    const map = new Map<string, { entry: WordEntry; count: number }>();
    for (const entry of wordEntries) {
      const upper = entry.word.toUpperCase();
      const existing = map.get(upper);
      if (existing) {
        existing.count += 1;
        existing.entry = entry; // keep latest
      } else {
        map.set(upper, { entry, count: 1 });
      }
    }
    return map;
  }, [wordEntries]);

  const sortedList = useMemo(() => {
    const list = Array.from(uniqueWordsMap.values());
    if (sortBy === 'recent') {
      return list.reverse();
    }
    if (sortBy === 'score') {
      return list.sort((a, b) => b.entry.score - a.entry.score);
    }
    if (sortBy === 'length') {
      return list.sort((a, b) => b.entry.length - a.entry.length);
    }
    if (sortBy === 'alpha') {
      return list.sort((a, b) => a.entry.word.localeCompare(b.entry.word));
    }
    return list;
  }, [uniqueWordsMap, sortBy]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm select-none animate-fade-in">
      <div className="w-full max-w-lg max-h-[92vh] bg-white border-4 border-amber-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-amber-200 flex items-center justify-between bg-amber-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 leading-tight">
                📖 My Words
              </h2>
              <p className="text-sm font-medium text-slate-600">
                {wordEntries.length} {wordEntries.length === 1 ? 'word' : 'words'} found this game
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-white hover:bg-slate-100 border-2 border-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
            aria-label="Close word history"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-left">
          {/* SPELLING CHECKLIST SECTION */}
          {spellingProgress && spellingWords && (
            <div className="bg-teal-50 border-2 border-teal-300 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-base text-teal-950">
                  Spelling checklist: {spellingProgress.foundCount} of {spellingProgress.totalCount}
                </span>
                {spellingProgress.allFound && (
                  <span className="text-sm font-black text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full">
                    All found! 🎉
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {spellingWords.map((word) => {
                  const upper = word.toUpperCase();
                  const isFound = spellingProgress.foundWords.includes(upper);

                  let displayText = upper;
                  if (!isFound && !uiPrefs.showSpellingList) {
                    displayText = upper
                      .split('')
                      .map(() => '_')
                      .join(' ');
                  }

                  return (
                    <span
                      key={word}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold font-mono transition-all ${
                        isFound
                          ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-950'
                          : 'bg-white border-2 border-slate-300 text-slate-700'
                      }`}
                    >
                      {isFound && <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />}
                      <span>{displayText}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUICK STATS CARDS */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3">
              <span className="text-xs uppercase font-bold text-slate-500 flex items-center justify-center gap-1">
                <Hash className="w-3.5 h-3.5 text-amber-600" /> Words found
              </span>
              <span className="text-lg sm:text-xl font-display font-black text-amber-950 mt-0.5 block">
                {wordEntries.length}
              </span>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3">
              <span className="text-xs uppercase font-bold text-slate-500 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> Points
              </span>
              <span className="text-lg sm:text-xl font-display font-black text-amber-950 mt-0.5 block">
                {totalPoints.toLocaleString()}
              </span>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3">
              <span className="text-xs uppercase font-bold text-slate-500 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" /> Longest word
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-0.5 block truncate">
                {longestWord}
              </span>
            </div>
          </div>

          {/* SORT CONTROLS (min 48px buttons) */}
          {wordEntries.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1.5">
                Sort words by:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'recent' as const, label: 'Newest' },
                  { id: 'score' as const, label: 'Most points' },
                  { id: 'length' as const, label: 'Longest' },
                  { id: 'alpha' as const, label: 'A-Z' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSortBy(s.id)}
                    className={`min-h-[48px] px-2 rounded-xl font-bold text-sm border-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 ${
                      sortBy === s.id
                        ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* WORDS LIST */}
          <div className="space-y-2">
            <span className="text-base font-display font-black text-slate-900 block">
              Words I found
            </span>

            {wordEntries.length === 0 ? (
              <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-6">
                <BookOpen className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-50" />
                <p className="text-base font-bold text-slate-700">
                  No words yet. Tap letters and press GO!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
                {sortedList.map(({ entry, count }) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-black text-lg text-slate-900 uppercase tracking-wide truncate">
                        {entry.word}
                      </span>
                      {count > 1 && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-200 text-amber-950 font-black text-xs font-mono">
                          ×{count}
                        </span>
                      )}
                      <span className="text-sm font-medium text-slate-500 shrink-0">
                        ({entry.length} letters)
                      </span>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-950 font-black text-sm font-mono shrink-0">
                      +{entry.score.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t-2 border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[56px] px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-display font-black text-base shadow-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
