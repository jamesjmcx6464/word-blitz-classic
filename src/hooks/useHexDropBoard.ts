import { useCallback, useEffect, useRef, useState } from 'react';
import { HexTile } from '../types/game';
import {
  FALL_SPEED_PIXELS_PER_SEC,
  SPAWN_Y,
  assignLeastFilledColumns,
  evenColumnCenters,
  findLandingY,
  regroundHexes,
} from '../utils/hexPhysics';

/**
 * A small, self-contained version of the arcade fall/settle physics for boards
 * that drop a fixed set of letters (Adventure Mode). It uses the same shared
 * hexPhysics helpers as the arcade loop (findLandingY for landing, regroundHexes
 * after a clear) but has no ceiling, no speed-up and no continuous spawning.
 */

export interface HexDropGeometry {
  boardWidth: number;
  groundY: number;
  tileRadius: number;
}

interface QueuedTile {
  tile: HexTile;
  releaseAt: number;
}

const CLEAR_ANIM_MS = 320;
const SPAWN_STAGGER_MS = 90;
/** Adventure tiles drop at twice the arcade base fall rate so a round starts quickly. */
const DROP_SPEED = FALL_SPEED_PIXELS_PER_SEC * 2;

export function useHexDropBoard(geometry: HexDropGeometry | null) {
  const [frozenTiles, setFrozenTiles] = useState<HexTile[]>([]);
  const [fallingTiles, setFallingTiles] = useState<HexTile[]>([]);
  const frozenRef = useRef<HexTile[]>([]);
  const fallingRef = useRef<HexTile[]>([]);
  const queueRef = useRef<QueuedTile[]>([]);
  const geoRef = useRef<HexDropGeometry | null>(geometry);
  const lettersRef = useRef<{ id: string; letter: string }[]>([]);
  const seedRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const publish = useCallback(() => {
    setFrozenTiles([...frozenRef.current]);
    setFallingTiles([...fallingRef.current]);
  }, []);

  const tick = useCallback(
    (now: number) => {
      rafRef.current = null;
      const geo = geoRef.current;
      if (!geo) return;
      const dt = Math.min((now - lastRef.current) / 1000, 0.1);
      lastRef.current = now;
      const step = DROP_SPEED * dt;
      let changed = false;

      // Release queued spawns
      if (queueRef.current.length > 0) {
        const ready = queueRef.current.filter((q) => q.releaseAt <= now);
        if (ready.length > 0) {
          queueRef.current = queueRef.current.filter((q) => q.releaseAt > now);
          fallingRef.current = [...fallingRef.current, ...ready.map((q) => q.tile)];
          changed = true;
        }
      }

      // 1. Newly spawned tiles falling in (lowest first so lower tiles land first)
      if (fallingRef.current.length > 0) {
        const list = [...fallingRef.current].sort((a, b) => b.y - a.y);
        const live = frozenRef.current.filter((t) => t.isFrozen);
        const still: HexTile[] = [];
        for (const tile of list) {
          if (tile.isClearing) {
            still.push(tile);
            continue;
          }
          const landY = findLandingY(tile.x, tile.y, live, geo.groundY, geo.tileRadius);
          const nextY = tile.y + step;
          if (nextY >= landY) {
            const landed = { ...tile, y: landY, isFalling: false, isFrozen: true };
            live.push(landed);
            frozenRef.current = [...frozenRef.current, landed];
          } else {
            still.push({ ...tile, y: nextY });
          }
        }
        fallingRef.current = still;
        changed = true;
      }

      // 2. Tiles knocked loose by a clear re-settle onto the ground/other tiles
      if (frozenRef.current.some((t) => t.isFalling && !t.isClearing)) {
        const live = frozenRef.current.filter((t) => t.isFrozen);
        const order = frozenRef.current
          .filter((t) => t.isFalling && !t.isClearing)
          .sort((a, b) => b.y - a.y);
        const updates = new Map<string, HexTile>();
        for (const tile of order) {
          const landY = findLandingY(tile.x, tile.y, live, geo.groundY, geo.tileRadius);
          const nextY = tile.y + step;
          if (nextY >= landY) {
            const landed = { ...tile, y: landY, isFalling: false, isFrozen: true };
            live.push(landed);
            updates.set(tile.id, landed);
          } else {
            updates.set(tile.id, { ...tile, y: nextY });
          }
        }
        frozenRef.current = frozenRef.current.map((t) => updates.get(t.id) ?? t);
        changed = true;
      }

      if (changed) publish();

      const busy =
        queueRef.current.length > 0 ||
        fallingRef.current.length > 0 ||
        frozenRef.current.some((t) => t.isFalling && !t.isClearing);
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
    (items: { id: string; letter: string }[]) => {
      const geo = geoRef.current;
      frozenRef.current = [];
      fallingRef.current = [];
      queueRef.current = [];
      if (!geo || items.length === 0) {
        publish();
        return;
      }
      // Seeded tie-breaks so a round's layout is varied but repeatable
      let s = seedRef.current >>> 0 || 1;
      const rand = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
      const centers = evenColumnCenters(geo.boardWidth, items.length, geo.tileRadius);
      const cols = assignLeastFilledColumns(items.length, centers.length, rand);
      const now = performance.now();
      queueRef.current = items.map((it, i) => ({
        releaseAt: now + i * SPAWN_STAGGER_MS,
        tile: {
          id: it.id,
          letter: { display: it.letter, value: it.letter },
          x: centers[cols[i]],
          y: SPAWN_Y - geo.tileRadius,
          targetY: SPAWN_Y,
          isFrozen: false,
          isFalling: true,
          isSelected: false,
        },
      }));
      publish();
      kick();
    },
    [kick, publish]
  );

  /** Drops a fresh set of letters (in the given, already jumbled order). */
  const dropLetters = useCallback(
    (letters: string[], seed: number, idPrefix: string) => {
      seedRef.current = seed;
      lettersRef.current = letters.map((letter, i) => ({ id: `${idPrefix}-${i}-${letter}`, letter }));
      layout(lettersRef.current);
    },
    [layout]
  );

  /** Clears tiles with the arcade clear animation, then re-settles the rest. */
  const clearTiles = useCallback(
    (ids: string[], onDone?: () => void) => {
      const idSet = new Set(ids);
      lettersRef.current = lettersRef.current.filter((l) => !idSet.has(l.id));
      frozenRef.current = frozenRef.current.map((t) => (idSet.has(t.id) ? { ...t, isClearing: true } : t));
      fallingRef.current = fallingRef.current.map((t) => (idSet.has(t.id) ? { ...t, isClearing: true } : t));
      publish();
      const reduced =
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const timer = window.setTimeout(() => {
        const geo = geoRef.current;
        fallingRef.current = fallingRef.current.filter((t) => !idSet.has(t.id));
        const remaining = frozenRef.current.filter((t) => !idSet.has(t.id));
        frozenRef.current = geo ? regroundHexes(remaining, geo.groundY, geo.tileRadius) : remaining;
        publish();
        kick();
        onDone?.();
      }, reduced ? 40 : CLEAR_ANIM_MS);
      timersRef.current.push(timer);
    },
    [kick, publish]
  );

  // Board resized. Only a change in width or tile size (rotation, window resize)
  // needs a fresh layout. A height-only change (e.g. the feedback line under the
  // spelled word appearing) just moves the ground, so shift every tile by the same
  // amount and keep the board exactly as it is - never re-drop from the top.
  const geoKey = geometry ? `${geometry.boardWidth}|${geometry.groundY}|${geometry.tileRadius}` : '';
  const prevKeyRef = useRef(geoKey);
  useEffect(() => {
    const prev = geoRef.current;
    geoRef.current = geometry;
    if (prevKeyRef.current === geoKey) return;
    prevKeyRef.current = geoKey;
    if (!geometry || lettersRef.current.length === 0) return;
    if (prev && prev.boardWidth === geometry.boardWidth && prev.tileRadius === geometry.tileRadius) {
      const dy = geometry.groundY - prev.groundY;
      if (dy !== 0) {
        const shift = (t: HexTile) => ({ ...t, y: t.y + dy, targetY: t.targetY + dy });
        frozenRef.current = frozenRef.current.map(shift);
        fallingRef.current = fallingRef.current.map(shift);
        publish();
      }
      return;
    }
    layout(lettersRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoKey, layout, publish]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach((t) => clearTimeout(t));
    },
    []
  );

  return { frozenTiles, fallingTiles, dropLetters, clearTiles };
}
