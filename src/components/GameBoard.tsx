import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { HexTile, FloatingScore, ViewMode } from '../types/game';
import { isRareLetterDisplay } from '../data/dictionary';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  DANGER_Y,
  GROUND_Y,
  HEX_RADIUS,
  getHexPolygonPoints,
  isPointInHex,
} from '../utils/hexPhysics';

interface GameBoardProps {
  boardWidth?: number;
  boardHeight?: number;
  groundY?: number;
  frozenTiles: HexTile[];
  fallingTile?: HexTile | null;
  fallingTiles?: HexTile[];
  selectedTiles: HexTile[];
  floatingScores: FloatingScore[];
  pulsingTileIds: Set<string>;
  onTileClick: (tile: HexTile) => void;
  isPaused: boolean;
  nearCeiling: boolean;
  ceilingY?: number;
  wallLeft?: number;
  wallRight?: number;
  viewMode?: ViewMode;
  tileRadius?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  boardWidth = BOARD_WIDTH,
  boardHeight = BOARD_HEIGHT,
  groundY = GROUND_Y,
  frozenTiles,
  fallingTile = null,
  fallingTiles: propFallingTiles,
  selectedTiles,
  floatingScores,
  pulsingTileIds,
  onTileClick,
  nearCeiling,
  ceilingY = DANGER_Y,
  wallLeft = 0,
  wallRight = boardWidth,
  viewMode,
  tileRadius = HEX_RADIUS,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Phone version detection (either explicit narrow viewMode or phone screen width)
  const isPhone = viewMode === 'narrow' || (typeof window !== 'undefined' && window.innerWidth < 640);

  // Scaled for tileRadius (default HEX_RADIUS = 28)
  const scale = tileRadius / 28;
  const singleLetterFontSize = (isPhone ? 17.2 * scale : 24.5 * scale).toFixed(1);
  const multiLetterFontSize = (isPhone ? 13.5 * scale : 19.2 * scale).toFixed(1);

  // Deduplicate frozen tiles by ID to guarantee React key uniqueness
  const uniqueFrozenTiles = React.useMemo(() => {
    const seen = new Set<string>();
    return frozenTiles.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [frozenTiles]);

  // Map of selected tiles for sequence badge lookup
  const selectedMap = new Map<string, number>();
  selectedTiles.forEach((tile, index) => {
    selectedMap.set(tile.id, index + 1);
  });

  const activeFalling = React.useMemo(() => {
    const raw = propFallingTiles
      ? propFallingTiles
      : fallingTile
      ? [fallingTile]
      : [];
    const seen = new Set<string>();
    return raw.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [propFallingTiles, fallingTile]);

  // Handle pointer down (mouse click or mobile touch) using exact polygon hit testing on current animated positions
  const handleBoardPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;

    // Convert screen coordinates to SVG viewBox coordinate space
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const screenCTM = svg.getScreenCTM();
    if (!screenCTM) return;

    const svgCoord = pt.matrixTransform(screenCTM.inverse());
    const px = svgCoord.x;
    const py = svgCoord.y;

    // Hit-test both falling tiles and landed/collapsing tiles at their current animated coordinates
    let bestTile: HexTile | null = null;
    let minDistanceSq = Infinity;

    for (const tile of [...activeFalling, ...uniqueFrozenTiles]) {
      if (tile.isClearing) continue;

      if (isPointInHex(px, py, tile.x, tile.y, tileRadius)) {
        const distSq = (px - tile.x) * (px - tile.x) + (py - tile.y) * (py - tile.y);
        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          bestTile = tile;
        }
      }
    }

    if (bestTile) {
      onTileClick(bestTile);
    }
  };

  // Track animated clearing tile IDs and previously falling tile IDs
  const clearingAnimatedRef = useRef<Set<string>>(new Set());
  const prevFallingIdsRef = useRef<Set<string>>(new Set());

