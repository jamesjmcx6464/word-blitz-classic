import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { HexTile, WordEntry } from '../types/game';
import { getWordScore } from '../data/dictionary';
import { getSpellingProgress } from '../utils/spellingProgress';
import { Check, RotateCcw, Shuffle, Delete } from 'lucide-react';

interface WordBarProps {
  selectedTiles: HexTile[];
  onClear: () => void;
  onSubmit: () => void;
  onRemoveTile: (tile: HexTile) => void;
  isShaking: boolean;
  errorMessage: string | null;
  isWide?: boolean;
  onShuffleSelection?: () => void;
  lastFoundWord?: WordEntry | null;
  isSpellingMode?: boolean;
  spellingWords?: string[];
  wordEntries?: WordEntry[];
}

const PRAISES = [
  'Great job!',
  'Nice one!',
  'You got it!',
  'Awesome!',
  'Super speller!',
];

export const WordBar: React.FC<WordBarProps> = ({
  selectedTiles,
  onClear,
  onSubmit,
  onRemoveTile,
  isShaking,
  errorMessage,
  isWide = false,
  onShuffleSelection,
  lastFoundWord = null,
  isSpellingMode = false,
  spellingWords = [],
  wordEntries = [],
}) => {
  const wordString = selectedTiles.map((t) => t.letter.value).join('');
  const letterCount = wordString.length;
  const potentialScore = letterCount >= 2 ? getWordScore(letterCount) : 0;
  const isValidLength = letterCount >= 2;

  // Track success messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const lastFoundWordIdRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef<boolean>(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      if (lastFoundWord) {
        lastFoundWordIdRef.current = lastFoundWord.id;
      }
      return;
    }

    if (lastFoundWord && lastFoundWord.id !== lastFoundWordIdRef.current) {
      lastFoundWordIdRef.current = lastFoundWord.id;

      if (isSpellingMode && spellingWords.length > 0) {
        const progress = getSpellingProgress(wordEntries, spellingWords);
        if (progress.allFound) {
          setSuccessMessage('You found every word! 🎉');
        } else {
          setSuccessMessage(`You found ${lastFoundWord.word}! ${progress.foundCount} of ${progress.totalCount} words`);
        }
      } else {
        if (lastFoundWord.length >= 5) {
          setSuccessMessage('Wow, a long word!');
        } else {
          const randomPraise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
          setSuccessMessage(randomPraise);
        }
      }

      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [lastFoundWord, isSpellingMode, spellingWords, wordEntries]);

  // Dynamic scale calculation for long words, bounded at >= 0.6
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const computeScale = () => {
      if (!containerRef.current || !contentRef.current) {
        setScale(1);
        return;
      }
      const containerWidth = containerRef.current.clientWidth;
      const contentWidth = contentRef.current.scrollWidth;

      if (containerWidth > 0 && contentWidth > 0 && contentWidth > containerWidth - 8) {
        const targetScale = Math.max(0.6, (containerWidth - 8) / contentWidth);
        setScale(targetScale);
      } else {
        setScale(1);
      }
    };

    computeScale();

    const observer = new ResizeObserver(computeScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [selectedTiles]);

  // Selected Tiles List (always flex-nowrap on single horizontal line)
  const renderTiles = () => (
    <div
      ref={containerRef}
      className="flex-1 min-w-0 h-full flex items-center justify-center overflow-hidden"
    >
      <div
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'center center',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        className="transition-transform duration-100 ease-out"
      >
        <div ref={contentRef} className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2">
          {selectedTiles.map((tile, idx) => (
            <button
              key={`word-tile-${tile.id}-${idx}`}
              type="button"
              onClick={() => onRemoveTile(tile)}
              title="Tap to remove letter"
              aria-label={`Remove letter ${tile.letter.display}`}
              className="relative min-w-[44px] sm:min-w-[48px] h-[48px] sm:h-[50px] px-2 rounded-xl bg-amber-400 text-amber-950 font-display font-black text-2xl border-2 border-amber-300 shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer animate-letter-spring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 shrink-0"
            >
              <span>{tile.letter.display}</span>
              {/* Always visible ✕ corner mark */}
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-900/90 text-white text-[10px] sm:text-xs font-black flex items-center justify-center pointer-events-none">
                ✕
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Status message line (strictly single line, truncate if needed)
  const renderMessage = () => {
    if (errorMessage) {
      return (
        <div
          className={`px-2.5 py-0.5 rounded-lg bg-purple-900/80 border border-purple-400/50 text-purple-100 font-bold text-xs sm:text-sm text-center truncate max-w-full leading-tight ${
            isShaking ? 'motion-safe:animate-shake' : ''
          }`}
        >
          {errorMessage}
        </div>
      );
    }
    if (successMessage) {
      return (
        <div className="px-2.5 py-0.5 rounded-lg bg-emerald-900/80 border border-emerald-400/50 text-emerald-200 font-bold text-xs sm:text-sm text-center truncate max-w-full leading-tight motion-safe:animate-bounce">
          {successMessage}
        </div>
      );
    }
    if (letterCount === 0) {
      return (
        <span className="text-slate-400 text-xs sm:text-sm font-medium truncate max-w-full leading-tight">
          Tap letters on the board to build a word
        </span>
      );
    }
    if (letterCount === 1) {
      return (
        <span className="text-amber-300 text-xs sm:text-sm font-semibold truncate max-w-full leading-tight">
          Pick 1 more letter
        </span>
      );
    }
    return (
      <span className="text-amber-300 text-xs sm:text-sm font-bold truncate max-w-full leading-tight">
        +{potentialScore} points if you press GO!
      </span>
    );
  };

  // Button row controls (strictly fixed h-[56px] to prevent any layout jump)
  const renderButtons = () => (
    <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto h-[56px]">
      {/* ⌫ Undo button */}
      <button
        type="button"
        onClick={() => {
          if (selectedTiles.length > 0) {
            onRemoveTile(selectedTiles[selectedTiles.length - 1]);
          }
        }}
        disabled={selectedTiles.length === 0}
        aria-label="Undo last letter"
        className={`h-[56px] px-3 rounded-2xl flex flex-col items-center justify-center font-bold text-sm border-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 shrink-0 ${
          selectedTiles.length > 0
            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer shadow-sm active:scale-95'
            : 'bg-slate-900/50 text-slate-600 border-slate-800/60 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Delete className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>Undo</span>
        </div>
        {isWide && (
          <span className="text-[10px] text-slate-400 hidden sm:block whitespace-nowrap leading-none mt-0.5">
            Backspace
          </span>
        )}
      </button>

      {/* 🗑 Start over button */}
      <button
        type="button"
        onClick={onClear}
        disabled={selectedTiles.length === 0}
        aria-label="Start over"
        className={`h-[56px] px-3 rounded-2xl flex flex-col items-center justify-center font-bold text-sm border-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 shrink-0 ${
          selectedTiles.length > 0
            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer shadow-sm active:scale-95'
            : 'bg-slate-900/50 text-slate-600 border-slate-800/60 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center gap-1 whitespace-nowrap">
          <RotateCcw className="w-4 h-4 shrink-0" />
          <span>Clear</span>
        </div>
        {isWide && (
          <span className="text-[10px] text-slate-400 hidden sm:block whitespace-nowrap leading-none mt-0.5">
            Esc
          </span>
        )}
      </button>

      {/* 🔀 Mix button (Always rendered when onShuffleSelection provided, disabled when < 3) */}
      {onShuffleSelection && (
        <button
          type="button"
          onClick={onShuffleSelection}
          disabled={selectedTiles.length < 3}
          aria-label="Mix selected letters"
          className={`h-[56px] px-3 rounded-2xl flex flex-col items-center justify-center font-bold text-sm border-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 shrink-0 ${
            selectedTiles.length >= 3
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer shadow-sm active:scale-95'
              : 'bg-slate-900/50 text-slate-600 border-slate-800/60 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-1 whitespace-nowrap">
            <Shuffle
              className={`w-4 h-4 shrink-0 ${
                selectedTiles.length >= 3 ? 'text-amber-400' : 'text-slate-600'
              }`}
            />
            <span>Mix</span>
          </div>
          {isWide && (
            <span className="text-[10px] text-slate-500 hidden sm:block whitespace-nowrap leading-none mt-0.5">
              Shuffle
            </span>
          )}
        </button>
      )}

      {/* ✅ GO! Button (flex-[2], emerald, h-[56px]) */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!isValidLength}
        aria-label="Submit word"
        className={`relative overflow-hidden flex-[2] min-w-[120px] h-[56px] px-3 sm:px-4 rounded-2xl flex flex-col items-center justify-center font-display font-black text-base sm:text-lg transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 shrink-0 ${
          isValidLength
            ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95'
            : 'bg-slate-900/70 text-slate-500 border border-slate-800 cursor-not-allowed'
        }`}
      >
        {isValidLength && (
          <div className="animate-go-shimmer pointer-events-none" aria-hidden="true" />
        )}
        <div className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
          <Check className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 stroke-[3]" />
          <span>{isValidLength ? 'GO!' : 'Pick 2+ letters'}</span>
        </div>
        {isWide && isValidLength && (
          <span className="relative z-10 text-[10px] font-sans font-medium text-emerald-950/80 hidden sm:block whitespace-nowrap leading-none mt-0.5">
            Enter
          </span>
        )}
      </button>
    </div>
  );

  return (
    <div className="w-full mx-auto px-2 mb-1 flex flex-col shrink-0 select-none">
      {isWide ? (
        /* WIDE SCREEN: Strictly fixed h-[88px] overflow-hidden */
        <div className="h-[88px] overflow-hidden bg-slate-900/90 border-2 border-slate-800 rounded-2xl px-3 py-1 flex items-center justify-between gap-3 shadow-md">
          {/* Left: Fixed height letter strip (54px) & Fixed height status line (22px) */}
          <div className="flex-1 flex flex-col min-w-0 h-full justify-center">
            <div className="h-[54px] w-full flex items-center overflow-hidden">
              {selectedTiles.length > 0 ? (
                renderTiles()
              ) : (
                <div className="flex items-center gap-1.5 text-slate-600 pl-2">
                  <span className="w-9 h-11 rounded-xl border-2 border-dashed border-slate-800 flex items-center justify-center text-xs font-bold text-slate-600">
                    _
                  </span>
                  <span className="w-9 h-11 rounded-xl border-2 border-dashed border-slate-800 flex items-center justify-center text-xs font-bold text-slate-600">
                    _
                  </span>
                  <span className="w-9 h-11 rounded-xl border-2 border-dashed border-slate-800 flex items-center justify-center text-xs font-bold text-slate-600">
                    _
                  </span>
                </div>
              )}
            </div>
            <div
              aria-live="polite"
              className="h-[22px] w-full flex items-center pl-2 overflow-hidden"
            >
              {renderMessage()}
            </div>
          </div>

          {/* Right: Buttons */}
          <div className="shrink-0 h-[56px] flex items-center">{renderButtons()}</div>
        </div>
      ) : (
        /* PHONE: Fixed height h-[84px] Tray, then Fixed height h-[56px] Buttons */
        <div className="flex flex-col gap-1.5">
          {/* Tray Row: strictly h-[84px] overflow-hidden */}
          <div className="h-[84px] overflow-hidden bg-slate-900/90 border-2 border-slate-800 rounded-2xl px-2 py-1 flex flex-col items-center justify-between text-center shadow-md">
            {/* Top Tile Strip: strictly h-[54px] flex items-center justify-center overflow-hidden */}
            <div className="h-[54px] w-full flex items-center justify-center overflow-hidden">
              {selectedTiles.length > 0 ? (
                renderTiles()
              ) : (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-9 h-11 rounded-xl border-2 border-dashed border-slate-800 flex items-center justify-center text-xs font-bold text-slate-600">
                    _
                  </span>
                  <span className="w-9 h-11 rounded-xl border-2 border-dashed border-slate-800 flex items-center justify-center text-xs font-bold text-slate-600">
                    _
                  </span>
                  <span className="w-9 h-11 rounded-xl border-2 border-dashed border-slate-800 flex items-center justify-center text-xs font-bold text-slate-600">
                    _
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Status Message Line: strictly h-[22px] flex items-center justify-center overflow-hidden */}
            <div
              aria-live="polite"
              className="h-[22px] w-full flex items-center justify-center overflow-hidden"
            >
              {renderMessage()}
            </div>
          </div>

          {/* Button Row: strictly h-[56px] */}
          {renderButtons()}
        </div>
      )}
    </div>
  );
};
