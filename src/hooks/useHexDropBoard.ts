import { useCallback, useEffect, useRef, useState } from 'react';
import { HexTile } from '../types/game';
import { FALL_SPEED_PIXELS_PER_SEC } from '../utils/hexPhysics';
import {
  DropTile,
  TileSpec,
  buildDropTiles,
  loosenAfterClear,
  stepDrop,
} from '../utils/adventureDrop';

/**
 * Fall/settle physics for boards that drop a fixed set of letters (Adventure
 * Mode). All tiles are created off screen at once and validated by the caller;
 * the hook then drops them into column slots (see utils/adventureDrop), so a
 * tile can never be discarded, overlap another, or land below the ground.
 */

export interface HexDropGeometry {
  boardWidth: number;
  groundY: number;
  tileRadius: number;
}

const CLEAR_ANIM_MS = 320;
/** Adventure tiles drop at twice the arcade base fall rate so a round starts quickly. */
const DROP_SPEED = FALL_SPEED_PIXELS_PER_SEC * 2;

export function useHexDropBoard(geometry: HexDropGeometry | null) {
  const [frozenTiles, setFrozenTiles] = useState<HexTile[]>([]);
  const [fallingTiles, setFallingTiles] = useState<HexTile[]>([]);
  const [settled, setSettled] = useState(false);
  const tilesRef = useRef<DropTile[]>([]);
  const geoRef = useRef<HexDropGeometry | null>(geometry);
  const specsRef = useRef<TileSpec[]>([]);
  const seedRef = useRef(1);
  const genRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  /** Tiles that have landed once stay in the frozen layer (re-settles animate there, as in the arcade). */
  const landedRef = useRef<Set<string>>(new Set());

  const publish = useCallback(() => {
    const all = tilesRef.current;
    for (const t of all) if (t.isFrozen) landedRef.current.add(t.id);
    setFrozenTiles(all.filter((t) => landedRef.current.has(t.id)));
    setFallingTiles(all.filter((t) => !landedRef.current.has(t.id)));
    setSettled(all.length > 0 && all.every((t) => t.isFrozen && !t.isClearing));
  }, []);

  const tick = useCallback(
    (now: number) => {
      rafRef.current = null;
      const geo = geoRef.current;
      if (!geo) return;
      const dt = Math.min((now - lastRef.current) / 1000, 0.1);
      lastRef.current = now;
      const { tiles, busy } = stepDrop(tilesRef.current, geo, DROP_SPEED * dt);
      tilesRef.current = tiles;
      publish();
      if (busy) rafRef.current = requestAnimationFrame(tick);
    },
    [publish]
  );

  const kick = useCallback(() => {
    if (rafRef.current !== null) return;
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const layout = useCallback(
    (specs: TileSpec[]) => {
      const geo = geoRef.current;
      landedRef.current = new Set();
      if (!geo || specs.length === 0) {
        tilesRef.current = [];
        publish();
        return;
      }
      // Seeded tie-breaks so a round's layout is varied but repeatable
      let s = seedRef.current >>> 0 || 1;
      const rand = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
      // Every tile exists (off screen) before the first frame of the drop.
      const tiles = buildDropTiles(specs, geo, rand);
      if (tiles.length !== specs.length || new Set(tiles.map((t) => t.id)).size !== specs.length) {
        console.warn('[adventure] drop tiles mismatch, rebuilding', tiles.length, specs.length);
        tilesRef.current = buildDropTiles(specs, geo, Math.random);
      } else {
        tilesRef.current = tiles;
      }
      publish();
      kick();
    },
    [kick, publish]
  );

  /** Drops a fresh, already validated set of tiles (in their jumbled order). */
  const dropLetters = useCallback(
    (specs: TileSpec[], seed: number) => {
      genRef.current++;
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
      seedRef.current = seed;
      specsRef.current = specs.slice();
      layout(specsRef.current);
    },
    [layout]
  );

  /** Clears tiles with the arcade clear animation, then re-settles the rest. */
  const clearTiles = useCallback(
    (ids: string[], onDone?: () => void) => {
      const idSet = new Set(ids);
      const gen = genRef.current;
      specsRef.current = specsRef.current.filter((l) => !idSet.has(l.id));
      tilesRef.current = tilesRef.current.map((t) => (idSet.has(t.id) ? { ...t, isClearing: true } : t));
      publish();
      const reduced =
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const timer = window.setTimeout(() => {
        // A newer round already replaced the board: nothing of ours is left to remove.
        if (gen === genRef.current) {
          const geo = geoRef.current;
          const remaining = tilesRef.current.filter((t) => !idSet.has(t.id));
          tilesRef.current = geo ? loosenAfterClear(remaining, geo) : remaining;
          publish();
          kick();
        }
        onDone?.();
      }, reduced ? 40 : CLEAR_ANIM_MS);
      timersRef.current.push(timer);
    },
    [kick, publish]
  );

  // Board resized. Only a change in width or tile size (rotation, window resize)
  // needs a fresh layout (of every tile still in play). A height-only change just
  // moves the ground, so shift every tile by the same amount - never re-drop.
  const geoKey = geometry ? `${geometry.boardWidth}|${geometry.groundY}|${geometry.tileRadius}` : '';
  const prevKeyRef = useRef(geoKey);
  useEffect(() => {
    const prev = geoRef.current;
    geoRef.current = geometry;
    if (prevKeyRef.current === geoKey) return;
    prevKeyRef.current = geoKey;
    if (!geometry || specsRef.current.length === 0) return;
    if (prev && prev.boardWidth === geometry.boardWidth && prev.tileRadius === geometry.tileRadius) {
      const dy = geometry.groundY - prev.groundY;
      if (dy !== 0) {
        tilesRef.current = tilesRef.current.map((t) => ({ ...t, y: t.y + dy, targetY: t.targetY + dy }));
        publish();
        kick();
      }
      return;
    }
    // Keep tiles that are mid-clear out of the new layout (they are already gone from specs).
    tilesRef.current = [];
    layout(specsRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoKey, layout, publish]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach((t) => clearTimeout(t));
    },
    []
  );

  return { frozenTiles, fallingTiles, settled, dropLetters, clearTiles };
}
