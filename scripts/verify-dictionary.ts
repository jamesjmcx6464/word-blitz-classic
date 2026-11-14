import { isValidWord, getWordScore, TOTAL_DICTIONARY_WORDS } from '../src/data/dictionary';

const mustBeValid = [
  'OK', 'AM', 'US', 'RE', 'SO',
  'SOMETHING', 'BEAUTIFUL', 'CHRISTMAS', 'HALLOWEEN', 'THANKSGIVING',
  'VALENTINE', 'VALENTINES', 'SANTA', 'HANUKKAH', 'KWANZAA', 'RAMADAN', 'DIWALI', 'HOLI',
  'VANCOUVER', 'TORONTO', 'ONTARIO', 'QUEBEC', 'ALBERTA', 'SASKATCHEWAN', 'NUNAVUT',
  'INTERNET', 'SELFIE', 'SELFIES', 'EMOJI', 'EMOJIS', 'WIFI', 'TEXTING', 'TEXTED',
  'HASHTAG', 'SMARTPHONE', 'HEADPHONES', 'BLUETOOTH',
  'INCLUDING', 'QUESTIONS', 'COUNTRIES', 'BEGINNING', 'SEVENTEEN',
  'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE', 'PLUTO',
  'ASIA', 'EUROPE', 'ANTARCTICA', 'ATLANTIC',
  'BUTTERFLY', 'CHOCOLATE', 'CLASSROOM', 'UNIVERSITY', 'GRANDMOTHER',
  'CONGRATULATIONS',
];

const mustBeInvalid = [
  'AA', 'QI', 'ZA', 'XU', 'MM', 'AU', 'UK',
  'VUG', 'QIS', 'PYX', 'ZAX', 'ADZ', 'SUQ',
  'A', 'X', '',
];

let failed = 0;
for (const w of mustBeValid) {
  if (!isValidWord(w)) {
    console.error(`EXPECTED VALID: ${w}`);
    failed += 1;
  }
}
for (const w of mustBeInvalid) {
  if (isValidWord(w)) {
    console.error(`EXPECTED INVALID: ${w}`);
    failed += 1;
  }
}

const scores: Array<[number, number]> = [
  [1, 0],
  [2, 4],
  [5, 32],
  [8, 256],
  [9, 512],
  [15, 32768],
  [22, 2 ** 22],
];
for (const [len, expected] of scores) {
  const got = getWordScore(len);
  if (got !== expected) {
    console.error(`SCORE 2^${len}: got ${got}, expected ${expected}`);
    failed += 1;
  }
}

if (TOTAL_DICTIONARY_WORDS < 100000) {
  console.error(`Dictionary looks too small: ${TOTAL_DICTIONARY_WORDS}`);
  failed += 1;
}

if (failed > 0) {
  console.error(`FAILED: ${failed} check(s)`);
  process.exit(1);
}

console.log(`OK: ${mustBeValid.length} adds valid, ${mustBeInvalid.length} removals invalid, scores match`);
console.log(`Playable set (with runtime additions): ${TOTAL_DICTIONARY_WORDS} words`);
