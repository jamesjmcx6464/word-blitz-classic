// Every seed/sample word in every letter category must be a dictionary word AND pass its own category check.
import { isValidWord } from '../src/data/dictionary';
import { isWordInGroup } from '../src/utils/groupStreak';
import { SOUND_FOCUS, SOUND_FOCUS_IDS, PRESET_WORDS } from '../src/data/phonicsLists';

let fails = 0;
let total = 0;
const check = (mode: string, w: string, ok: boolean, why: string) => {
  total++;
  if (!ok) { fails++; console.log('FAIL', mode, w, why); }
};
for (const id of SOUND_FOCUS_IDS) {
  const def = SOUND_FOCUS[id];
  for (const w of new Set([...def.words, ...def.samples])) {
    check(id, w, isValidWord(w), 'not in dictionary');
    check(id, w, isWordInGroup(w, { preset: 'standard', sound: id }), 'fails category rule');
  }
}
for (const [p, words] of Object.entries(PRESET_WORDS)) {
  for (const w of words) {
    check(p, w, isValidWord(w), 'not in dictionary');
    check(p, w, isWordInGroup(w, { preset: p as never, sound: null }), 'fails category rule');
  }
}
if (fails) { console.log(`${fails} failures / ${total} checks`); process.exit(1); }
console.log(`ALL PASS (${total} checks)`);
