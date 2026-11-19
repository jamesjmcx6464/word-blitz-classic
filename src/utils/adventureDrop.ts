import { HexTile } from '../types/game';
import { SPAWN_Y, assignLeastFilledColumns, evenColumnCenters } from './hexPhysics';

/**
 * Pure, column-slot physics for Adventure Mode's fixed letter set.
 *
 * Every tile belongs to one column. Its resting spot is decided by how many
 * tiles sit below it in that column, so two tiles can never land in the same
 * place (the old time-released queue + findLandingY could stack two tiles at
 * the exact same x/y after a frame stall, hiding a letter).
 */

export interface DropGeometry {
  boardWidth: number;
  groundY: number;
  tileRadius: number;
}

export interface DropTile extends HexTile {
  col: number;
}

export interface TileSpec {
  id: string;
  letter: string;
}

/** Extra space between stacked rows and between columns (board units). */
export const ROW_GAP = 2;
export const COLUMN_GAP = 6;
/** Margin added to one full tile height between consecutive spawns. */
export const SPAWN_MARGIN = 8;

const hexH = (r: number) => (Math.sqrt(3) * r) / 2;

/** Vertical distance between consecutive spawns: one full tile height plus a margin. */
export function spawnStagger(r: number): number {
  return 2 * hexH(r) + SPAWN_MARGIN;
}

/** Centre-to-centre distance between stacked rows. */
export function rowPitch(r: number): number {
  return 2 * hexH(r) + ROW_GAP;
}

/** Centre y of the tile resting in `row` (0 = on the ground). */
export function restY(geo: DropGeometry, row: number): number {
  return geo.groundY - hexH(geo.tileRadius) - row * rowPitch(geo.tileRadius);
}

/**
 * True when two flat-topped hexes of radius r overlap (touching edges is fine).
 * Uses the exact Minkowski hexagon of radius 2r.
 */
export function hexesOverlap(a: { x: number; y: number }, b: { x: number; y: number }, r: number): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  if (dx >= 2 * r - 0.01) return false;
  const limit = dx <= r ? Math.sqrt(3) * r : Math.sqrt(3) * (2 * r - dx);
  return dy < limit - 0.01;
}

/** Pairs of tiles that overlap or share a cell (dev assertion + tests). */
export function findOverlaps<T extends { id: string; x: number; y: number }>(tiles: T[], r: number): [string, string][] {
  const out: [string, string][] = [];
  for (let i = 0; i < tiles.length; i++)
    for (let j = i + 1; j < tiles.length; j++)
      if (hexesOverlap(tiles[i], tiles[j], r)) out.push([tiles[i].id, tiles[j].id]);
  return out;
}

/**
 * Builds ALL tile objects off screen (above the board) in one go. Nothing is
 * released on a timer: tile i simply starts i*spawnStagger() higher, so the
 * cascade looks staggered but no frame stall can make two tiles coincide.
 */
export function buildDropTiles(specs: TileSpec[], geo: DropGeometry, rand: () => number): DropTile[] {
  if (specs.length === 0) return [];
  const centers = evenColumnCenters(geo.boardWidth, specs.length, geo.tileRadius, COLUMN_GAP);
  const cols = assignLeastFilledColumns(specs.length, centers.length, rand);
  const top = SPAWN_Y - geo.tileRadius;
  // Each tile starts a full tile height (+margin) above the previous one, so no
  // tile is ever created inside another, whatever column it is in.
  const stagger = spawnStagger(geo.tileRadius);
  return specs.map((s, i) => ({
    id: s.id,
    col: cols[i],
    letter: { display: s.letter, value: s.letter },
    x: centers[cols[i]],
    y: top - i * stagger,
    targetY: top - i * stagger,
    isFrozen: false,
    isFalling: true,
    isSelected: false,
  }));
}

/**
 * Assigns each column's tiles (lowest first) to rows 0,1,2... and moves every
 * falling tile down by `step`, landing it exactly on its row. Clearing tiles
 * keep their place and still count as occupying their slot. Never drops a tile.
 */
export function stepDrop(tiles: DropTile[], geo: DropGeometry, step: number): { tiles: DropTile[]; busy: boolean } {
  const byCol = new Map<number, DropTile[]>();
  for (const t of tiles) {
    const list = byCol.get(t.col) ?? [];
    list.push(t);
    byCol.set(t.col, list);
  }
  const next = new Map<string, DropTile>();
  let busy = false;
  for (const list of byCol.values()) {
    // Lowest (largest y) first; stable tie-break on id
    list.sort((a, b) => (b.y - a.y) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    list.forEach((t, row) => {
      const target = restY(geo, row);
      if (t.isClearing) {
        next.set(t.id, t);
        return;
      }
      if (t.y >= target - 0.01) {
        // At its slot, or already overlapping the tile below (frame stall, geometry
        // change): snap up to its own free cell instead of passing through.
        next.set(t.id, t.isFrozen && t.y === target ? t : { ...t, y: target, targetY: target, isFalling: false, isFrozen: true });
        return;
      }
      const ny = t.y + step;
      if (ny >= target) {
        next.set(t.id, { ...t, y: target, targetY: target, isFalling: false, isFrozen: true });
      } else {
        busy = true;
        next.set(t.id, { ...t, y: ny, targetY: target, isFalling: true, isFrozen: false });
      }
    });
  }
  return { tiles: tiles.map((t) => next.get(t.id) ?? t), busy };
}

/** After a clear: anything above a gap starts falling again. */
export function loosenAfterClear(tiles: DropTile[], geo: DropGeometry): DropTile[] {
  const byCol = new Map<number, DropTile[]>();
  for (const t of tiles) {
    const list = byCol.get(t.col) ?? [];
    list.push(t);
    byCol.set(t.col, list);
  }
  const out = new Map<string, DropTile>();
  for (const list of byCol.values()) {
    list.sort((a, b) => b.y - a.y);
    list.forEach((t, row) => {
      const target = restY(geo, row);
      out.set(t.id, t.y < target - 0.01 ? { ...t, isFrozen: false, isFalling: true, targetY: target } : t);
    });
  }
  return tiles.map((t) => out.get(t.id) ?? t);
}

/** Multiset helpers shared by validation, tests and the dev assertion. */
export function letterCounts(letters: Iterable<string>): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of letters) m.set(l, (m.get(l) ?? 0) + 1);
  return m;
}

export function sameMultiset(a: Iterable<string>, b: Iterable<string>): boolean {
  const ma = letterCounts(a);
  const mb = letterCounts(b);
  if (ma.size !== mb.size) return false;
  for (const [k, v] of ma) if (mb.get(k) !== v) return false;
  return true;
}
