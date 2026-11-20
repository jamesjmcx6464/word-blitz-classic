import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { AdventureBandId, AdventureLevelDef } from '../../utils/adventureConfig';
import {
  AdventureCharacterProgress,
  getAdventureProgress,
  getLastAdventureBand,
  consumeReturnToMap,
  markLevelPassed,
  markReturnToMap,
  setLastAdventureBand,
} from '../../utils/adventureProgress';
import { AdventureMap } from './AdventureMap';
import { AdventureHome } from './AdventureHome';
import { AdventurePlay } from './AdventurePlay';

interface AdventureModeProps {
  playerName: string;
  playerLogo: string;
  onExit: () => void;
  /** True while an Adventure level round is in progress (not the map or result screen). */
  onRoundActiveChange?: (active: boolean) => void;
  /** Start the Word Blitz bonus game unlocked by beating this level. */
  onPlayBonus?: (level: AdventureLevelDef) => void;
}

type View = 'home' | 'map' | 'play';

export const AdventureMode: React.FC<AdventureModeProps> = ({
  playerName,
  playerLogo,
  onExit,
  onRoundActiveChange,
  onPlayBonus,
}) => {
  // Fresh sign-in opens Adventure Home; coming back from a bonus Blitz reopens that map.
  const [view, setView] = useState<View>(() => (consumeReturnToMap() ? 'map' : 'home'));
  const [level, setLevel] = useState<AdventureLevelDef | null>(null);
  const [progress, setProgress] = useState<AdventureCharacterProgress>(() =>
    getAdventureProgress(playerName, playerLogo)
  );
  const [playKey, setPlayKey] = useState(0);
  const [band, setBand] = useState<AdventureBandId>(() => getLastAdventureBand());
  const handleSelectBand = (id: AdventureBandId) => {
    setBand(id);
    setLastAdventureBand(id);
    setView('map');
  };
  const handlePlayBonus = (lvl: AdventureLevelDef) => {
    setLastAdventureBand(lvl.band);
    markReturnToMap();
    onPlayBonus?.(lvl);
  };

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
        level
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

  if (view === 'home') {
    return (
      <AdventureHome
        playerName={playerName}
        playerLogo={playerLogo}
        progress={progress}
        onBack={onExit}
        onSelectBand={handleSelectBand}
      />
    );
  }

  return (
    <AdventureMap
      playerName={playerName}
      playerLogo={playerLogo}
      progress={progress}
      band={band}
      onBack={() => setView('home')}
      onSelectLevel={handleSelectLevel}
      onPlayBonus={handlePlayBonus}
    />
  );
};
