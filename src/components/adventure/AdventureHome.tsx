import React, { useState } from 'react';
import { ADVENTURE_HOME_CARDS, AdventureBandId } from '../../utils/adventureConfig';
import {
  AdventureCharacterProgress,
  getTotalAdventureScore,
  hasSticker,
} from '../../utils/adventureProgress';
import { AdventureHeader } from './AdventureHeader';

interface AdventureHomeProps {
  playerName: string;
  playerLogo: string;
  progress: AdventureCharacterProgress;
  onBack: () => void;
  onSelectBand: (band: AdventureBandId) => void;
}

/** "Choose Adventure": one big sticker per adventure. Dim until that adventure is complete. */
export const AdventureHome: React.FC<AdventureHomeProps> = ({
  playerName,
  playerLogo,
  progress,
  onBack,
  onSelectBand,
}) => {
  const [soonId, setSoonId] = useState<string | null>(null);
  return (
    <div className="w-full h-full min-h-0 flex flex-col text-slate-100 select-none px-3 sm:px-5 py-3 safe-area-pad">
      <AdventureHeader
        playerName={playerName}
        playerLogo={playerLogo}
        totalScore={getTotalAdventureScore(progress)}
        onBack={onBack}
        backLabel="Back to sign-in"
      />
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 py-3">
        <h2 className="font-display font-black text-2xl text-white">Choose Adventure</h2>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {ADVENTURE_HOME_CARDS.map((card) => {
            const earned = !card.comingSoon && hasSticker(progress, card.id);
            return (
              <button
                key={card.id}
                type="button"
                data-testid={`adventure-sticker-${card.id}`}
                data-earned={earned ? 'true' : 'false'}
                onClick={() => {
                  if (card.comingSoon) setSoonId(card.id);
                  else onSelectBand(card.id as AdventureBandId);
                }}
                aria-label={`${card.title}${earned ? ' (complete)' : ''}${card.comingSoon ? ' (coming soon)' : ''}`}
                className="relative flex flex-col items-center justify-center gap-2 py-3 rounded-3xl bg-slate-900/70 border border-slate-800 cursor-pointer active:scale-95 transition-transform"
              >
                <span
                  className={`flex items-center justify-center w-[min(28vw,15vh,120px)] h-[min(28vw,15vh,120px)] rounded-[28%] leading-none ${
                    earned
                      ? 'bg-gradient-to-br from-amber-100 via-yellow-300 to-amber-400 border-4 border-white shadow-[0_3px_8px_rgba(0,0,0,0.45),inset_0_2px_0_rgba(255,255,255,0.75)] -rotate-6'
                      : 'bg-slate-900 border-[3px] border-dashed border-slate-600'
                  }`}
                >
                  <span
                    className={`text-[min(14vw,7.5vh,60px)] leading-none ${earned ? 'rotate-6' : 'opacity-35 grayscale'}`}
                    aria-hidden
                  >
                    {card.emoji}
                  </span>
                </span>
                <span className={`font-display font-black text-lg leading-none ${earned ? 'text-amber-300' : 'text-slate-200'}`}>
                  {card.title}
                </span>
                {soonId === card.id && (
                  <span
                    data-testid={`coming-soon-${card.id}`}
                    className="absolute inset-x-2 top-1/2 -translate-y-1/2 py-2 rounded-2xl bg-slate-950/90 border border-amber-400/60 text-amber-300 font-display font-black text-sm"
                  >
                    Coming soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
