import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Trash2,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import { FreePlaySettings } from '../types/game';
import { analyzeSpellingInput } from '../utils/spellingProgress';
import {
  loadSavedLists,
  saveList,
  deleteList,
  restoreList,
  getUiPrefs,
  setUiPrefs,
  SavedSpellingList,
} from '../utils/savedSpellingLists';
import { GameOptionsPanel } from './GameOptionsPanel';

interface SpellingListSetupProps {
  settings: FreePlaySettings;
  onUpdateSettings: (next: FreePlaySettings) => void;
  onStart: () => void;
  onClose: () => void;
  isWide: boolean;
}

const READY_MADE_LISTS = [
  {
    name: '1st-2nd Grade',
    words: 'CAT, DOG, BIRD, FISH, TREE, BOOK, STAR, PLAY, MOON, SUN',
  },
  {
    name: '3rd-4th Grade',
    words: 'FRIEND, SCHOOL, PLANET, BRIDGE, FOREST, CASTLE, GARDEN, SILVER',
  },
  {
    name: '5th-6th Grade',
    words: 'CHALLENGE, DISCOVER, ADVENTURE, ELEPHANT, JOURNEY, MYSTERY, VICTORY',
  },
  {
    name: 'Animals',
    words: 'ZEBRA, TIGER, MONKEY, PENGUIN, DOLPHIN, RABBIT, PANDA, GIRAFFE',
  },
  {
    name: 'Sight Words',
    words: 'THE, AND, WAS, FOR, ARE, BUT, SAID, HAVE, THEY, WHAT',
  },
  {
    name: 'Weather',
    words: 'RAIN, SNOW, WIND, CLOUD, STORM, SUNNY, FOGGY, THUNDER',
  },
  {
    name: 'Space',
    words: 'MOON, STAR, PLANET, ROCKET, COMET, EARTH, SOLAR, ORBIT',
  },
  {
    name: 'Food',
    words: 'APPLE, BREAD, PIZZA, CHEESE, BANANA, COOKIE, SALAD, PASTA',
  },
];

