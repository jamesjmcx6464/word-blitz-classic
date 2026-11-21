// Adventure bonus Blitz letter queue: word-based, pre-validated, lesson letters only.
// Checks: queue >= computed capacity, word 1 in order, Boss words 2/3 scrambled as
// contiguous blocks, only the group's letters, no word repeats before the pool is used up.
import { ADVENTURE_BANDS, bonusSecondsFor } from '../src/utils/adventureConfig';
import {
  BonusLetterQueue,
  BonusWordDeck,
  allowedBonusLetters,
  bonusLetterCapacity,
  bonusWordsFor,
  validateBonusBatch,
  countTypeTriples,
  rhythmPossible,
  rhythmScrambles,
  RHYTHM_MAX_RUN,
  arrangeRhythm,
} from '../src/utils/adventureBonus';
import { drawLetter, resetLetterStreak } from '../src/utils/letterBag';
import { resolveLetterDraw, DEFAULT_LETTER_DISTRIBUTION } from '../src/utils/letterDistributions';

let fails = 0;
const fail = (m: string) => { fails++; if (fails < 25) console.log('FAIL', m); };
let rs = 987654;
const rnd = () => ((rs = (rs * 1103515245 + 12345) >>> 0) / 4294967296);

const cap30 = bonusLetterCapacity(30), cap60 = bonusLetterCapacity(60);
const phone30 = bonusLetterCapacity(30, 0.6, 390), phone60 = bonusLetterCapacity(60, 0.6, 390);
console.log(`capacity worst-case screen: 30s=${cap30} 60s=${cap60}; phone (x0.6, 390px): 30s=${phone30} 60s=${phone60}`);
if (!(cap30 > phone30 && cap60 > cap30 * 1.9)) fail('capacity scaling');

for (const level of ADVENTURE_BANDS.flatMap((b) => b.levels)) {
  const pool = bonusWordsFor(level);
  const allowed = allowedBonusLetters(level);
  const isBoss = level.kind === 'boss';
  const cap = bonusLetterCapacity(bonusSecondsFor(level));
  for (let trial = 0; trial < 200; trial++) {
    const practiced = trial % 2 ? pool.slice(0, 3).map((w) => w.toLowerCase()) : [];
    const q = new BonusLetterQueue(level, cap, practiced, rnd);
    if (q.remaining < cap) fail(`${level.id} queue ${q.remaining} < capacity ${cap}`);
    // Drain well past one batch so refills are exercised.
    const drawn: string[] = [];
    for (let i = 0; i < cap * 2 + 5; i++) drawn.push(q.next());
    if (drawn.some((ch) => !allowed.has(ch))) fail(`${level.id} letter outside group`);
    let offset = 0;
    const allWords: string[] = [];
    for (const batch of q.batches) {
      const probs = validateBonusBatch(batch, allowed);
      if (probs.length) fail(`${level.id} ${probs.join(';')}`);
      // Word 1 drops in order (as consecutive tiles in the real drop stream)
      const w1 = batch.words[0];
      if (offset < drawn.length && drawn.slice(offset, offset + w1.length).join('') !== w1 && offset + w1.length <= drawn.length)
        fail(`${level.id} word 1 ${w1} not in order in stream`);
      if (isBoss) {
        if (batch.scrambled.length !== 2) fail(`${level.id} boss needs 2 scrambled words`);
        batch.scrambled.forEach(([s, e], i) => {
          const w = batch.words[i + 1];
          const block = batch.letters.slice(s, e).join('');
          if (e - s !== w.length) fail(`${level.id} word ${i + 2} not contiguous`);
          if (block.split('').sort().join('') !== w.split('').sort().join('')) fail(`${level.id} word ${i + 2} letters`);
          if (new Set(w).size > 1 && block === w) fail(`${level.id} word ${i + 2} ${w} not scrambled`);
        });
        if (batch.scrambled[0]?.[0] !== w1.length) fail(`${level.id} word 2 does not follow word 1`);
      } else if (batch.scrambled.length) fail(`${level.id} level batch has scrambled blocks`);
      if (practiced.length && batch === q.batches[0]) {
        const firstN = batch.words.slice(0, 3).map((w) => w.toLowerCase()).sort().join();
        if (firstN !== practiced.slice().sort().join()) fail(`${level.id} practiced words not first`);
      }
      allWords.push(...batch.words);
      offset += batch.letters.length;
    }
    // No repeats inside each full pass through the pool
    for (let i = 0; i < allWords.length; i += pool.length) {
      const pass = allWords.slice(i, i + pool.length);
      if (new Set(pass).size !== pass.length) fail(`${level.id} word repeated before pool exhausted`);
    }
    for (let i = 1; i < allWords.length; i++) if (allWords[i] === allWords[i - 1] && pool.length > 1) fail(`${level.id} same word twice in a row`);
  }
  const q = new BonusLetterQueue(level, cap, [], rnd);
  console.log(`${level.id}: capacity ${cap}, first batch ${q.batches[0].words.length} words / ${q.batches[0].letters.length} letters, starts ${q.batches[0].words.slice(0, 3).join(' ')} → ${q.batches[0].letters.slice(0, 12).join('')}`);
}
// Deck: practiced first, then no repeats until exhausted
{
  const d = new BonusWordDeck(['A', 'B', 'C', 'D'], ['C'], rnd);
  const seq = Array.from({ length: 12 }, () => d.next());
  if (seq[0] !== 'C') fail('deck practiced first');
  for (let i = 0; i < 12; i += 4) if (new Set(seq.slice(i, i + 4)).size !== 4) fail('deck repeat in pass');
}