  // Proposal 1: Coordinated GSAP tile clearing timeline (flash, 1.25x anticipation pop, shard dispersion shrink)
  useEffect(() => {
    const allTiles = [...uniqueFrozenTiles, ...activeFalling];
    const clearingTiles = allTiles.filter((t) => t.isClearing);
    if (clearingTiles.length === 0) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    clearingTiles.forEach((tile) => {
      if (clearingAnimatedRef.current.has(tile.id)) return;
      clearingAnimatedRef.current.add(tile.id);

      const el = document.getElementById(`hex-tile-${tile.id}`);
      if (!el) return;

      if (prefersReducedMotion) {
        gsap.to(el, { opacity: 0, duration: 0.15, overwrite: 'auto' });
        return;
      }

      const tl = gsap.timeline();
      // Phase 1: 1.25x anticipation pop (0 - 0.1s)
      tl.to(el, {
        scale: 1.25,
        duration: 0.1,
        ease: 'power2.out',
        transformOrigin: `${tile.x}px ${tile.y}px`,
      });
      // Phase 2: Shard-dispersion shrink (scale: 0, rotation: 45deg, opacity: 0) (0.1 - 0.32s)
      tl.to(el, {
        scale: 0,
        rotation: 45,
        opacity: 0,
        duration: 0.22,
        ease: 'back.in(1.6)',
        transformOrigin: `${tile.x}px ${tile.y}px`,
      });
    });

    // Cleanup unmounted tile IDs from tracker
    const liveIds = new Set(allTiles.map((t) => t.id));
    for (const id of clearingAnimatedRef.current) {
      if (!liveIds.has(id)) {
        clearingAnimatedRef.current.delete(id);
      }
    }
  }, [uniqueFrozenTiles, activeFalling]);

  // Proposal 1: Subtle elastic bounce (ease: 'back.out(1.4)') when column tiles drop into new rest positions
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const currentFallingIds = new Set(
      uniqueFrozenTiles.filter((t) => t.isFalling).map((t) => t.id)
    );

    uniqueFrozenTiles.forEach((tile) => {
      if (tile.isFrozen && !tile.isClearing && prevFallingIdsRef.current.has(tile.id)) {
        const el = document.getElementById(`hex-tile-${tile.id}`);
        if (el && !prefersReducedMotion) {
          gsap.fromTo(
            el,
            { y: -7 },
            {
              y: 0,
              duration: 0.25,
              ease: 'back.out(1.4)',
              overwrite: 'auto',
            }
          );
        }
      }
    });

