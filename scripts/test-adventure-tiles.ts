// Round letter builder + drop physics: every round's tiles are exactly its words' letters,
// and the column drop never loses, overlaps, or misplaces a tile (even with huge frame stalls).
import { ADVENTURE_LEXICON } from '../src/data/adventureLexicon';
import { ADVENTURE_BANDS, wordsForBand } from '../src/utils/adventureConfig';
import { buildLevelRounds, buildRoundTiles, validateRoundTiles, roundLetterMultiset } from '../src/utils/adventureWordSelect';
import { buildDropTiles, fitTileRadius, reflowTiles, stepDrop, loosenAfterClear, restY, rowPitch, sameMultiset, findOverlaps, DropTile } from '../src/utils/adventureDrop';
import { findLandingY } from '../src/utils/hexPhysics';

let fails = 0, rounds = 0, sims = 0;
const fail = (m: string) => { fails++; if (fails < 20) console.log('FAIL', m); };
const seen = new Set<string>();
const geos = [
  { boardWidth: 340, groundY: 300, tileRadius: 26 },
  { boardWidth: 390, groundY: 360, tileRadius: 26 },
  { boardWidth: 720, groundY: 420, tileRadius: 28 },
  { boardWidth: 340, groundY: 160, tileRadius: 26 },
];
let rs = 12345;
const rnd = () => ((rs = (rs * 1103515245 + 12345) >>> 0) / 4294967296);
const hexH = (r: number) => (Math.sqrt(3) * r) / 2;

function settle(tiles: DropTile[], geo: typeof geos[0], stall: boolean) {
  for (let i = 0; i < 5000; i++) {
    const step = stall && rnd() < 0.2 ? 52 : 520 * (0.004 + rnd() * 0.03);
    const r = stepDrop(tiles, geo, step);
    tiles = r.tiles;
    if (!r.busy) return tiles;
  }
  fail('never settled');
  return tiles;
}
function checkBoard(tiles: DropTile[], geo: typeof geos[0], want: string[], tag: string) {
  if (!sameMultiset(want, tiles.map((t) => t.letter.display))) fail(`${tag} multiset`);
  if (!tiles.every((t) => t.isFrozen)) fail(`${tag} not frozen`);
  if (findOverlaps(tiles, geo.tileRadius).length) fail(`${tag} overlapping tiles`);
  const pos = new Set<string>();
  const h = hexH(geo.tileRadius);
  for (const t of tiles) {
    const k = `${t.x.toFixed(2)},${t.y.toFixed(2)}`;
    if (pos.has(k)) fail(`${tag} overlap ${k}`);
    pos.add(k);
    if (t.y + h > geo.groundY + 0.01) fail(`${tag} below ground`);
    if (t.x - geo.tileRadius < -0.01 || t.x + geo.tileRadius > geo.boardWidth + 0.01) fail(`${tag} off board x`);
    if (t.y - h < -0.01) fail(`${tag} above board top`);
    const row = Math.round((geo.groundY - h - t.y) / rowPitch(geo.tileRadius));
    if (Math.abs(restY(geo, row) - t.y) > 0.01) fail(`${tag} not on a row`);
  }
}

