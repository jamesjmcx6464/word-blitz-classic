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
// Arcade draw is untouched: the normal table still has all letters.
resetLetterStreak();
const arcade = resolveLetterDraw('normal', DEFAULT_LETTER_DISTRIBUTION);
const arcadeSeen = new Set<string>();
for (let i = 0; i < 4000; i++) arcadeSeen.add(drawLetter(arcade).value.replace('QU', 'Q')[0]);
if (arcadeSeen.size < 20) fail(`arcade draw looks restricted ${arcadeSeen.size}`);
if (fails) { console.log(`${fails} failures`); process.exit(1); }
console.log('ALL PASS');
