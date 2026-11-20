import React, { useState, useMemo, useLayoutEffect, useRef } from 'react';
import {
  User,
  UserPlus,
  ArrowLeft,
  X,
  Play,
  Check,
  Lock,
  Edit3,
  Clock,
  Trophy,
  Trash2,
} from 'lucide-react';
import { STUDENT_LOGOS } from '../data/studentLogos';
import {
  getRegisteredPlayers,
  registerOrSelectPlayer,
  deleteRegisteredPlayer,
  getClaimedLogos,
  RegisteredPlayer,
} from '../utils/registeredPlayers';
import { DifficultyChoice } from '../types/game';
import { DifficultyPicker } from './DifficultyPicker';
import { TimerToggle } from './TimerToggle';
import {
  getAdventureProgress,
  getEarnedStickers,
  getTotalAdventureScore,
} from '../utils/adventureProgress';
import { AdventureStickerBadge } from './adventure/AdventureStickerBadge';

interface SoloPlayerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSolo: (
    playerName: string,
    playerLogo: string,
    roundSeconds: number
  ) => void;
  /** When set, launching goes to Adventure instead of Solo arcade. */
  onStartAdventure?: (playerName: string, playerLogo: string) => void;
  /** 'adventure' hides timer/difficulty and uses the adventure launch handler. */
  setupVariant?: 'solo' | 'adventure';
  /** Difficulty shared with Home (presets + Custom when Settings are saved) */
  difficulty: DifficultyChoice;
  onChangeDifficulty: (level: DifficultyChoice) => void;
  hasCustomSettings: boolean;
  isWide: boolean;
}

