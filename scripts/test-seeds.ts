// Every seed/sample word in every letter category must be a dictionary word AND pass its own category check.
// Sound focus: top-20 lists, calculated weights (snapshot), multi-select combining, blends, save migration.
import fs from 'fs';
import { isValidWord } from '../src/data/dictionary';
import { isWordInGroup } from '../src/utils/groupStreak';
import { SOUND_FOCUS, SOUND_FOCUS_IDS, SOUND_FOCUS_MAX_WORD_LENGTH, SOUND_GROUPS, PRESET_WORDS, soundFocusSamples } from '../src/data/phonicsLists';
import {
  SOUND_FOCUS_WEIGHTS,
  combineFocusWeights,
  combinedSeedWords,
  computeFocusWeights,
  getLetterMixLabel,
  letterMixKey,
  parseLetterDistribution,
  resolveLetterDraw,
  toggleSound,
  FOCUS_LETTER_CAP,
} from '../src/utils/letterDistributions';
import { chargeParFor } from '../src/utils/chargeBar';

let fails = 0;
let total = 0;
const check = (mode: string, w: string, ok: boolean, why: string) => {
  total++;
  if (!ok) { fails++; if (fails < 40) console.log('FAIL', mode, w, why); }
};
for (const id of SOUND_FOCUS_IDS) {
  const def = SOUND_FOCUS[id];
  for (const w of new Set([...def.words, ...def.top20])) {
    check(id, w, isValidWord(w), 'not in dictionary');
    check(id, w, isWordInGroup(w, { preset: 'standard', sounds: [id] }), 'fails category rule');
    check(id, w, w.length <= SOUND_FOCUS_MAX_WORD_LENGTH, 'too long');
  }
  check(id, '', def.top20.length >= 18 && def.top20.length <= 20, `top20 has ${def.top20.length}`);
  check(id, '', def.top20.every((w) => def.words.includes(w)), 'top20 not in words');
  check(id, '', new Set(def.top20).size === def.top20.length, 'top20 duplicates');
  check(id, '', soundFocusSamples(id).length === 10, 'samples != 10');
  // Weights only use letters from the list plus the floor letters, sum ~100, capped.
  const wts = SOUND_FOCUS_WEIGHTS[id];
  const sum = Object.values(wts).reduce((a, b) => a + b, 0);
  check(id, '', Math.abs(sum - 100) < 0.2, `weights sum ${sum}`);
  check(id, '', Object.values(wts).every((v) => v <= FOCUS_LETTER_CAP + 0.01), 'weight over cap');
  for (const v of 'AEIOU') check(id, v, (wts[v] ?? 0) >= 1, 'vowel floor missing');
  check(id, '', JSON.stringify(wts) === JSON.stringify(computeFocusWeights(def.top20)), 'not computed from top20');
}
for (const g of SOUND_GROUPS) for (const id of g.ids) check(id, '', SOUND_FOCUS[id].group === g.label, 'group mismatch');
// Blends: initial blends start with the blend, final blends end with it; other words are outside the group.
check('bl', 'BLUE', isWordInGroup('BLUE', { preset: 'standard', sounds: ['bl'] }), 'initial');
check('bl', 'ABLE', !isWordInGroup('ABLE', { preset: 'standard', sounds: ['bl'] }), 'bl must be initial');
check('-st', 'NEST', isWordInGroup('NEST', { preset: 'standard', sounds: ['-st'] }), 'final');
check('-st', 'STOP', !isWordInGroup('STOP', { preset: 'standard', sounds: ['-st'] }), 'final only');
check('st', 'STOP', isWordInGroup('STOP', { preset: 'standard', sounds: ['st'] }), 'initial st');
check('st+-nd', 'HAND', isWordInGroup('HAND', { preset: 'standard', sounds: ['st', '-nd'] }), 'multi any');