    prevFallingIdsRef.current = currentFallingIds;
  }, [uniqueFrozenTiles]);

  const hasSideWalls = wallLeft > 2 || wallRight < boardWidth - 2;

  return (
    <div className="relative w-full h-full min-h-0 min-w-0 flex items-center justify-center select-none touch-none overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${boardWidth} ${boardHeight}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={handleBoardPointerDown}
        style={{ touchAction: 'none' }}
        className="w-full h-full max-h-full max-w-full rounded-2xl shadow-2xl bg-slate-900/95 border border-slate-800 cursor-pointer"
      >
        <defs>
          {/* Subtle canvas background gradient */}
          <radialGradient id="boardGlow" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0b1120" stopOpacity="1" />
          </radialGradient>

          {/* Normal frozen tile gradient */}
          <linearGradient id="tileGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="60%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Neon Tile Skin */}
          <linearGradient id="neonTileGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="60%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#311042" />
          </linearGradient>

          {/* Candy Tile Skin */}
          <linearGradient id="candyTileGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fdf2f8" />
            <stop offset="50%" stopColor="#fce7f3" />
            <stop offset="100%" stopColor="#fbcfe8" />
          </linearGradient>

          {/* Gold Edge Tile Skin */}
          <linearGradient id="goldTileGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fefce8" />
            <stop offset="60%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>

          {/* Selected tile gradient */}
          <linearGradient id="selectedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>

          {/* Falling tile gradient */}
          <linearGradient id="fallingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="70%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* Clearing tile gradient */}
          <linearGradient id="clearingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>

          {/* Press flash shimmer gradient */}
          <linearGradient id="pressFlashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#fef9c3" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fde047" stopOpacity="0.7" />
          </linearGradient>

          {/* Drop shadow for 3D tile feel */}
          <filter id="tileShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.45" />
          </filter>

          {/* Glow filter for selected tile */}
          <filter id="selectGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#eab308" floodOpacity="0.8" />
          </filter>

          {/* Glow for falling tile */}
          <filter id="fallingGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#06b6d4" floodOpacity="0.6" />
          </filter>

          {/* Neon Glow filter */}
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.9" />
          </filter>
          {/* Ambient Ceiling Danger Vignette Gradient (Proposal 2: pure radial gradient, no blur filters) */}
          <radialGradient id="dangerCeilingVignette" cx="50%" cy="0%" r="85%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
            <stop offset="35%" stopColor="#ef4444" stopOpacity="0.2" />
            <stop offset="70%" stopColor="#dc2626" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Board Background */}
        <rect width={boardWidth} height={boardHeight} fill="url(#boardGlow)" />

        {/* Proposal 2: Ambient Ceiling Danger Vignette (pure CSS/SVG radial gradient, no blur filters) */}
        <rect
          width={boardWidth}
          height={boardHeight}
          fill="url(#dangerCeilingVignette)"
          pointerEvents="none"
          className={`transition-opacity duration-300 ${
            nearCeiling ? 'opacity-100 animate-danger-vignette' : 'opacity-0'
          }`}
          style={{ willChange: 'opacity' }}
        />

        {/* Side Walls (when tighter than 100% in Free Play settings) */}
        {hasSideWalls && (
          <g pointerEvents="none">
            {/* Shaded margin outside left wall */}
            <rect x="0" y="0" width={wallLeft} height={groundY} fill="#020617" opacity="0.55" />
            <line
              x1={wallLeft}
              y1="0"
              x2={wallLeft}
              y2={groundY}
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.75"
            />

            {/* Shaded margin outside right wall */}
            <rect
              x={wallRight}
              y="0"
              width={boardWidth - wallRight}
              height={groundY}
              fill="#020617"
              opacity="0.55"
            />
            <line
              x1={wallRight}
              y1="0"
              x2={wallRight}
              y2={groundY}
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.75"
            />
          </g>
        )}

        {/* Ceiling Danger Line (placed at ceilingY) */}
        <g className={nearCeiling ? 'animate-pulse' : ''} pointerEvents="none">
          <line
            x1={hasSideWalls ? wallLeft : 12}
            y1={ceilingY}
            x2={hasSideWalls ? wallRight : boardWidth - 12}
            y2={ceilingY}
            stroke={nearCeiling ? '#ef4444' : '#64748b'}
            strokeWidth={nearCeiling ? '2.5' : '1.8'}
            strokeDasharray={nearCeiling ? '5 5' : '3 3'}
            opacity={nearCeiling ? 0.95 : 0.65}
          />
          <text
            x={hasSideWalls ? wallRight - 8 : boardWidth - 18}
            y={ceilingY - 6}
            textAnchor="end"
            fontSize="10"
            fontWeight="700"
            fill={nearCeiling ? '#ef4444' : '#64748b'}
            opacity={nearCeiling ? 1 : 0.8}
            className="tracking-wider uppercase"
          >
            {nearCeiling ? 'Danger · Ceiling' : 'Ceiling'}
          </text>
        </g>

        {/* One Continuous Flat Ground Line across the whole width */}
        <g pointerEvents="none">
          <line
            x1="0"
            y1={groundY}
            x2={boardWidth}
            y2={groundY}
            stroke="#475569"
            strokeWidth="3.5"
          />
          <rect
            x="0"
            y={groundY}
            width={boardWidth}
            height={boardHeight - groundY}
            fill="#0f172a"
            opacity="0.9"
          />
          <text
            x={boardWidth / 2}
            y={groundY + 18}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="#64748b"
            className="tracking-widest uppercase select-none"
          >
            Ground
          </text>
        </g>

        {/* Frozen Hexagons */}
        <g pointerEvents="none">
          {uniqueFrozenTiles.map((tile) => {
            const isSelected = selectedMap.has(tile.id);
            const selectionNum = selectedMap.get(tile.id);
            const isClearing = tile.isClearing;
            const isPulsing = pulsingTileIds.has(tile.id);

            // Fill and Stroke styling
            const baseFill = 'url(#tileGradient)';
            const baseStroke = '#94a3b8';
            const textColor = '#0f172a';
            const strokeW = isSelected ? '2.5' : '1.5';
            // Perf: SVG filters re-rasterize every frame while tiles move; only selected tiles get one.
            const filterEffect = isSelected ? 'url(#selectGlow)' : undefined;

            const fill = isClearing
              ? 'url(#clearingGradient)'
              : isSelected
              ? 'url(#selectedGradient)'
              : baseFill;

            const stroke = isClearing
              ? '#22c55e'
              : isSelected
              ? '#ca8a04'
              : baseStroke;

            const textFill = isClearing ? '#14532d' : isSelected ? '#713f12' : textColor;

            return (
              <g
                id={`hex-tile-${tile.id}`}
                key={tile.id}
              >
                {/* Tile Base Polygon */}
                {isRareLetterDisplay(tile.letter.display) && !isClearing && (
                  <polygon
                    points={getHexPolygonPoints(tile.x, tile.y, tileRadius + 1.5 * scale)}
                    fill="none"
                    stroke="#c4b5fd"
                    strokeWidth={5 * scale}
                    strokeOpacity={0.55}
                    pointerEvents="none"
                  />
                )}
                {!isSelected && !isClearing && (
                  <polygon
                    points={getHexPolygonPoints(tile.x, tile.y + 2.5 * scale, tileRadius - 0.5)}
                    fill="#000000"
                    opacity={0.35}
                  />
                )}
                <polygon
                  points={getHexPolygonPoints(tile.x, tile.y, tileRadius - 0.5)}
                  fill={fill}
                  stroke={isPulsing ? '#fef08a' : stroke}
                  strokeWidth={isPulsing ? '2.5' : strokeW}
                  filter={filterEffect}
                />

                {/* Inner highlight rim */}
                <polygon
                  points={getHexPolygonPoints(tile.x, tile.y, Math.max(1, tileRadius - 3 * scale))}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={isPulsing ? '1.8' : '1'}
                  opacity={isPulsing ? 0.9 : 0.45}
                />

                {/* Brief light flash / shimmer overlay on press (no motion) */}
                {isPulsing && (
                  <polygon
                    points={getHexPolygonPoints(tile.x, tile.y, tileRadius - 0.5)}
                    fill="url(#pressFlashGradient)"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="animate-hex-flash"
                    pointerEvents="none"
                  />
                )}

                {/* Letter character */}
                <text
                  x={tile.x}
                  y={tile.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={tile.letter.display.length > 1 ? multiLetterFontSize : singleLetterFontSize}
                  fontWeight="900"
                  fill={textFill}
                  className="font-display select-none tracking-tight"
                >
                  {tile.letter.display}
                </text>

                {/* Selection sequence badge */}
                {isSelected && (
                  <g>
                    <circle
                      cx={tile.x + tileRadius - 9 * scale}
                      cy={tile.y - 12 * scale}
                      r={(isPhone ? 6.5 : 8) * scale}
                      fill="#0f172a"
                      stroke="#facc15"
                      strokeWidth={isPhone ? 1.5 * scale : 1.8 * scale}
                    />
                    <text
                      x={tile.x + tileRadius - 9 * scale}
                      y={tile.y - 11.5 * scale}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={((isPhone ? 7.5 : 9) * scale).toFixed(1)}
                      fontWeight="900"
                      fill="#facc15"
                      className="font-mono select-none"
                    >
                      {selectionNum}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Falling Hexagons */}
        <g pointerEvents="none">
          {activeFalling.map((ft) => {
            const isSelected = selectedMap.has(ft.id);
            const selectionNum = selectedMap.get(ft.id);
            const isClearing = ft.isClearing;
            const isPulsing = pulsingTileIds.has(ft.id);

            const fill = isClearing
              ? 'url(#clearingGradient)'
              : isSelected
              ? 'url(#selectedGradient)'
              : 'url(#fallingGradient)';

            const stroke = isClearing
              ? '#22c55e'
              : isSelected
              ? '#ca8a04'
              : '#0891b2';

            const textFill = isClearing ? '#14532d' : isSelected ? '#713f12' : '#083344';
            const filterEffect = isSelected ? 'url(#selectGlow)' : 'url(#fallingGlow)';

            return (
              <g
                id={`hex-tile-${ft.id}`}
                key={ft.id}
              >
                {isRareLetterDisplay(ft.letter.display) && !isClearing && (
                  <polygon
                    points={getHexPolygonPoints(ft.x, ft.y, tileRadius + 1.5 * scale)}
                    fill="none"
                    stroke="#c4b5fd"
                    strokeWidth={5 * scale}
                    strokeOpacity={0.55}
                    pointerEvents="none"
                  />
                )}
                <polygon
                  points={getHexPolygonPoints(ft.x, ft.y, tileRadius - 0.5)}
                  fill={fill}
                  stroke={isPulsing ? '#fef08a' : stroke}
                  strokeWidth={isPulsing || isSelected ? '2.5' : '2'}
                  filter={filterEffect}
                />

                <polygon
                  points={getHexPolygonPoints(ft.x, ft.y, Math.max(1, tileRadius - 3 * scale))}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={isPulsing ? '1.8' : '1.2'}
                  opacity={isPulsing ? 0.9 : 0.6}
                />

                {/* Brief light flash / shimmer overlay on press (no motion) */}
                {isPulsing && (
                  <polygon
                    points={getHexPolygonPoints(ft.x, ft.y, tileRadius - 0.5)}
                    fill="url(#pressFlashGradient)"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="animate-hex-flash"
                    pointerEvents="none"
                  />
                )}

                <text
                  x={ft.x}
                  y={ft.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={ft.letter.display.length > 1 ? multiLetterFontSize : singleLetterFontSize}
                  fontWeight="900"
                  fill={textFill}
                  className="font-display select-none tracking-tight"
                >
                  {ft.letter.display}
                </text>

                {/* Selection sequence badge */}
                {isSelected && (
                  <g>
                    <circle
                      cx={ft.x + tileRadius - 9 * scale}
                      cy={ft.y - 12 * scale}
                      r={(isPhone ? 6.5 : 8) * scale}
                      fill="#0f172a"
                      stroke="#facc15"
                      strokeWidth={isPhone ? 1.5 * scale : 1.8 * scale}
                    />
                    <text
                      x={ft.x + tileRadius - 9 * scale}
                      y={ft.y - 11.5 * scale}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={((isPhone ? 7.5 : 9) * scale).toFixed(1)}
                      fontWeight="900"
                      fill="#facc15"
                      className="font-mono select-none"
                    >
                      {selectionNum}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Floating Scores */}
        <g pointerEvents="none">
          {floatingScores.map((score) => (
            <text
              key={score.id}
              x={score.x}
              y={score.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="20"
              fontWeight="900"
              fill="#4ade80"
              stroke="#052e16"
              strokeWidth="3.5"
              paintOrder="stroke"
              className="font-display animate-float-fade select-none"
            >
              {score.text}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
};