// Drop rhythm: no run of RHYTHM_MAX_RUN+1 (4) vowels / consonants in a row in shuffled letters (Y = consonant),
// including the joins (word 1 -> shuffled, Boss blocks, batch -> next batch's word 1).
{
  const TRIALS = 500;
  let segs = 0, impossibleSegs = 0, impossibleTriples = 0, cleanSegs = 0;
  let blocks = 0, blockNoScramble = 0, joins = 0, joinForced = 0, maxRunSeen = 0, impTripleRate = 0;
  const perBand = new Map<string, { segs: number; imp: number }>();
  for (const band of ADVENTURE_BANDS) for (const level of band.levels) {
    const cap = bonusLetterCapacity(bonusSecondsFor(level));
    let lvImpossible = 0, lvSegs = 0;
    const pb = perBand.get(band.id) ?? { segs: 0, imp: 0 };
    perBand.set(band.id, pb);
    for (let trial = 0; trial < TRIALS; trial++) {
      const q = new BonusLetterQueue(level, cap, [], rnd);
      for (let i = 0; i < cap * 2 + 5; i++) q.next();
      const stream: string[] = [];
      q.batches.forEach((batch, bi) => {
        const off = stream.length;
        const before = stream.slice(-RHYTHM_MAX_RUN);
        // Boss blocks
        for (const [bs, be] of batch.scrambled) {
          blocks++;
          const pre = [...stream, ...batch.letters].slice(0, off + bs).slice(-RHYTHM_MAX_RUN);
          const blk = batch.letters.slice(bs, be);
          const bad = countTypeTriples([...pre, ...blk], RHYTHM_MAX_RUN) > 0;
          if (bad) {
            const w = blk.slice().sort().join('');
            const word = batch.words[batch.scrambled.findIndex((r) => r[0] === bs) + 1];
            if (rhythmScrambles(word, pre).length) fail(`${level.id} boss block ${blk.join('')} breaks rhythm though a clean scramble exists (${w})`);
            else blockNoScramble++;
          }
        }
        // Shuffled tail (+ join into the next batch's word 1)
        const [s0, e0] = batch.shuffled;
        if (e0 - s0 !== batch.words.slice(level.kind === 'boss' ? 3 : 1).join('').length) fail(`${level.id} shuffled range`);
        const seg = batch.letters.slice(s0, e0);
        const pre = [...stream, ...batch.letters.slice(0, s0)].slice(-RHYTHM_MAX_RUN);
        const next = q.batches[bi + 1]?.letters.slice(0, RHYTHM_MAX_RUN) ?? [];
        const inside = countTypeTriples([...pre, ...seg], RHYTHM_MAX_RUN);
        const join = countTypeTriples([...pre, ...seg, ...next], RHYTHM_MAX_RUN + seg.length);
        segs++; lvSegs++;
        if (inside) {
          if (rhythmPossible(seg, pre)) fail(`${level.id} shuffled segment has ${inside} runs of 4 though possible: ${seg.join('')}`);
          else {
            impossibleSegs++; lvImpossible++; impossibleTriples += inside;
            // Must be spread evenly: no more triples than an even split forces.
            const nv = seg.filter((c) => 'AEIOU'.includes(c)).length, nc = seg.length - nv;
            const majV = nv > nc, maj = majV ? nv : nc, mn = majV ? nc : nv;
            let carry = 0; for (let i = pre.length - 1; i >= 0 && 'AEIOU'.includes(pre[i]) === majV; i--) carry++;
            const groups = mn + 1, tot = maj + carry, base = Math.floor(tot / groups), ex = tot - base * groups;
            const minimal = (groups - ex) * Math.max(0, base - RHYTHM_MAX_RUN) + ex * Math.max(0, base + 1 - RHYTHM_MAX_RUN);
            if (inside > minimal + 1) fail(`${level.id} impossible segment not spread evenly: ${inside} > ${minimal} ${seg.join('')}`);
            let run = 0, mr = 0; for (const ch of seg) { run = 'AEIOU'.includes(ch) === majV ? run + 1 : 0; mr = Math.max(mr, run); }
            maxRunSeen = Math.max(maxRunSeen, mr);
            impTripleRate += inside / seg.length;
          }
        } else cleanSegs++;
        if (next.length) {
          joins++;
          if (join) {
            // Allowed only if no clean arrangement of this segment can meet the next word 1.
            const alt = arrangeRhythm(seg, rnd, pre, next);
            if (countTypeTriples([...pre, ...alt, ...next], RHYTHM_MAX_RUN) === 0 && inside === 0) fail(`${level.id} batch join breaks rhythm though avoidable pre=${pre.join("")} seg=${seg.join("")} next=${next.join("")} w1=${q.batches[bi + 1].words[0]}`);
            else joinForced++;
          }
        }
        stream.push(...batch.letters);
        void before;
      });
    }
    pb.segs += lvSegs; pb.imp += lvImpossible;
    if (lvImpossible) console.log(`  rhythm ${level.id}: impossible-tail segments ${lvImpossible}/${lvSegs} (${((100 * lvImpossible) / lvSegs).toFixed(1)}%)`);
  }
  for (const [id, b] of perBand) console.log(`rhythm per adventure ${id}: impossible ${b.imp}/${b.segs} segments (${((100 * b.imp) / b.segs).toFixed(1)}%)`);
  console.log(`rhythm: ${segs} shuffled segments, ${cleanSegs} clean, impossible-tail ${impossibleSegs} (${((100 * impossibleSegs) / segs).toFixed(2)}%, ${impossibleTriples} runs-of-4 total, avg ${((100 * impTripleRate) / Math.max(1, impossibleSegs)).toFixed(1)} per 100 letters, longest run ${maxRunSeen}); boss blocks ${blocks}, no clean scramble ${blockNoScramble}; batch joins ${joins}, forced ${joinForced}`);
  // Unit: rule holds, multiset kept, impossible pools spread evenly
  const t = arrangeRhythm('AEBCDFGHJK'.split(''), rnd); // 2 vowels, 8 consonants: CCC V CCC V CC fits
  if (countTypeTriples(t) !== 0 || t.slice().sort().join('') !== 'ABCDEFGHJK') fail('arrangeRhythm basic');
  let anyRun3 = false;
  for (let i = 0; i < 50 && !anyRun3; i++) { const u = arrangeRhythm('ABCDEFGHI'.split(''), rnd); for (let j = 2; j < u.length; j++) if (!'AEIOU'.includes(u[j]) && !'AEIOU'.includes(u[j - 1]) && !'AEIOU'.includes(u[j - 2])) anyRun3 = true; }
  if (!anyRun3) fail('runs of 3 should now be allowed');
  const hard = arrangeRhythm('ABCDFGHJKLM'.split(''), rnd); // 1 vowel, 10 consonants
  if (hard.slice().sort().join('') !== 'ABCDFGHJKLM') fail('arrangeRhythm lost letters');
  let maxRun = 0, r = 0;
  for (const ch of hard) { r = 'AEIOU'.includes(ch) ? 0 : r + 1; maxRun = Math.max(maxRun, r); }
  if (maxRun > 7) fail(`impossible pool not spread: ${hard.join('')}`);
  if (countTypeTriples(arrangeRhythm(['Y', 'Y', 'Y', 'A', 'B', 'C'], rnd)) !== 0) fail('Y treated as vowel?');
}
// Arcade draw is untouched: the normal table still has all letters.
resetLetterStreak();
const arcade = resolveLetterDraw('normal', DEFAULT_LETTER_DISTRIBUTION);
const arcadeSeen = new Set<string>();
for (let i = 0; i < 4000; i++) arcadeSeen.add(drawLetter(arcade).value.replace('QU', 'Q')[0]);
if (arcadeSeen.size < 20) fail(`arcade draw looks restricted ${arcadeSeen.size}`);
if (fails) { console.log(`${fails} failures`); process.exit(1); }
console.log('ALL PASS');
