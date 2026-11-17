import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WordEntry } from '../types/game';

interface WordChipsProps {
  words: WordEntry[];
  emptyText?: string;
  className?: string;
  /** Tailwind max-height classes for the scroll area. */
  maxHeightClass?: string;
}

export const WordChips: React.FC<WordChipsProps> = ({
  words,
  emptyText = 'No words this round',
  className = '',
  maxHeightClass = 'max-h-36',
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  const maxLen = useMemo(
    () => words.reduce((best, entry) => Math.max(best, entry.word.length), 0),
    [words]
  );

  const displayWords = useMemo(
    () =>
      words
        .map((entry, index) => ({ entry, index }))
        .sort((a, b) => b.entry.word.length - a.entry.word.length || a.index - b.index)
        .map(({ entry }) => entry),
    [words]
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      setShowFade(false);
      return;
    }
    const update = () => {
      setShowFade(el.scrollHeight - el.clientHeight > 2 && el.scrollTop + el.clientHeight < el.scrollHeight - 2);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [displayWords]);

  if (words.length === 0) {
    return (
      <p className={`text-xs sm:text-sm font-semibold text-slate-500 text-center py-1 ${className}`}>
        {emptyText}
      </p>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollerRef}
        className={`flex flex-wrap content-start gap-1.5 overflow-y-auto thin-scrollbar pr-1 ${maxHeightClass}`}
        role="list"
        aria-label="Words found"
      >
        {displayWords.map((entry, idx) => {
          const isLongest = maxLen > 0 && entry.word.length === maxLen;
          return (
            <span
              key={entry.id || `${entry.word}-${idx}`}
              role="listitem"
              title={isLongest ? 'Longest word' : undefined}
              className={
                isLongest
                  ? 'inline-flex items-center gap-1 max-w-full px-2 py-1 rounded-lg bg-amber-400/15 border border-amber-400/70 text-amber-100'
                  : 'inline-flex items-center gap-1 max-w-full px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-600/70 text-slate-200'
              }
            >
              <span className="font-mono font-black text-[11px] sm:text-xs uppercase tracking-wide leading-none truncate">
                {entry.word}
              </span>
              <span
                className={`font-bold text-[10px] tabular-nums leading-none shrink-0 ${
                  isLongest ? 'text-amber-300' : 'text-emerald-400'
                }`}
              >
                +{entry.score.toLocaleString()}
              </span>
            </span>
          );
        })}
      </div>
      {showFade && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-7 rounded-b-lg bg-gradient-to-t from-slate-950/90 to-transparent"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
