// Each bonus Blitz may only spawn letters from its own lesson words (Boss: every word in its band).
import { ADVENTURE_BANDS, wordsForBand, wordsForLevel } from '../src/utils/adventureConfig';
import { allowedBonusLetters, bonusLetterDraw, bonusWordsFor } from '../src/utils/adventureBonus';
import { drawLetter, resetLetterStreak } from '../src/utils/letterBag';
import { resolveLetterDraw, DEFAULT_LETTER_DISTRIBUTION } from '../src/utils/letterDistributions';

let fails = 0;
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const lettersOf = (words: { word: string }[]) => new Set(words.map((e) => e.word.toUpperCase()).join('').split(''));
for (const level of ADVENTURE_BANDS.flatMap((b) => b.levels)) {
  const bandLetters = lettersOf(wordsForBand(level.band));
  const lessonLetters = lettersOf(wordsForLevel(level));
  const allowed = allowedBonusLetters(level);
  const draw = bonusLetterDraw(level);
  const words = bonusWordsFor(level);
  if (level.band === 'spark' && level.soundGroup) {
    const vowel = level.soundGroup.slice(-1);
    const vowels = [...allowed].filter((l) => VOWELS.has(l));
    if (vowels.join('') !== vowel) { fails++; console.log('FAIL', level.id, 'vowels', vowels); }
  }
  // Exactly the lesson's letters (Boss: exactly the band's letters), never another band's extras.
  const want = level.soundGroup ? lessonLetters : bandLetters;
  if ([...allowed].some((l) => !want.has(l)) || allowed.size !== want.size) {
    fails++; console.log('FAIL', level.id, 'allowed letters', [...allowed].sort().join(''));
  }
  if ([...allowed].some((l) => !bandLetters.has(l))) { fails++; console.log('FAIL', level.id, 'letter outside band'); }
  if (draw.table.some((t) => !allowed.has(t.letter))) { fails++; console.log('FAIL', level.id, 'table has extra letters'); }
  resetLetterStreak();
  const seen = new Map<string, number>();
  let wordHits = 0, stream = '';
  for (let i = 0; i < 2000; i++) {
    const l = drawLetter(draw).value;
    seen.set(l, (seen.get(l) ?? 0) + 1);
    stream += l;
    if (!allowed.has(l)) { fails++; if (fails < 10) console.log('FAIL', level.id, 'drew', l); }
  }
  for (const w of words) if (stream.includes(w)) wordHits++;
  console.log(`${level.id}: 2000 draws, letters ${[...seen.keys()].sort().join('')} (allowed ${[...allowed].sort().join('')}), ${wordHits}/${words.length} lesson words seen whole`);
  if (wordHits < Math.min(5, words.length)) { fails++; console.log('FAIL', level.id, 'seed words rarely appear'); }
}
// Arcade draw is untouched by bonus state: after a bonus draw, the arcade table still has all 26 letters.
resetLetterStreak();
const arcade = resolveLetterDraw('normal', DEFAULT_LETTER_DISTRIBUTION);
const arcadeSeen = new Set<string>();
for (let i = 0; i < 4000; i++) arcadeSeen.add(drawLetter(arcade).value.replace('QU', 'Q')[0]);
if (arcadeSeen.size < 20) { fails++; console.log('FAIL arcade draw looks restricted', arcadeSeen.size); }
if (fails) { console.log(`${fails} failures`); process.exit(1); }
console.log('ALL PASS');
