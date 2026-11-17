import {
  chargeAfterWord as W, chargeAfterMiss as M, chargeMultiplier as X, chargePct as P, chargeTierFor,
  chargeProfileFor as prof, chargeParFor, chargeGainFor as G, customParsToMax, MAX_CHARGE,
} from '../src/utils/chargeBar';
import { DEFAULT_CUSTOM_SETTINGS as DEF } from '../src/utils/customSettings';
let fails = 0;
const eq = (name: string, a: unknown, b: unknown) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', name, a, ok ? '' : `expected ${JSON.stringify(b)}`); };
const B = prof('beginner'), E = prof('easy'), N = prof('normal'), H = prof('hard'), NM = prof('nightmare');
eq('par gains B/E/N/H/NM', [B, E, N, H, NM].map((p) => p.parGain), [150, 120, 86, 60, 50]);
const parsTo4x = (p: typeof N) => { let c = 0, n = 0; while (c < MAX_CHARGE) { c = W(c, 4, 4, p); n++; } return n; };
eq('pars to 4x B/E/N/H/NM', [B, E, N, H, NM].map(parsTo4x), [4, 5, 7, 10, 12]);
eq('normal par4: 4→86 5→129 6→172 3→43 2→0', [4, 5, 6, 3, 2].map((l) => G(l, 4, N)), [86, 129, 172, 43, 0]);
eq('hard par4: 3→0, 4→60', [G(3, 4, H), G(4, 4, H)], [0, 60]);
eq('nightmare 2-under 0, 1-under 0', [G(3, 4, NM), G(3, 3, NM) > 0], [0, true]);
eq('beginner par3: 3→150 4→225 2→0', [G(3, 3, B), G(4, 3, B), G(2, 3, B)], [150, 225, 0]);
eq('easy par4: 3→60 2→0', [G(3, 4, E), G(2, 4, E)], [60, 0]);
eq('overflow carries: 1x 90% + beginner 4-letter par3 → 315', W(90, 4, 3, B), 315);
eq('cap at 4x', W(580, 7, 3, N), 600);
eq('par map', [{ preset: 'standard', sound: null }, { preset: 'cvc', sound: null }, { preset: 'blends', sound: null },
  { preset: 'standard', sound: 'u-e' }, { preset: 'standard', sound: 'ay' }, { preset: 'standard', sound: 'short-a' }, { preset: 'standard', sound: 'ck' }]
  .map((m) => chargeParFor(m as never)), [3, 3, 4, 4, 3, 3, 4]);
// Custom heuristic
eq('custom default (= Normal settings) → 7', customParsToMax(DEF), 7);
eq('custom no saved settings → Normal', prof('custom', null).parGain, 86);
eq('custom slow/few/big/lots room/off + friendly → 4', customParsToMax({ ...DEF, fallSpeed: 100, lettersAtOnce: 2, tileRadius: 34, ceilingHeight: 45, speedUpPct: 0, letterMix: 'friendly' }), 4);
eq('custom very fast/lots/small/not much/a lot/tricky/narrow → 12', customParsToMax({ ...DEF, fallSpeed: 360, lettersAtOnce: 5, tileRadius: 26, ceilingHeight: 115, speedUpPct: 10, letterMix: 'tricky', wallWidthPct: 60 }), 12);
eq('custom fast only → between 7 and 12', (() => { const v = customParsToMax({ ...DEF, fallSpeed: 260 }); return v > 7 && v < 12; })(), true);
eq('custom penalty tier = normal', prof('custom', DEF).tier, 'normal');
// Misses (unchanged)
eq('mult at 105', X(105), 1.5);
eq('pct at 105', P(105), 5);
eq('4x pct full', P(600), 100);
eq('borrow: 1.5x 5% -12 -> 1x 93%', M(105, 'beginner'), 93);
eq('borrow normal: 1.5x 10% -50 -> 1x 60%', M(110, 'normal'), 60);
eq('floor 1x 0%', M(20, 'normal'), 0);
eq('hard: 2x 70% -> 1.5x 0%', M(270, 'hard'), 100);
eq('hard at 4x -> 3.5x 0%', M(600, 'hard'), 500);
eq('tiers', ['beginner', 'easy', 'normal', 'custom', 'hard', 'nightmare'].map((d) => chargeTierFor(d as never)), ['beginner', 'beginner', 'normal', 'normal', 'hard', 'hard']);

// Informational: words / minutes to 4x (no mistakes, 6.5 words/min) using the board-sim length mix.
const MIX: Record<string, { par: 3 | 4; dist: [number, number][] }> = {
  'u-e': { par: 4, dist: [[3, 8], [4, 79], [5, 6], [6, 7]] },
  cvc: { par: 3, dist: [[3, 90], [4, 9], [5, 1]] },
  standard: { par: 3, dist: [[3, 64], [4, 30], [5, 5], [6, 1]] },
};
let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (d: [number, number][]) => { const t = d.reduce((s, [, w]) => s + w, 0); let r = rnd() * t; for (const [l, w] of d) { if ((r -= w) <= 0) return l; } return d[d.length - 1][0]; };
const rows: string[] = [];
for (const [m, { par, dist }] of Object.entries(MIX)) {
  const cells = (['beginner', 'easy', 'normal', 'hard', 'nightmare'] as const).map((d) => {
    const p = prof(d); let tot = 0; const R = 2000;
    for (let i = 0; i < R; i++) { let c = 0, n = 0; while (c < MAX_CHARGE && n < 500) { c = W(c, pick(dist), par, p); n++; } tot += n; }
    const w = tot / R; return `${d} ${w.toFixed(1)}w/${(w / 6.5).toFixed(1)}m`;
  });
  rows.push(`${m.padEnd(8)} ${cells.join(' | ')}`);
}
console.log('\nWords/min to 4x (sim length mix, 6.5 wpm):\n' + rows.join('\n'));
if (fails) { console.log(fails, 'failures'); process.exit(1); } else console.log('ALL PASS');