const ALL_LEVELS = ADVENTURE_BANDS.flatMap((b) => b.levels);
const BAND_WORDS = ADVENTURE_BANDS.flatMap((b) => wordsForBand(b.id));
for (const level of ALL_LEVELS) {
  const bandWords = wordsForBand(level.band);
  for (let seed = 1; seed <= 400; seed++) {
    const lr = buildLevelRounds(level.soundGroup, seed * 7919 + level.id.length, bandWords);
    const maxTiles = Math.max(...lr.map((r) => roundLetterMultiset(r).length));
    lr.forEach((words, idx) => {
      rounds++;
      if (words.length !== 4) fail(`${level.id} ${seed} round ${idx} has ${words.length} words`);
      words.forEach((w) => seen.add(w.id));
      const rseed = seed + idx * 17;
      const specs = buildRoundTiles(words, rseed, `d${seed}-r${idx}`);
      const probs = validateRoundTiles(words, specs);
      if (probs.length) fail(`${level.id} ${seed}/${idx} ${probs.join(';')}`);
      if (seed % 8 === 0) {
        for (const g of geos) {
          // Same radius fit AdventurePlay uses, so the biggest round never stacks above the board.
          const geo = { ...g, tileRadius: fitTileRadius(g.boardWidth, g.groundY, maxTiles, g.tileRadius) };
          sims++;
          let tiles = buildDropTiles(specs, geo, rnd);
          if (tiles.length !== specs.length) fail('drop tile count');
          if (findOverlaps(tiles, geo.tileRadius).length) fail('spawned overlapping');
          // Inject an overlap mid-fall: drop one tile right onto another in its column
          if (seed % 32 === 0 && tiles.length > 6) {
            const a = tiles[0]; const bi = tiles.findIndex((t, i) => i > 0 && t.col === a.col);
            if (bi > 0) tiles[bi] = { ...tiles[bi], y: a.y + 3 };
          }
          tiles = settle(tiles, geo, seed % 16 === 0);
          checkBoard(tiles, geo, roundLetterMultiset(words), `${level.id}/${seed}/${idx}`);
          // Viewport shrinks/grows mid-round (Android bars): reflow in place, never re-drop.
          if (seed % 32 === 8) {
            const g2 = { ...geo, groundY: Math.max(150, geo.groundY - 44) };
            const geo2 = { ...g2, tileRadius: fitTileRadius(g2.boardWidth, g2.groundY, maxTiles, g.tileRadius) };
            const moved = reflowTiles(tiles, geo2, tiles.length);
            if (moved.some((t) => !t.isFrozen)) fail('reflow unfroze a landed tile');
            if (moved.length !== tiles.length || moved.some((t, i) => t.id !== tiles[i].id)) fail('reflow lost tiles');
            checkBoard(settle(moved, geo2, false), geo2, roundLetterMultiset(words), `${level.id}/${seed}/${idx} reflow`);
            const back = reflowTiles(moved, geo, tiles.length);
            checkBoard(settle(back, geo, false), geo, roundLetterMultiset(words), `${level.id}/${seed}/${idx} reflow back`);
          }
          // Spell each word: remove its tiles, re-settle, re-check
          let left = words.slice();
          for (const w of words) {
            const pool = tiles.slice();
            const pick: string[] = [];
            for (const ch of w.word.toUpperCase()) {
              const i = pool.findIndex((t) => t.letter.display === ch && !pick.includes(t.id));
              if (i < 0) { fail(`cannot spell ${w.word}`); break; }
              pick.push(pool[i].id);
            }
            tiles = loosenAfterClear(tiles.filter((t) => !pick.includes(t.id)), geo);
            tiles = settle(tiles, geo, true);
            left = left.filter((x) => x !== w);
            checkBoard(tiles, geo, roundLetterMultiset(left), `${level.id}/${seed}/${idx} after ${w.word}`);
          }
          if (tiles.length) fail('tiles left after all words');
        }
      }
    });
  }
}
// Arcade findLandingY: a tile already overlapping a lower tile must land on top of it, never pass through.
{
  const r = 28, H = Math.sqrt(3) * r / 2, ground = 500;
  const base = { x: 100, y: ground - H };
  for (const off of [0, 3, 10, 30, 2 * H - 6]) {
    const y = base.y - off;
    const land = findLandingY(100, y, [base], ground, r);
    if (Math.abs(land - (base.y - 2 * H)) > 0.01) fail(`arcade overlap off=${off} landed ${land}`);
  }
  const slant = findLandingY(100 + 1.5 * r, base.y - 5, [base], ground, r);
  if (!(slant < base.y - 5)) fail('arcade slant overlap not snapped up');
  const stack = [base, { x: 100, y: base.y - 2 * H }];
  const up = findLandingY(100, base.y - 4, stack, ground, r);
  if (Math.abs(up - (base.y - 4 * H)) > 0.01) fail(`arcade overlap chain landed ${up}`);
  // Normal approach from above is unchanged
  if (Math.abs(findLandingY(100, 0, [base], ground, r) - (base.y - 2 * H)) > 0.01) fail('arcade normal landing changed');
  if (Math.abs(findLandingY(300, 0, [base], ground, r) - (ground - H)) > 0.01) fail('arcade ground landing changed');
}
const spark = BAND_WORDS.length;
if (seen.size !== spark) fail(`only ${seen.size}/${spark} adventure words appeared`);
// Every band's words come from the right lexicon band, and levels match the spreadsheet groups.
for (const b of ADVENTURE_BANDS) {
  const words = wordsForBand(b.id);
  if (words.length !== ADVENTURE_LEXICON.filter((e) => e.band === b.lexiconBand).length) fail(`${b.id} word count`);
  const groups = new Set(words.map((w) => w.soundGroup));
  const lessonGroups = new Set(b.levels.filter((l) => l.kind !== 'boss').map((l) => l.soundGroup));
  for (const g of groups) if (!lessonGroups.has(g)) fail(`${b.id} sound group ${g} has no level`);
  if (b.levels.filter((l) => l.kind === 'boss').length !== 1) fail(`${b.id} needs exactly one Boss`);
  if (b.levels.some((l) => l.band !== b.id)) fail(`${b.id} level with wrong band`);
}
// Direct builder check for every single word
for (const w of BAND_WORDS) for (let s = 0; s < 50; s++) {
  const p = validateRoundTiles([w], buildRoundTiles([w], s, 'x'));
  if (p.length) fail(`${w.word} ${p}`);
}
if (fails) { console.log(`${fails} failures`); process.exit(1); }
console.log(`ALL PASS (${rounds} rounds built, ${sims} drop sims, ${seen.size}/${spark} adventure words, bands ${ADVENTURE_BANDS.map((b) => b.id).join('+')})`);