// Snapshot of every calculated weight table (UPDATE_SNAPSHOT=1 to refresh after a list change).
const SNAP = 'scripts/sound-focus-weights.snapshot.json';
if (process.env.UPDATE_SNAPSHOT || !fs.existsSync(SNAP)) fs.writeFileSync(SNAP, JSON.stringify(SOUND_FOCUS_WEIGHTS, null, 1) + '\n');
const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
for (const id of SOUND_FOCUS_IDS) check(id, '', JSON.stringify(snap[id]) === JSON.stringify(SOUND_FOCUS_WEIGHTS[id]), 'weights drifted from snapshot');

// Combining: equal-weight average of normalized distributions; union of seed words.
{
  const c = combineFocusWeights(['oo', 'sh']);
  const letters = new Set([...Object.keys(SOUND_FOCUS_WEIGHTS.oo), ...Object.keys(SOUND_FOCUS_WEIGHTS.sh)]);
  for (const l of letters) {
    const want = ((SOUND_FOCUS_WEIGHTS.oo[l] ?? 0) + (SOUND_FOCUS_WEIGHTS.sh[l] ?? 0)) / 2;
    check('combine', l, Math.abs((c[l] ?? 0) - want) < 0.011, `avg ${c[l]} != ${want}`);
  }
  const sum = Object.values(c).reduce((a, b) => a + b, 0);
  check('combine', '', Math.abs(sum - 100) < 0.2, `sum ${sum}`);
  // Equal weight: a 50-word list (sh) and a 18-word list (gl) contribute the same share.
  const g = combineFocusWeights(['gl', 'sh']);
  check('combine', 'G', Math.abs((g.G ?? 0) - ((SOUND_FOCUS_WEIGHTS.gl.G ?? 0) + (SOUND_FOCUS_WEIGHTS.sh.G ?? 0)) / 2) < 0.011, 'equal weight');
  const seeds = combinedSeedWords(['oo', 'bl']);
  check('combine', '', seeds.length === new Set([...SOUND_FOCUS.oo.words, ...SOUND_FOCUS.bl.words]).size, 'seed union');
  const draw = resolveLetterDraw('normal', { preset: 'standard', sounds: ['oo', 'bl'] });
  check('combine', '', draw.seedWords?.length === seeds.length && draw.table.length === Object.keys(combineFocusWeights(['oo', 'bl'])).length, 'draw uses combined');
}
// Keys/labels: single focus keeps its old label; multi is order-independent.
check('label', '', getLetterMixLabel({ preset: 'standard', sounds: ['oo'] }) === 'Sound focus · oo', 'single label changed');
check('label', '', getLetterMixLabel({ preset: 'standard', sounds: ['sh', 'oo'] }) === getLetterMixLabel({ preset: 'standard', sounds: ['oo', 'sh'] }), 'multi label order');
check('key', '', letterMixKey({ preset: 'standard', sounds: ['sh', 'oo'] }) === 'sound:oo+sh', 'key');
// Migration of old single-select saves.
const m = parseLetterDistribution({ preset: 'standard', sound: 'ee' });
check('migrate', '', JSON.stringify(m.sounds) === '["ee"]', 'old sound');
check('migrate', '', parseLetterDistribution({ preset: 'cvc', sound: null }).sounds.length === 0, 'null sound');
check('migrate', '', JSON.stringify(parseLetterDistribution({ sounds: ['sh', 'bogus', 'oo', 'sh'] }).sounds) === '["oo","sh"]', 'sanitize');
check('toggle', '', JSON.stringify(toggleSound(toggleSound({ preset: 'standard', sounds: [] }, 'sh'), 'oo').sounds) === '["oo","sh"]', 'toggle on');
check('par', '', chargeParFor({ preset: 'standard', sounds: ['short-a', 'oo'] }) === 4, 'multi par');

for (const [p, words] of Object.entries(PRESET_WORDS)) {
  for (const w of words) {
    check(p, w, isValidWord(w), 'not in dictionary');
    check(p, w, isWordInGroup(w, { preset: p as never, sounds: [] }), 'fails category rule');
  }
}
if (fails) { console.log(`${fails} failures / ${total} checks`); process.exit(1); }
console.log(`ALL PASS (${total} checks, ${SOUND_FOCUS_IDS.length} sound focuses)`);