export const SoloPlayerSetupModal: React.FC<SoloPlayerSetupModalProps> = ({
  isOpen,
  onClose,
  onStartSolo,
  onStartAdventure,
  setupVariant = 'solo',
  difficulty,
  onChangeDifficulty,
  hasCustomSettings,
  isWide,
}) => {
  const isAdventure = setupVariant === 'adventure';
  const [registeredPlayers, setRegisteredPlayers] = useState<RegisteredPlayer[]>(() => getRegisteredPlayers());
  const [selectedExistingPlayer, setSelectedExistingPlayer] = useState<RegisteredPlayer | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(true);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const [playerName, setPlayerName] = useState<string>('');
  const [selectedLogo, setSelectedLogo] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'animals' | 'space' | 'sports' | 'gems'
  >('all');
  const [roundSeconds, setRoundSeconds] = useState<number>(60);
  // Timer off = endless round (0 s), ends when the pile reaches the line
  const [timerOn, setTimerOn] = useState<boolean>(true);

  // Carousel mouse-drag scroll state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDraggingCarousel, setIsDraggingCarousel] = useState<boolean>(false);
  const dragStateRef = useRef<{
    isDown: boolean;
    startX: number;
    scrollLeft: number;
    didDrag: boolean;
  }>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    didDrag: false,
  });

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load registered players & reset inputs whenever opened, before paint
  useLayoutEffect(() => {
    if (!isOpen) return;
    setRegisteredPlayers(getRegisteredPlayers());
    setSelectedExistingPlayer(null);
    setIsAddingNew(true);
    setConfirmDelete(false);
    setPlayerName('');
    setSelectedLogo('');
    setSelectedCategory('all');
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen && isAddingNew) {
      nameInputRef.current?.focus({ preventScroll: true });
    }
  }, [isOpen, isAddingNew]);

  // Read currently claimed logos from registered players + Solo leaderboard
  const claimedMap = useMemo(() => {
    return getClaimedLogos();
  }, [isOpen, registeredPlayers]);

  if (!isOpen) return null;

  // Filter logos by category
  const filteredLogos =
    selectedCategory === 'all'
      ? STUDENT_LOGOS
      : STUDENT_LOGOS.filter((l) => l.category === selectedCategory);

  const isExistingMode = !isAddingNew && selectedExistingPlayer !== null;
  const activeName = isExistingMode ? selectedExistingPlayer.name : playerName.trim();
  const activeLogo = isExistingMode ? selectedExistingPlayer.logo : selectedLogo;
  const isFormValid = activeName.length > 0 && activeLogo.length > 0;

  // Mouse drag handlers for the horizontally scrollable player carousel
  const handleCarouselMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = carouselRef.current;
    if (!el) return;
    dragStateRef.current = {
      isDown: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      didDrag: false,
    };
    setIsDraggingCarousel(true);
  };

  const handleCarouselMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDown) return;
    const el = carouselRef.current;
    if (!el) return;
    const dx = e.clientX - dragStateRef.current.startX;
    if (Math.abs(dx) > 5) {
      dragStateRef.current.didDrag = true;
    }
    if (dragStateRef.current.didDrag) {
      el.scrollLeft = dragStateRef.current.scrollLeft - dx;
    }
  };

  const handleCarouselMouseUpOrLeave = () => {
    dragStateRef.current.isDown = false;
    setIsDraggingCarousel(false);
    setTimeout(() => {
      dragStateRef.current.didDrag = false;
    }, 0);
  };

  const handleSelectExistingPlayer = (player: RegisteredPlayer) => {
    if (dragStateRef.current.didDrag) {
      dragStateRef.current.didDrag = false;
      return;
    }
    setSelectedExistingPlayer(player);
    setIsAddingNew(false);
    setConfirmDelete(false);
  };

  const handleDeletePlayer = () => {
    if (!selectedExistingPlayer) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteRegisteredPlayer(selectedExistingPlayer);
    setRegisteredPlayers(getRegisteredPlayers());
    setSelectedExistingPlayer(null);
    setIsAddingNew(true);
    setConfirmDelete(false);
  };

  const handleSelectAddNewPlayer = () => {
    if (dragStateRef.current.didDrag) {
      dragStateRef.current.didDrag = false;
      return;
    }
    setSelectedExistingPlayer(null);
    setIsAddingNew(true);
    setConfirmDelete(false);
  };

  const handleLaunch = () => {
    if (!isFormValid) return;
    const registered = registerOrSelectPlayer(activeName, activeLogo);
    if (isAdventure && onStartAdventure) {
      onStartAdventure(registered.name, registered.logo);
      return;
    }
    onStartSolo(
      registered.name,
      registered.logo,
      timerOn ? roundSeconds : 0
    );
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
                {isAdventure ? 'Adventure Sign-In' : 'Player Sign-In'}
              </h2>
              <span className="text-xs font-semibold text-amber-400 block">
                {isAdventure
                  ? 'Pick a character for Adventure'
                  : 'Pick a registered player or add a new student'}
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
          {/* 1. Horizontally Scrollable Player Carousel (Touch swipe, Mouse drag, Visible scrollbar) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="font-display font-black text-sm uppercase tracking-wider text-slate-300 block">
                Players ({registeredPlayers.length})
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                Swipe, drag, or scroll to pick a player
              </span>
            </div>

            <div
              ref={carouselRef}
              onMouseDown={handleCarouselMouseDown}
              onMouseMove={handleCarouselMouseMove}
              onMouseUp={handleCarouselMouseUpOrLeave}
              onMouseLeave={handleCarouselMouseUpOrLeave}
              className={`w-full flex items-stretch gap-2.5 overflow-x-scroll touch-pan-x carousel-scrollbar pb-3 pt-1 px-1 rounded-2xl bg-slate-950/70 border border-slate-800 ${
                isDraggingCarousel ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* Add New Player Card */}
              <button
                type="button"
                onClick={handleSelectAddNewPlayer}
                className={`shrink-0 w-[124px] p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                  isAddingNew
                    ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/60'
                    : 'bg-slate-900/90 border-dashed border-slate-600 hover:border-indigo-400 text-slate-300 hover:text-white'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isAddingNew ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400'
                  }`}
                >
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="font-display font-black text-xs leading-tight">
                  Add New Player
                </span>
                <span className="text-[10px] font-semibold text-indigo-300">
                  Name &amp; Logo
                </span>
              </button>

              {/* Registered Player Cards */}
              {registeredPlayers.map((player) => {
                const isSelected = isExistingMode && selectedExistingPlayer?.id === player.id;
                return (
                  <button
                    key={player.id}
                    type="button"
                    data-testid={`adventure-character-${player.name}`}
                    onClick={() => handleSelectExistingPlayer(player)}
                    className={`shrink-0 w-[128px] p-3 rounded-2xl border-2 flex flex-col items-center justify-between text-center gap-1 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-amber-400/20 border-amber-400 text-white shadow-lg shadow-amber-400/20 ring-2 ring-amber-400/70'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <span className="relative text-3xl drop-shadow mt-0.5">
                      {player.logo}
                      {isAdventure &&
                        getEarnedStickers(getAdventureProgress(player.name, player.logo)).length > 0 && (
                          <span className="absolute -top-1 -right-3 flex -space-x-2">
                            {getEarnedStickers(getAdventureProgress(player.name, player.logo)).map((band) => (
                              <AdventureStickerBadge key={band.id} band={band} />
                            ))}
                          </span>
                        )}
                    </span>

                    <div className="w-full min-w-0">
                      <span
                        className={`font-display font-black text-sm block truncate ${
                          isSelected ? 'text-amber-300' : 'text-white'
                        }`}
                      >
                        {player.name}
                      </span>
                      {isAdventure ? (
                        (() => {
                          const total = getTotalAdventureScore(
                            getAdventureProgress(player.name, player.logo)
                          );
                          return total > 0 ? (
                            <span
                              data-testid={`adventure-score-${player.id}`}
                              className="text-xs font-black text-amber-300 tabular-nums block mt-0.5"
                            >
                              {total.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                              &nbsp;
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                          {player.bestScore > 0 ? (
                            <>
                              <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{player.bestScore.toLocaleString()} pts</span>
                            </>
                          ) : (
                            <span>Registered</span>
                          )}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Existing Player Banner OR New Player Registration Form */}
          {isExistingMode ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-slate-900 border-2 border-amber-400/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="relative text-4xl drop-shadow shrink-0">
                  {selectedExistingPlayer.logo}
                  {isAdventure &&
                    getEarnedStickers(
                      getAdventureProgress(selectedExistingPlayer.name, selectedExistingPlayer.logo)
                    ).length > 0 && (
                      <span className="absolute -top-1 -right-2 flex -space-x-2">
                        {getEarnedStickers(
                          getAdventureProgress(selectedExistingPlayer.name, selectedExistingPlayer.logo)
                        ).map((band) => (
                          <AdventureStickerBadge key={band.id} band={band} size="md" />
                        ))}
                      </span>
                    )}
                </span>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                    Selected Player
                  </span>
                  <span className="font-display font-black text-xl text-white truncate block">
                    {selectedExistingPlayer.name}
                  </span>
                  {isAdventure ? (
                    (() => {
                      const total = getTotalAdventureScore(
                        getAdventureProgress(selectedExistingPlayer.name, selectedExistingPlayer.logo)
                      );
                      return total > 0 ? (
                        <span
                          data-testid="adventure-score-selected"
                          className="text-sm font-black text-amber-300 tabular-nums"
                        >
                          {total.toLocaleString()}
                        </span>
                      ) : null;
                    })()
                  ) : (
                    selectedExistingPlayer.bestScore > 0 && (
                      <span className="text-xs text-slate-300 font-medium">
                        Personal best: {selectedExistingPlayer.bestScore.toLocaleString()} pts
                      </span>
                    )
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAddNewPlayer}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>New Player</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeletePlayer}
                  onMouseLeave={() => setConfirmDelete(false)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    confirmDelete
                      ? 'bg-rose-600 hover:bg-rose-500 border-rose-400 text-white'
                      : 'bg-slate-800 hover:bg-rose-950 border-slate-600 hover:border-rose-500 text-rose-300'
                  }`}
                  aria-label={`Delete player ${selectedExistingPlayer.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{confirmDelete ? 'Tap to confirm' : 'Delete'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Student Name */}
              <div className="space-y-2">
                <label className="font-display font-black text-sm uppercase tracking-wider text-slate-300 block">
                  1. New Player Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    ref={nameInputRef}
                    type="text"
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
                    { id: 'all', label: `All (${STUDENT_LOGOS.length})` },
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
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-1 border border-slate-800 rounded-2xl bg-slate-950/60">
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
            </>
          )}

          {/* 3. Difficulty (Solo only) */}
          {!isAdventure && (
          <div className="pt-2 border-t border-slate-800">
            <DifficultyPicker
              difficulty={difficulty}
              onChange={onChangeDifficulty}
              hasCustom={hasCustomSettings}
            />
          </div>
          )}

          {/* 4. Round Timer (Solo only) */}
          {!isAdventure && (
          <div className="pt-2 border-t border-slate-800">
            {/* Timer */}
            <div className="space-y-1.5">
              <label className="font-display font-black text-xs uppercase tracking-wider text-slate-400 block">
                Timer
              </label>
              <TimerToggle timerOn={timerOn} onChange={setTimerOn} />
              {!timerOn && (
                <p className="text-[11px] text-slate-400 font-medium">
                  No timer: play until the letters reach the line.
                </p>
              )}
              {timerOn && (
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
              )}
            </div>
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {!activeName ? (
              <span className="text-amber-400 font-medium">Select a player or enter your name</span>
            ) : !activeLogo ? (
              <span className="text-amber-400 font-medium">Please pick a logo</span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4 stroke-[3]" /> Ready as {activeLogo} {activeName}!
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
            <span>{isAdventure ? 'Start Adventure' : 'Start Game'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