export const SpellingListSetup: React.FC<SpellingListSetupProps> = ({
  settings,
  onUpdateSettings,
  onStart,
  onClose,
  isWide,
}) => {
  const [rawText, setRawText] = useState<string>(settings.spellingWordsList || '');
  const [savedLists, setSavedLists] = useState<SavedSpellingList[]>(() => loadSavedLists());
  const [uiPrefsState, setUiPrefsState] = useState(() => getUiPrefs());
  const [listNameInput, setListNameInput] = useState<string>(() => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `Week of ${today}`;
  });
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);

  // Undo Toast state
  const [undoToast, setUndoToast] = useState<{
    message: string;
    action: () => void;
  } | null>(null);

  // Analysis
  const analysis = useMemo(() => analyzeSpellingInput(rawText), [rawText]);
  const validWordCount = analysis.words.length;

  // Auto-sync settings on text or setting change
  const syncSettings = (updatedText: string, updatedSettings?: Partial<FreePlaySettings>) => {
    setRawText(updatedText);
    onUpdateSettings({
      ...settings,
      ...(updatedSettings || {}),
      spellingWordsList: updatedText,
      spellingWordsEnabled: true,
    });
  };

  // Toast auto-dismiss after 8 seconds
  useEffect(() => {
    if (!undoToast) return;
    const timer = setTimeout(() => {
      setUndoToast(null), 8000;
    });
    return () => clearTimeout(timer);
  }, [undoToast]);

  const handleRemoveWord = (wordToRemove: string) => {
    const remaining = analysis.words.filter(
      (w) => w.toUpperCase() !== wordToRemove.toUpperCase()
    );
    const newText = remaining.join('\n');
    syncSettings(newText);
  };

  const handleStartOver = () => {
    const previous = rawText;
    syncSettings('');
    setUndoToast({
      message: 'List cleared.',
      action: () => {
        syncSettings(previous);
        setUndoToast(null);
      },
    });
  };

  const handleSaveCurrentList = () => {
    if (!rawText.trim()) return;
    const updated = saveList(listNameInput, rawText);
    setSavedLists(updated);
  };

  const handleDeleteSavedList = (list: SavedSpellingList, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = deleteList(list.id);
    setSavedLists(result.remaining);
    if (result.deleted) {
      const deletedItem = result.deleted;
      setUndoToast({
        message: `Deleted "${deletedItem.name}".`,
        action: () => {
          const restored = restoreList(deletedItem);
          setSavedLists(restored);
          setUndoToast(null);
        },
      });
    }
  };

  const handleApplyPresetWords = (presetWords: string, mode: 'add' | 'replace') => {
    if (mode === 'replace' || !rawText.trim()) {
      syncSettings(presetWords);
    } else {
      const combined = `${rawText.trim()}\n${presetWords}`;
      syncSettings(combined);
    }
    setActivePresetIndex(null);
  };

  const handleToggleShowListDuringPlay = () => {
    const nextVal = !uiPrefsState.showSpellingList;
    const updated = setUiPrefs({ showSpellingList: nextVal });
    setUiPrefsState(updated);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 select-none">
      <div
        className={`w-full ${
          isWide ? 'max-w-4xl max-h-[94vh]' : 'min-h-full sm:min-h-0 sm:max-h-[94vh]'
        } bg-gradient-to-b from-sky-50 via-amber-50 to-amber-100 sm:rounded-3xl border-0 sm:border-4 border-amber-300 shadow-2xl flex flex-col text-slate-800 overflow-hidden`}
      >
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-md border-b-2 border-amber-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[56px] px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 font-display font-black text-base flex items-center gap-2 cursor-pointer transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500 fill-amber-400" />
              <span>Word List</span>
            </h1>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[56px] px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-display font-black text-base flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Done</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-left">
          {/* SECTION 1: Textarea */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-amber-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-lg font-display font-black text-slate-900">
                Type or paste your words
              </label>
              {rawText.trim() && (
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="min-h-[48px] px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-sm font-bold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Start over</span>
                </button>
              )}
            </div>

            <p className="text-sm text-slate-600">
              Put each word on its own line or use commas.
            </p>

            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => syncSettings(e.target.value)}
              placeholder={'APPLE\nBANANA\nCHERRY'}
              className="w-full p-4 text-lg font-mono font-bold bg-amber-50/50 border-2 border-amber-300 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-400 resize-y leading-relaxed"
            />
          </div>

          {/* SECTION 2: Words Ready & Notes */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-teal-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-black text-teal-900 flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-600 stroke-[3]" />
                <span>
                  {validWordCount} {validWordCount === 1 ? 'word' : 'words'} ready
                </span>
              </h2>
            </div>

            {/* Notes strip if any */}
            {analysis.notes.length > 0 && (
              <div className="bg-amber-100 border-2 border-amber-300 rounded-2xl p-3 text-amber-900 text-sm font-medium space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Info className="w-4 h-4 text-amber-700" />
                  <span>Helpful notes:</span>
                </div>
                {analysis.notes.map((note, idx) => (
                  <p key={idx} className="leading-snug">
                    • {note}
                  </p>
                ))}
              </div>
            )}

            {/* Word Chips */}
            {validWordCount > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                {analysis.words.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-2 pl-3.5 pr-1 py-1 rounded-2xl bg-teal-50 border-2 border-teal-300 text-teal-950 text-base font-bold font-mono uppercase shadow-sm"
                  >
                    <span>{word}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWord(word)}
                      className="w-10 h-10 rounded-xl hover:bg-teal-200 text-teal-700 hover:text-teal-950 flex items-center justify-center transition-colors cursor-pointer"
                      title={`Remove ${word}`}
                      aria-label={`Remove word ${word}`}
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-500 py-2">
                Type or pick words below to build your list.
              </p>
            )}
          </div>

          {/* SECTION 3: Ready-Made Lists */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-slate-200 shadow-sm space-y-3">
            <h2 className="text-lg font-display font-black text-slate-900">
              Ready-made lists
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {READY_MADE_LISTS.map((preset, idx) => {
                const isSelectedForAction = activePresetIndex === idx;
                return (
                  <div
                    key={preset.name}
                    className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 transition-all text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-display font-bold text-base text-slate-900">
                          {preset.name}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {preset.words.split(',').length} words
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 font-mono">
                        {preset.words}
                      </p>
                    </div>

                    {/* Inline actions */}
                    {rawText.trim() ? (
                      isSelectedForAction ? (
                        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApplyPresetWords(preset.words, 'add')}
                            className="flex-1 min-h-[48px] px-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold text-sm transition-all cursor-pointer"
                          >
                            Add to my list
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPresetWords(preset.words, 'replace')}
                            className="flex-1 min-h-[48px] px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm transition-all cursor-pointer"
                          >
                            Replace my list
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePresetIndex(null)}
                            className="w-12 min-h-[48px] rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                            aria-label="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActivePresetIndex(idx)}
                          className="mt-3 min-h-[48px] w-full px-3 rounded-xl bg-white hover:bg-amber-100 border border-slate-300 text-slate-800 font-bold text-sm transition-all cursor-pointer"
                        >
                          Use this list
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyPresetWords(preset.words, 'replace')}
                        className="mt-3 min-h-[48px] w-full px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm transition-all cursor-pointer"
                      >
                        Load words
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: How Hard (3 difficulty presets only) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-slate-200 shadow-sm space-y-3">
            <h2 className="text-lg font-display font-black text-slate-900">
              How tricky?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'relaxed' as const,
                  label: '🎈 Relaxed',
                  desc: 'Slow letters, big tiles, lots of room',
                  active:
                    settings.dropSpeed === 170 &&
                    settings.tileRadius === 34 &&
                    settings.ceilingHeight === 50 &&
                    settings.wallWidthPct === 100 &&
                    !settings.speedIncreaseEnabled,
                  color: 'emerald',
                },
                {
                  id: 'just_right' as const,
                  label: '⭐ Just right',
                  desc: 'The normal, friendly game',
                  active:
                    settings.dropSpeed === 260 &&
                    settings.tileRadius === 28 &&
                    settings.ceilingHeight === 85 &&
                    settings.wallWidthPct === 100 &&
                    !settings.speedIncreaseEnabled,
                  color: 'amber',
                },
                {
                  id: 'challenge' as const,
                  label: '⚡ Challenge',
                  desc: 'Faster letters that speed up',
                  active:
                    settings.dropSpeed === 340 &&
                    settings.tileRadius === 28 &&
                    settings.ceilingHeight === 120 &&
                    settings.wallWidthPct === 100 &&
                    settings.speedIncreaseEnabled,
                  color: 'rose',
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'relaxed') {
                      onUpdateSettings({
                        ...settings,
                        dropSpeed: 170,
                        tileRadius: 34,
                        ceilingHeight: 50,
                        wallWidthPct: 100,
                        speedIncreaseEnabled: false,
                      });
                    } else if (item.id === 'just_right') {
                      onUpdateSettings({
                        ...settings,
                        dropSpeed: 260,
                        tileRadius: 28,
                        ceilingHeight: 85,
                        wallWidthPct: 100,
                        speedIncreaseEnabled: false,
                      });
                    } else {
                      onUpdateSettings({
                        ...settings,
                        dropSpeed: 340,
                        tileRadius: 28,
                        ceilingHeight: 120,
                        wallWidthPct: 100,
                        speedIncreaseEnabled: true,
                        speedIncreaseRate: 10,
                      });
                    }
                  }}
                  className={`min-h-[56px] p-3 rounded-2xl border-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 ${
                    item.active
                      ? 'bg-amber-100 border-amber-500 shadow-md ring-2 ring-amber-300'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base font-display font-black text-slate-900">
                    {item.label}
                  </span>
                  <span className="text-sm text-slate-600 font-medium leading-tight mt-0.5">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 5: How Long? */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-slate-200 shadow-sm space-y-3">
            <h2 className="text-lg font-display font-black text-slate-900">
              How long?
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'No timer', sec: 0 },
                { label: '2 min', sec: 120 },
                { label: '5 min', sec: 300 },
                { label: '10 min', sec: 600 },
              ].map((item) => {
                const active = settings.timeLimit === item.sec;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, timeLimit: item.sec })}
                    className={`min-h-[56px] px-3 py-2 rounded-2xl border-4 font-bold text-base flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 ${
                      active
                        ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {active && <Check className="w-4 h-4 text-amber-950 stroke-[3]" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 6: Show my list while I play (Toggle) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-slate-200 shadow-sm flex items-center justify-between gap-4">
            <div>
              <label className="text-lg font-display font-black text-slate-900 block">
                Show my list while I play
              </label>
              <p className="text-sm text-slate-600 mt-0.5">
                Turn off for a spelling test. Words you have not found show as blanks.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleShowListDuringPlay}
              className={`w-16 h-9 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 ${
                uiPrefsState.showSpellingList ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
              aria-label="Toggle show list while playing"
            >
              <div
                className={`w-7 h-7 rounded-full bg-white shadow-md transform transition-transform ${
                  uiPrefsState.showSpellingList ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* SECTION 7: Save this list & Saved lists */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-display font-black text-slate-900">
              Save this list
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={listNameInput}
                onChange={(e) => setListNameInput(e.target.value)}
                placeholder="List name, e.g. Week of Oct 25"
                className="w-full sm:flex-1 min-h-[56px] px-4 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={handleSaveCurrentList}
                disabled={!rawText.trim()}
                className={`w-full sm:w-auto min-h-[56px] px-6 rounded-2xl font-display font-black text-base flex items-center justify-center gap-2 transition-all ${
                  rawText.trim()
                    ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-md cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Bookmark className="w-5 h-5" />
                <span>Save List</span>
              </button>
            </div>

            {/* Saved lists chips */}
            {savedLists.length > 0 && (
              <div className="pt-2">
                <span className="text-sm font-bold text-slate-700 block mb-2">
                  My saved lists ({savedLists.length} of 10):
                </span>
                <div className="flex flex-wrap gap-2">
                  {savedLists.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        syncSettings(item.words);
                        setListNameInput(item.name);
                      }}
                      className="group inline-flex items-center gap-2 pl-3.5 pr-1 py-1 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 text-sm font-bold cursor-pointer transition-all shadow-sm"
                    >
                      <span>
                        {item.name} ({item.words.split(/[\n,;]+/).filter(Boolean).length})
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedList(item, e)}
                        className="w-8 h-8 rounded-xl hover:bg-rose-100 text-slate-500 hover:text-rose-700 flex items-center justify-center transition-colors cursor-pointer"
                        title={`Delete ${item.name}`}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 8: More Options Accordion */}
          <div className="bg-white rounded-3xl border-4 border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="w-full min-h-[56px] px-5 py-3 flex items-center justify-between text-left font-display font-extrabold text-base text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
            >
              <span>More options</span>
              {showMoreOptions ? (
                <ChevronUp className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {showMoreOptions && (
              <div className="p-4 sm:p-5 border-t-2 border-slate-200">
                <GameOptionsPanel
                  settings={settings}
                  onChange={(next) => onUpdateSettings(next)}
                  compact={true}
                  showTimer={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Undo Toast */}
        {undoToast && (
          <div className="p-3 bg-slate-900 text-white rounded-2xl mx-4 mb-2 shadow-xl flex items-center justify-between gap-3 animate-fade-in shrink-0">
            <span className="text-sm font-medium">{undoToast.message}</span>
            <button
              type="button"
              onClick={undoToast.action}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-amber-950 font-bold text-sm hover:bg-amber-300 transition-colors cursor-pointer"
            >
              Undo
            </button>
          </div>
        )}

        {/* Sticky Footer */}
        <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-md border-t-2 border-amber-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[64px] px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 font-display font-black text-base text-slate-800 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
            <span>Return</span>
          </button>

          <button
            type="button"
            disabled={validWordCount === 0}
            onClick={onClose}
            className={`flex-1 sm:flex-initial min-h-[64px] px-8 rounded-2xl font-display font-black text-lg flex items-center justify-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 ${
              validWordCount > 0
                ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-xl shadow-emerald-500/30 active:scale-95 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Done &amp; Return</span>
          </button>
        </div>
      </div>
    </div>
  );
};
