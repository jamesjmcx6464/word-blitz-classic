import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { AdventureLevelDef } from '../../utils/adventureConfig';
import {
  AdventureCharacterProgress,
  getAdventureProgress,
  markLevelPassed,
} from '../../utils/adventureProgress';
import { AdventureMap } from './AdventureMap';
import { AdventurePlay } from './AdventurePlay';

interface AdventureModeProps {
  playerName: string;
  playerLogo: string;
  onExit: () => void;
  /** True while a Spark level round is in progress (not the map or result screen). */
  onRoundActiveChange?: (active: boolean) => void;
  /** Start the Word Blitz bonus game unlocked by beating this level. */
  onPlayBonus?: (level: AdventureLevelDef) => void;
}

type View = 'map' | 'play';

export const AdventureMode: React.FC<AdventureModeProps> = ({
  playerName,
  playerLogo,
  onExit,
  onRoundActiveChange,
  onPlayBonus,
}) => {
  const [view, setView] = useState<View>('map');
  const [level, setLevel] = useState<AdventureLevelDef | null>(null);
  const [progress, setProgress] = useState<AdventureCharacterProgress>(() =>
    getAdventureProgress(playerName, playerLogo)
  );
  const [playKey, setPlayKey] = useState(0);

  const handleSelectLevel = (lvl: AdventureLevelDef) => {
    setLevel(lvl);
    setPlayKey((k) => k + 1);
    setView('play');
  };

  const handleLevelFinished = (passed: boolean) => {
    if (passed && level) {
      const { progress: next, stickerJustEarned } = markLevelPassed(
        playerName,
        playerLogo,
        level.id
      );
      setProgress(next);
      if (stickerJustEarned) {
        // Brief burst on the result screen the first time the sticker is earned.
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.55 },
          ticks: 140,
          colors: ['#fde68a', '#fbbf24', '#f59e0b', '#c084fc', '#ffffff'],
        });
      }
    } else {
      setProgress(getAdventureProgress(playerName, playerLogo));
    }
  };

  const handleExitToMap = () => {
    onRoundActiveChange?.(false);
    setView('map');
    setLevel(null);
    setProgress(getAdventureProgress(playerName, playerLogo));
  };

  useEffect(() => {
    if (view !== 'play') onRoundActiveChange?.(false);
  }, [view, onRoundActiveChange]);

  useEffect(() => () => onRoundActiveChange?.(false), [onRoundActiveChange]);

  if (view === 'play' && level) {
    return (
      <AdventurePlay
        key={playKey}
        level={level}
        playerName={playerName}
        playerLogo={playerLogo}
        onExitToMap={handleExitToMap}
        onLevelFinished={handleLevelFinished}
        onRoundActiveChange={onRoundActiveChange}
      />
    );
  }

  return (
    <AdventureMap
      playerName={playerName}
      playerLogo={playerLogo}
      progress={progress}
      onBack={onExit}
      onSelectLevel={handleSelectLevel}
      onPlayBonus={onPlayBonus}
    />
  );
};
