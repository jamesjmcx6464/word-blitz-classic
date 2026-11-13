import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  ArrowLeft,
  X,
  Play,
  Check,
  Lock,
  BookOpen,
  Edit3,
  Clock,
} from 'lucide-react';
import { STUDENT_LOGOS } from '../data/studentLogos';
import { getClaimedLogos } from '../utils/highScores';

interface SoloPlayerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSolo: (
    playerName: string,
    playerLogo: string,
    useWordList: boolean,
    roundSeconds: number
  ) => void;
  onOpenWordListSetup: () => void;
  wordListCount: number;
  isWide: boolean;
}

export const SoloPlayerSetupModal: React.FC<SoloPlayerSetupModalProps> = ({
  isOpen,
  onClose,
  onStartSolo,
  onOpenWordListSetup,
  wordListCount,
  isWide,
}) => {
  const [playerName, setPlayerName] = useState<string>('');
  const [selectedLogo, setSelectedLogo] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'animals' | 'space' | 'sports' | 'gems'
  >('all');
  const [useWordList, setUseWordList] = useState<boolean>(false);
  const [roundSeconds, setRoundSeconds] = useState<number>(60);

  // Reset name and logo whenever opened for a new student
  useEffect(() => {
    if (isOpen) {
      setPlayerName('');
      setSelectedLogo('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Read currently claimed logos from leaderboard
  const claimedMap = useMemo(() => {
    return getClaimedLogos();
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter logos by category
  const filteredLogos =
    selectedCategory === 'all'
      ? STUDENT_LOGOS
      : STUDENT_LOGOS.filter((l) => l.category === selectedCategory);

  const isFormValid = playerName.trim().length > 0 && selectedLogo.length > 0;

  const handleLaunch = () => {
    if (!isFormValid) return;
    onStartSolo(playerName.trim(), selectedLogo, useWordList && wordListCount > 0, roundSeconds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md select-none text-slate-100 overflow-y-auto no-scrollbar animate-fade-in">
      <div
        className={`w-full ${
          isWide ? 'max-w-2xl' : 'max-w-lg'
        } max-h-[94vh] bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                Player Sign-In
              </h2>
              <span className="text-xs font-semibold text-amber-400 block">
                Enter your name & pick your unique logo
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Student Name */}
          <div className="space-y-2">
            <label className="font-display font-black text-sm uppercase tracking-wider text-slate-300 block">
              1. Your Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                autoFocus
                maxLength={20}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your first name (e.g. Alex)"
                className="w-full min-h-[50px] pl-11 pr-4 rounded-2xl bg-slate-950 border-2 border-slate-700 focus:border-amber-400 text-white font-bold text-base focus:outline-none transition-colors placeholder:text-slate-500 placeholder:font-normal"
              />
            </div>
          </div>

          {/* 2. Choose Logo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-display font-black text-sm uppercase tracking-wider text-slate-300 block">
                2. Pick Your Logo
              </label>
              <span className="text-xs font-medium text-slate-400">
                Each logo can only be picked once!
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'All (34)' },
                { id: 'animals', label: '🦁 Animals' },
                { id: 'space', label: '🚀 Space' },
                { id: 'sports', label: '⚽ Fun' },
                { id: 'gems', label: '💎 Gems' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Logo Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[220px] overflow-y-auto p-1 border border-slate-800 rounded-2xl bg-slate-950/60">
              {filteredLogos.map((logo) => {
                const isClaimed = claimedMap.has(logo.emoji);
                const claimedBy = claimedMap.get(logo.emoji);
                const isSelected = selectedLogo === logo.emoji;

                if (isClaimed) {
                  return (
                    <div
                      key={logo.id}
                      title={`Taken by ${claimedBy}`}
                      className="p-2 rounded-2xl bg-slate-900/40 border border-slate-800/60 opacity-40 flex flex-col items-center justify-center text-center cursor-not-allowed relative"
                    >
                      <span className="text-2xl grayscale">{logo.emoji}</span>
                      <span className="text-[10px] font-bold text-slate-500 truncate w-full mt-0.5">
                        {logo.name}
                      </span>
                      <div className="absolute top-1 right-1">
                        <Lock className="w-3 h-3 text-slate-500" />
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={logo.id}
                    type="button"
                    onClick={() => setSelectedLogo(logo.emoji)}
                    className={`p-2 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-amber-400/20 border-amber-400 shadow-md shadow-amber-400/20 ring-2 ring-amber-400'
                        : 'bg-slate-800/70 border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <span className="text-2xl drop-shadow">{logo.emoji}</span>
                    <span
                      className={`text-[10px] font-extrabold truncate w-full mt-0.5 ${
                        isSelected ? 'text-amber-300' : 'text-slate-300'
                      }`}
                    >
                      {logo.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedLogo && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs font-semibold">
                <span className="text-xl">{selectedLogo}</span>
                <span>You selected this logo for the leaderboard!</span>
              </div>
            )}
          </div>

          {/* 3. Word Selection & Round Timer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            {/* Word Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-display font-black text-xs uppercase tracking-wider text-slate-400 block">
                  Words
                </label>
                <button
                  type="button"
                  onClick={onOpenWordListSetup}
                  className="text-xs font-bold text-teal-400 hover:text-teal-300 underline cursor-pointer"
                >
                  Edit List
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setUseWordList(false)}
                  className={`py-2 px-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    !useWordList
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>All Words</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (wordListCount === 0) {
                      onOpenWordListSetup();
                    } else {
                      setUseWordList(true);
                    }
                  }}
                  className={`py-2 px-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    useWordList
                      ? 'bg-teal-500 text-slate-950 border-teal-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>
                    Word List {wordListCount > 0 ? `(${wordListCount})` : ''}
                  </span>
                </button>
              </div>
            </div>

            {/* Timer */}
            <div className="space-y-1.5">
              <label className="font-display font-black text-xs uppercase tracking-wider text-slate-400 block">
                Timer
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { sec: 30, label: '30s' },
                  { sec: 60, label: '1 min' },
                  { sec: 120, label: '2 min' },
                ].map((t) => (
                  <button
                    key={t.sec}
                    type="button"
                    onClick={() => setRoundSeconds(t.sec)}
                    className={`py-2 px-2 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                      roundSeconds === t.sec
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {!playerName.trim() ? (
              <span className="text-amber-400 font-medium">Please enter your name</span>
            ) : !selectedLogo ? (
              <span className="text-amber-400 font-medium">Please pick a logo</span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4 stroke-[3]" /> Ready to play!
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!isFormValid}
            onClick={handleLaunch}
            className={`min-h-[50px] px-6 rounded-2xl font-display font-black text-base flex items-center gap-2 transition-all ${
              isFormValid
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};
