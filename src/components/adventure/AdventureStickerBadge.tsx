import React from 'react';
import { AdventureBandDef } from '../../utils/adventureConfig';

interface AdventureStickerBadgeProps {
  band: AdventureBandDef;
  size?: 'sm' | 'md';
  className?: string;
}

/** Small rounded sticker-style badge for a completed adventure mode. */
export const AdventureStickerBadge: React.FC<AdventureStickerBadgeProps> = ({
  band,
  size = 'sm',
  className = '',
}) => {
  const dim = size === 'md' ? 'w-8 h-8 text-base' : 'w-6 h-6 text-sm';
  return (
    <span
      data-testid={`sticker-${band.id}`}
      title={`${band.title} complete`}
      aria-label={`${band.title} sticker`}
      className={`inline-flex items-center justify-center ${dim} rounded-lg bg-gradient-to-br from-amber-100 via-yellow-300 to-amber-400 border-2 border-white shadow-[0_1px_2px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.75)] leading-none -rotate-6 ${className}`}
    >
      <span className="rotate-6 leading-none" aria-hidden>
        {band.stickerEmoji}
      </span>
    </span>
  );
};
