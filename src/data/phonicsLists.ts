/**
 * Classroom word lists and letter tables for Settings > Letters.
 *
 * Sources (2–4 letter words, classroom-appropriate):
 * - Sight Words: Dolch pre-primer–2nd + nouns, Fry Instant Words 1–300
 *   (ReadWriteThink, Mrs. Perkins, Lakeshore Learning).
 * - Short Vowels / CVC and short-vowel sounds: We Are Teachers CVC word-family list,
 *   minus uncommon padding words.
 * - Word Families: classic –at, –an, –ig, –op, –ug families.
 * - Blends & Digraphs and Sound focus: common K–2 phonics words containing
 *   the pattern (vowel teams, r-controlled, digraphs, magic e).
 */

export const SOUND_FOCUS_IDS = [
  'oo', 'ee', 'ea', 'ai', 'ay', 'oa', 'ow', 'ou', 'ar', 'or', 'er', 'sh', 'ch', 'th', 'ck', 'ng', 'short-a', 'short-e', 'short-i', 'short-o', 'short-u', 'a-e', 'i-e', 'o-e', 'u-e',
] as const;

export type SoundFocusId = (typeof SOUND_FOCUS_IDS)[number];

export const LETTER_PRESET_IDS = ['standard', 'sight', 'cvc', 'families', 'blends'] as const;
export type LetterPresetId = (typeof LETTER_PRESET_IDS)[number];

export type WeightMap = Partial<Record<string, number>>;

export interface SoundFocusDef {
  id: SoundFocusId;
  label: string;
  group: string;
  words: readonly string[];
  samples: readonly string[];
  weights: WeightMap;
  seedChance: number;
}

export const SOUND_GROUPS: { label: string; ids: SoundFocusId[] }[] = [
  { label: 'Vowel teams', ids: ['oo', 'ee', 'ea', 'ai', 'ay', 'oa', 'ow', 'ou'] },
  { label: 'R-controlled', ids: ['ar', 'or', 'er'] },
  { label: 'Digraphs', ids: ['sh', 'ch', 'th', 'ck', 'ng'] },
  { label: 'Short vowels', ids: ['short-a', 'short-e', 'short-i', 'short-o', 'short-u'] },
  { label: 'Magic e', ids: ['a-e', 'i-e', 'o-e', 'u-e'] },
];

export const SOUND_SEED_CHANCE = 0.4;

export const SOUND_FOCUS: Record<SoundFocusId, SoundFocusDef> = {
  'oo': {
    id: 'oo',
    label: 'oo',
    group: 'Vowel teams',
    words: ['TOO', 'ZOO', 'MOO', 'BOO', 'COO', 'GOO', 'WOO', 'FOOD', 'MOON', 'BOOK', 'LOOK', 'COOK', 'TOOK', 'GOOD', 'WOOD', 'HOOD', 'FOOT', 'COOL', 'POOL', 'TOOL', 'LOOP', 'HOOP', 'ROOM', 'BOOT', 'ROOT', 'SOON', 'NOON', 'ROOF', 'WOOL', 'BOOM', 'ZOOM', 'MOOD', 'POOR', 'DOOR', 'HOOK', 'NOOK', 'COOP', 'HOOT', 'HOOF', 'SOOT'],
    samples: ['BOOK', 'LOOK', 'MOON', 'FOOD', 'TOO', 'GOOD'],
    weights: { B:4.12, C:4.12, D:5.49, F:3.66, G:2.29, H:4.58, K:5.49, L:5.49, M:5.95, N:4.58, O:29.97, P:4.58, R:4.58, S:1.83, T:7.78, W:3.20, Z:2.29 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'ee': {
    id: 'ee',
    label: 'ee',
    group: 'Vowel teams',
    words: ['SEE', 'BEE', 'FEE', 'TEE', 'WEE', 'SEED', 'NEED', 'FEED', 'DEED', 'REED', 'WEED', 'FEET', 'MEET', 'BEEN', 'SEEN', 'DEER', 'KEEN', 'KEEP', 'DEEP', 'BEEP', 'PEEK', 'WEEK', 'SEEK', 'SEEM', 'FEEL', 'HEEL', 'PEEL', 'REEL', 'TEEN', 'TREE', 'FREE', 'BEEF', 'REEF', 'PEEP', 'JEEP', 'WEEP'],
    samples: ['SEE', 'TREE', 'FEET', 'NEED', 'KEEP', 'WEEK'],
    weights: { B:4.53, D:9.06, E:30.01, F:7.55, H:1.01, J:1.01, K:5.04, L:4.03, M:2.01, N:5.04, P:9.06, R:6.04, S:5.54, T:5.54, W:4.53 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'ea': {
    id: 'ea',
    label: 'ea',
    group: 'Vowel teams',
    words: ['EAT', 'SEA', 'TEA', 'PEA', 'EAR', 'LEAF', 'READ', 'LEAD', 'BEAT', 'MEAT', 'SEAT', 'HEAT', 'NEAT', 'FLEA', 'PLEA', 'BEAN', 'LEAN', 'MEAN', 'DEAR', 'FEAR', 'NEAR', 'YEAR', 'HEAR', 'PEAR', 'WEAR', 'TEAR', 'BEAK', 'LEAK', 'PEAK', 'WEAK', 'TEAM', 'BEAM', 'SEAM', 'HEAL', 'MEAL', 'REAL', 'EACH', 'EAST', 'HEAD', 'DEAD', 'DEAF', 'LEAP'],
    samples: ['EAT', 'READ', 'SEAT', 'LEAF', 'TEAM', 'BEAT'],
    weights: { A:20.01, B:2.94, C:0.74, D:5.15, E:20.00, F:2.94, H:3.68, K:2.94, L:7.36, M:4.42, N:3.68, P:4.05, R:8.47, S:3.31, T:8.10, W:1.47, Y:0.74 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'ai': {
    id: 'ai',
    label: 'ai',
    group: 'Vowel teams',
    words: ['AID', 'AIM', 'AIR', 'AIL', 'RAIN', 'PAID', 'LAID', 'MAID', 'WAIT', 'BAIT', 'TAIL', 'SAIL', 'FAIL', 'NAIL', 'PAIL', 'RAIL', 'JAIL', 'MAIL', 'PAIN', 'MAIN', 'GAIN', 'VAIN', 'FAIR', 'HAIR', 'PAIR', 'SAID'],
    samples: ['RAIN', 'TAIL', 'WAIT', 'MAIL', 'PAID', 'SAIL'],
    weights: { A:20.00, B:1.20, D:6.60, F:2.40, G:1.20, H:1.20, I:20.00, J:1.20, L:12.60, M:5.40, N:7.20, P:4.80, R:7.80, S:2.40, T:3.60, V:1.20, W:1.20 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'ay': {
    id: 'ay',
    label: 'ay',
    group: 'Vowel teams',
    words: ['DAY', 'SAY', 'MAY', 'WAY', 'PAY', 'LAY', 'BAY', 'HAY', 'JAY', 'RAY', 'PLAY', 'STAY', 'TRAY', 'CLAY', 'PRAY', 'GRAY', 'GREY', 'AWAY'],
    samples: ['DAY', 'PLAY', 'SAY', 'STAY', 'WAY', 'AWAY'],
    weights: { A:17.99, B:3.10, C:2.06, D:3.10, E:2.06, G:4.13, H:3.10, J:3.10, L:7.23, M:3.10, P:7.23, R:11.35, S:5.16, T:4.13, W:5.16, Y:18.00 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'oa': {
    id: 'oa',
    label: 'oa',
    group: 'Vowel teams',
    words: ['OAT', 'OAK', 'OAR', 'BOA', 'BOAT', 'COAT', 'GOAT', 'MOAT', 'ROAD', 'LOAD', 'TOAD', 'SOAP', 'FOAM', 'LOAN', 'MOAN', 'GOAL', 'COAL', 'FOAL', 'SOAK', 'ROAM'],
    samples: ['BOAT', 'COAT', 'ROAD', 'SOAP', 'GOAT', 'TOAD'],
    weights: { A:19.98, B:3.95, C:3.16, D:4.74, F:3.16, G:3.16, K:3.95, L:7.89, M:6.32, N:3.16, O:20.00, P:1.58, R:5.53, S:3.16, T:10.26 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'ow': {
    id: 'ow',
    label: 'ow',
    group: 'Vowel teams',
    words: ['COW', 'HOW', 'NOW', 'WOW', 'BOW', 'LOW', 'ROW', 'MOW', 'TOW', 'SOW', 'OWN', 'OWL', 'DOWN', 'TOWN', 'GOWN', 'SNOW', 'GROW', 'BLOW', 'SLOW', 'FLOW', 'SHOW', 'KNOW', 'CROW', 'BOWL'],
    samples: ['COW', 'DOWN', 'SNOW', 'GROW', 'HOW', 'SHOW'],
    weights: { B:5.19, C:3.70, D:1.48, F:1.48, G:2.96, H:3.70, K:1.48, L:10.37, M:2.22, N:11.85, O:19.51, R:5.19, S:6.67, T:3.70, W:20.50 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'ou': {
    id: 'ou',
    label: 'ou',
    group: 'Vowel teams',
    words: ['OUT', 'OUR', 'YOU', 'LOUD', 'FOUR', 'YOUR', 'POUR', 'SOUR', 'HOUR', 'SOUP', 'BOUT', 'POUT', 'NOUN', 'FOUL', 'OUCH', 'SOUL'],
    samples: ['OUT', 'LOUD', 'YOU', 'FOUR', 'YOUR', 'SOUP'],
    weights: { B:1.97, C:1.97, D:1.97, F:3.93, H:3.93, L:5.90, N:3.93, O:20.00, P:5.90, R:12.79, S:5.90, T:6.89, U:20.00, Y:4.92 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'ar': {
    id: 'ar',
    label: 'ar',
    group: 'R-controlled',
    words: ['CAR', 'FAR', 'BAR', 'JAR', 'TAR', 'ARM', 'ART', 'ARE', 'ARK', 'WAR', 'STAR', 'HARD', 'YARD', 'CARD', 'PARK', 'DARK', 'MARK', 'BARK', 'FARM', 'HARM', 'BARN', 'YARN', 'PART', 'CART', 'DART', 'MART', 'TART', 'HARP', 'WARM', 'SCAR', 'ARCH'],
    samples: ['CAR', 'STAR', 'FARM', 'PARK', 'HARD', 'DARK'],
    weights: { A:19.99, B:3.68, C:5.79, D:5.26, E:1.58, F:2.63, H:4.21, J:1.58, K:5.79, M:6.84, N:2.11, P:3.16, R:20.00, S:2.11, T:10.53, W:2.63, Y:2.11 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'or': {
    id: 'or',
    label: 'or',
    group: 'R-controlled',
    words: ['FOR', 'ORE', 'BORN', 'CORN', 'HORN', 'TORN', 'WORN', 'FORK', 'PORK', 'CORK', 'FORT', 'PORT', 'SORT', 'MORE', 'SORE', 'CORE', 'TORE', 'WORE', 'CORD', 'FORD', 'LORD', 'WORD', 'WORK', 'WORM', 'FORM', 'NORM'],
    samples: ['FOR', 'CORN', 'FORK', 'MORE', 'BORN', 'SORT'],
    weights: { B:1.18, C:4.71, D:4.71, E:7.65, F:6.47, H:1.18, K:4.71, L:1.18, M:4.71, N:7.06, O:19.98, P:2.35, R:20.00, S:2.35, T:5.88, W:5.88 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'er': {
    id: 'er',
    label: 'er / ir / ur',
    group: 'R-controlled',
    words: ['HER', 'FERN', 'HERD', 'TERM', 'PERM', 'VERB', 'WERE', 'HERS', 'PERK', 'GERM', 'BIRD', 'GIRL', 'DIRT', 'FIRM', 'SIR', 'STIR', 'FIR', 'FUR', 'BURN', 'TURN', 'HURT', 'CURL', 'PURR', 'CURB', 'SURF', 'TURF', 'BLUR', 'CURE', 'PURE', 'SURE'],
    samples: ['HER', 'BIRD', 'GIRL', 'TURN', 'HURT', 'BURN'],
    weights: { B:5.09, C:3.06, D:3.06, E:9.67, F:7.13, G:2.04, H:4.58, I:5.33, K:1.02, L:3.06, M:4.08, N:3.06, P:4.08, R:21.99, S:5.60, T:6.11, U:9.00, V:1.02, W:1.02 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'sh': {
    id: 'sh',
    label: 'sh',
    group: 'Digraphs',
    words: ['SHE', 'SHY', 'ASH', 'SHED', 'SHIP', 'SHOP', 'SHUT', 'SHIN', 'SHAM', 'SHUN', 'SHOT', 'SHOE', 'SHOW', 'SASH', 'WISH', 'FISH', 'DISH', 'CASH', 'MASH', 'RASH', 'LASH', 'DASH', 'BASH', 'MUSH', 'PUSH', 'BUSH', 'RUSH', 'GUSH', 'HUSH', 'WASH', 'POSH'],
    samples: ['SHE', 'SHIP', 'FISH', 'WISH', 'SHOP', 'SHUT'],
    weights: { A:11.49, B:2.19, C:1.09, D:3.28, E:3.83, F:1.09, G:1.09, H:18.01, I:5.47, L:1.09, M:3.28, N:2.19, O:5.47, P:4.38, R:2.19, S:18.00, T:2.19, U:8.75, W:3.28, Y:1.64 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'ch': {
    id: 'ch',
    label: 'ch',
    group: 'Digraphs',
    words: ['CHAT', 'CHIN', 'CHIP', 'CHOP', 'CHAP', 'CHUG', 'CHUM', 'CHEW', 'CHOW', 'CHAR', 'SUCH', 'MUCH', 'RICH', 'INCH', 'ACHE', 'EACH'],
    samples: ['CHAT', 'CHIN', 'CHIP', 'CHOP', 'MUCH', 'EACH'],
    weights: { A:10.00, C:18.00, E:6.00, G:2.00, H:18.00, I:8.00, M:4.00, N:4.00, O:4.00, P:6.00, R:4.00, S:2.00, T:2.00, U:8.00, W:4.00 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'th': {
    id: 'th',
    label: 'th',
    group: 'Digraphs',
    words: ['THE', 'THEM', 'THEN', 'THIS', 'THAT', 'THAN', 'THIN', 'THUD', 'THUS', 'WITH', 'BATH', 'PATH', 'MATH', 'MOTH', 'BOTH', 'THAW'],
    samples: ['THE', 'THIS', 'THAT', 'THEM', 'WITH', 'PATH'],
    weights: { A:12.59, B:4.20, D:2.10, E:7.34, H:17.47, I:6.30, M:6.30, N:6.30, O:4.20, P:2.10, S:4.20, T:18.50, U:4.20, W:4.20 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'ck': {
    id: 'ck',
    label: 'ck',
    group: 'Digraphs',
    words: ['BACK', 'PACK', 'SACK', 'TACK', 'RACK', 'LACK', 'JACK', 'DUCK', 'LUCK', 'BUCK', 'PUCK', 'TUCK', 'SICK', 'KICK', 'LICK', 'PICK', 'TICK', 'WICK', 'NICK', 'SOCK', 'LOCK', 'ROCK', 'MOCK', 'DOCK', 'NECK', 'PECK', 'DECK'],
    samples: ['BACK', 'DUCK', 'KICK', 'SOCK', 'PICK', 'ROCK'],
    weights: { A:8.45, B:2.42, C:17.67, D:3.62, E:3.62, I:8.45, J:1.21, K:18.32, L:4.83, M:1.21, N:2.42, O:6.04, P:4.83, R:2.42, S:3.62, T:3.62, U:6.04, W:1.21 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'ng': {
    id: 'ng',
    label: 'ng',
    group: 'Digraphs',
    words: ['SING', 'RING', 'KING', 'WING', 'DING', 'PING', 'SANG', 'RANG', 'HANG', 'BANG', 'LONG', 'SONG', 'GONG', 'LUNG', 'HUNG', 'RUNG', 'SUNG', 'FANG', 'PANG', 'GANG'],
    samples: ['SING', 'RING', 'KING', 'LONG', 'SONG', 'HANG'],
    weights: { A:11.79, B:1.68, D:1.68, F:1.68, G:18.87, H:3.37, I:10.11, K:1.68, L:3.37, N:17.14, O:5.05, P:3.37, R:5.05, S:6.74, U:6.74, W:1.68 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'short-a': {
    id: 'short-a',
    label: 'short a',
    group: 'Short vowels',
    words: ['CAB', 'LAB', 'TAB', 'BAT', 'CAT', 'FAT', 'HAT', 'MAT', 'PAT', 'RAT', 'SAT', 'BAD', 'DAD', 'HAD', 'LAD', 'MAD', 'PAD', 'SAD', 'BAN', 'CAN', 'FAN', 'MAN', 'PAN', 'RAN', 'TAN', 'VAN', 'BAG', 'RAG', 'TAG', 'WAG', 'CAP', 'GAP', 'LAP', 'MAP', 'NAP', 'RAP', 'SAP', 'TAP', 'HAM', 'JAM', 'RAM', 'PAL', 'GAS'],
    samples: ['CAT', 'HAT', 'MAN', 'BAG', 'MAP', 'SAD'],
    weights: { A:26.02, B:6.02, C:3.44, D:6.88, F:1.72, G:5.16, H:2.58, J:0.86, L:3.44, M:6.02, N:7.74, P:10.33, R:4.30, S:3.44, T:10.33, V:0.86, W:0.86 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'short-e': {
    id: 'short-e',
    label: 'short e',
    group: 'Short vowels',
    words: ['BED', 'FED', 'LED', 'RED', 'WED', 'BEG', 'LEG', 'BET', 'GET', 'JET', 'LET', 'MET', 'NET', 'PET', 'SET', 'VET', 'WET', 'YET', 'DEN', 'HEN', 'MEN', 'PEN', 'TEN', 'YES', 'WEB'],
    samples: ['BED', 'RED', 'HEN', 'PET', 'TEN', 'GET'],
    weights: { B:5.92, D:8.88, E:26.00, F:1.48, G:4.44, H:1.48, J:1.48, L:4.44, M:2.96, N:8.88, P:2.96, R:1.48, S:2.96, T:17.76, V:1.48, W:4.44, Y:2.96 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'short-i': {
    id: 'short-i',
    label: 'short i',
    group: 'Short vowels',
    words: ['BIT', 'FIT', 'HIT', 'KIT', 'LIT', 'PIT', 'SIT', 'DID', 'HID', 'KID', 'LID', 'BIG', 'DIG', 'FIG', 'PIG', 'WIG', 'RIG', 'DIM', 'HIM', 'RIM', 'DIP', 'HIP', 'LIP', 'RIP', 'SIP', 'TIP', 'ZIP', 'BIN', 'FIN', 'PIN', 'TIN', 'WIN', 'MIX', 'SIX', 'FIX'],
    samples: ['PIG', 'SIT', 'BIG', 'WIN', 'LIP', 'KID'],
    weights: { B:3.17, D:8.46, F:4.23, G:6.34, H:4.23, I:26.01, K:2.11, L:3.17, M:4.23, N:5.29, P:10.57, R:3.17, S:3.17, T:9.51, W:2.11, X:3.17, Z:1.06 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'short-o': {
    id: 'short-o',
    label: 'short o',
    group: 'Short vowels',
    words: ['COT', 'DOT', 'GOT', 'HOT', 'LOT', 'NOT', 'POT', 'ROT', 'COB', 'JOB', 'ROB', 'SOB', 'DOG', 'FOG', 'HOG', 'JOG', 'LOG', 'COP', 'HOP', 'MOP', 'POP', 'TOP', 'BOX', 'FOX', 'ROD', 'MOM'],
    samples: ['DOG', 'HOP', 'POT', 'MOM', 'TOP', 'BOX'],
    weights: { B:7.12, C:4.27, D:4.27, F:2.85, G:8.54, H:4.27, J:2.85, L:2.85, M:4.27, N:1.42, O:25.98, P:9.96, R:4.27, S:1.42, T:12.81, X:2.85 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'short-u': {
    id: 'short-u',
    label: 'short u',
    group: 'Short vowels',
    words: ['CUB', 'RUB', 'SUB', 'TUB', 'BUD', 'MUD', 'BUG', 'DUG', 'HUG', 'JUG', 'MUG', 'RUG', 'TUG', 'GUM', 'HUM', 'SUM', 'BUN', 'FUN', 'GUN', 'RUN', 'SUN', 'BUT', 'CUT', 'HUT', 'NUT', 'PUP', 'CUP', 'BUS'],
    samples: ['SUN', 'BUG', 'RUN', 'CUP', 'BUS', 'HUG'],
    weights: { B:11.89, C:3.96, D:3.96, F:1.32, G:11.89, H:3.96, J:1.32, M:6.61, N:7.93, P:3.96, R:3.96, S:5.29, T:7.93, U:26.02 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'a-e': {
    id: 'a-e',
    label: 'a_e',
    group: 'Magic e',
    words: ['ATE', 'AGE', 'APE', 'ACE', 'CAKE', 'BAKE', 'LAKE', 'MAKE', 'RAKE', 'WAKE', 'FAKE', 'SAKE', 'TAME', 'FAME', 'LAME', 'CAME', 'SAME', 'NAME', 'PANE', 'LANE', 'CANE', 'MANE', 'DATE', 'FATE', 'HATE', 'MATE', 'RATE', 'LATE', 'GATE', 'CAPE', 'TAPE', 'FADE', 'WADE', 'MADE', 'WAVE', 'CAVE', 'GAVE', 'SAVE', 'GAME', 'TAKE', 'PALE', 'SALE'],
    samples: ['CAKE', 'NAME', 'MAKE', 'LATE', 'GAME', 'CAME'],
    weights: { A:19.99, B:0.73, C:4.76, D:2.93, E:20.00, F:2.93, G:3.29, H:0.73, K:6.59, L:4.39, M:8.05, N:3.66, P:4.02, R:1.46, S:2.93, T:8.41, V:2.93, W:2.20 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'i-e': {
    id: 'i-e',
    label: 'i_e',
    group: 'Magic e',
    words: ['LIKE', 'BIKE', 'HIKE', 'MIKE', 'PIKE', 'DIME', 'TIME', 'LIME', 'RIPE', 'PIPE', 'WIPE', 'FIVE', 'HIVE', 'LIVE', 'DIVE', 'KITE', 'BITE', 'MITE', 'SITE', 'RIDE', 'HIDE', 'SIDE', 'TIDE', 'WIDE', 'WINE', 'MINE', 'NINE', 'LINE', 'PINE', 'FINE', 'DINE', 'VINE', 'ICE', 'RICE', 'NICE', 'MICE', 'DICE', 'SIZE', 'FIRE', 'TIRE', 'WIRE', 'HIRE'],
    samples: ['LIKE', 'BIKE', 'TIME', 'FIVE', 'RIDE', 'KITE'],
    weights: { B:1.44, C:3.95, D:6.47, E:20.00, F:2.16, H:2.87, I:20.00, K:4.31, L:2.87, M:5.03, N:7.19, P:4.31, R:5.03, S:2.16, T:5.03, V:3.59, W:2.87, Z:0.72 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'o-e': {
    id: 'o-e',
    label: 'o_e',
    group: 'Magic e',
    words: ['HOME', 'HOPE', 'ROPE', 'COPE', 'HOLE', 'POLE', 'MOLE', 'ROLE', 'BONE', 'CONE', 'ZONE', 'TONE', 'LONE', 'NOSE', 'ROSE', 'HOSE', 'POSE', 'DOSE', 'NOTE', 'VOTE', 'TOTE', 'RODE', 'CODE', 'MODE', 'JOKE', 'POKE', 'WOKE', 'YOKE', 'ROBE', 'ONE'],
    samples: ['HOME', 'HOPE', 'ROPE', 'BONE', 'NOTE', 'NOSE'],
    weights: { B:2.02, C:3.03, D:4.03, E:20.00, H:4.03, J:1.01, K:4.03, L:5.04, M:3.03, N:8.57, O:20.00, P:6.05, R:5.04, S:5.04, T:5.04, V:1.01, W:1.01, Y:1.01, Z:1.01 },
    seedChance: SOUND_SEED_CHANCE,
  },
  'u-e': {
    id: 'u-e',
    label: 'u_e',
    group: 'Magic e',
    words: ['USE', 'CUTE', 'CUBE', 'TUBE', 'MULE', 'RULE', 'FUME', 'HUGE', 'TUNE', 'DUNE', 'RUDE', 'MUTE', 'LUTE', 'DUKE', 'CURE', 'PURE', 'SURE', 'JUNE', 'BLUE', 'GLUE', 'TRUE', 'CLUE'],
    samples: ['CUTE', 'CUBE', 'USE', 'TUNE', 'MULE', 'BLUE'],
    weights: { B:4.14, C:5.52, D:4.14, E:19.97, F:1.38, G:2.76, H:1.38, J:1.38, K:1.38, L:8.28, M:4.14, N:4.14, P:1.38, R:8.28, S:3.45, T:8.28, U:20.00 },
    seedChance: SOUND_SEED_CHANCE,
  },
};

export const PRESET_WORDS = {
  sight: ['AND', 'AWAY', 'BIG', 'BLUE', 'CAN', 'COME', 'DOWN', 'FIND', 'FOR', 'GO', 'HELP', 'HERE', 'IN', 'IS', 'IT', 'JUMP', 'LOOK', 'MAKE', 'ME', 'MY', 'NOT', 'ONE', 'PLAY', 'RED', 'RUN', 'SAID', 'SEE', 'THE', 'TO', 'TWO', 'UP', 'WE', 'YOU', 'ALL', 'AM', 'ARE', 'AT', 'ATE', 'BE', 'BUT', 'CAME', 'DID', 'DO', 'EAT', 'FOUR', 'GET', 'GOOD', 'HAVE', 'HE', 'INTO', 'LIKE', 'MUST', 'NEW', 'NO', 'NOW', 'ON', 'OUR', 'OUT', 'RAN', 'RIDE', 'SAW', 'SAY', 'SHE', 'SO', 'SOON', 'THAT', 'THEY', 'THIS', 'TOO', 'WANT', 'WAS', 'WELL', 'WENT', 'WHAT', 'WHO', 'WILL', 'WITH', 'YES', 'AN', 'ANY', 'AS', 'ASK', 'BY', 'FLY', 'FROM', 'GIVE', 'HAD', 'HAS', 'HER', 'HIM', 'HIS', 'HOW', 'JUST', 'KNOW', 'LET', 'LIVE', 'MAY', 'OF', 'OLD', 'ONCE', 'OPEN', 'OVER', 'PUT', 'SOME', 'STOP', 'TAKE', 'THEM', 'THEN', 'WALK', 'WERE', 'WHEN', 'BEEN', 'BEST', 'BOTH', 'BUY', 'CALL', 'COLD', 'DOES', 'DONT', 'FAST', 'FIVE', 'GAVE', 'GOES', 'ITS', 'MADE', 'MANY', 'OFF', 'OR', 'PULL', 'READ', 'SING', 'SIT', 'TELL', 'UPON', 'US', 'USE', 'VERY', 'WASH', 'WHY', 'WISH', 'WORK', 'YOUR', 'BABY', 'BACK', 'BALL', 'BEAR', 'BED', 'BELL', 'BIRD', 'BOAT', 'BOX', 'BOY', 'CAKE', 'CAR', 'CAT', 'COAT', 'CORN', 'COW', 'DAY', 'DOG', 'DOLL', 'DOOR', 'DUCK', 'EGG', 'EYE', 'FARM', 'FEET', 'FIRE', 'FISH', 'GAME', 'GIRL', 'HAND', 'HEAD', 'HILL', 'HOME', 'LEG', 'MAN', 'MEN', 'MILK', 'NAME', 'NEST', 'PIG', 'RAIN', 'RING', 'SEED', 'SHOE', 'SNOW', 'SONG', 'SUN', 'TIME', 'TOP', 'TOY', 'TREE', 'WAY', 'WIND', 'WOOD', 'WORD', 'EACH', 'IF', 'MORE', 'THAN', 'OIL', 'LONG', 'PART', 'ONLY', 'YEAR', 'MOST', 'MUCH', 'LINE', 'MEAN', 'SAME', 'SHOW', 'ALSO', 'SET', 'END', 'EVEN', 'SUCH', 'TURN', 'NEED', 'LAND', 'MOVE', 'TRY', 'KIND', 'AIR', 'PAGE', 'HIGH', 'NEAR', 'ADD', 'FOOD', 'OWN', 'LAST', 'KEEP', 'CITY', 'LEFT', 'FEW', 'SEEM', 'NEXT', 'HARD', 'LIFE', 'GOT', 'SIDE', 'MILE', 'SEA', 'GROW', 'TOOK', 'BOOK', 'HEAR', 'LATE', 'MISS', 'IDEA', 'FACE', 'FAR', 'REAL', 'CUT', 'TALK', 'LIST'] as const,
  cvc: ['CAB', 'LAB', 'TAB', 'BAT', 'CAT', 'FAT', 'HAT', 'MAT', 'PAT', 'RAT', 'SAT', 'BAD', 'DAD', 'HAD', 'LAD', 'MAD', 'PAD', 'SAD', 'BAN', 'CAN', 'FAN', 'MAN', 'PAN', 'RAN', 'TAN', 'VAN', 'BAG', 'RAG', 'TAG', 'WAG', 'CAP', 'GAP', 'LAP', 'MAP', 'NAP', 'RAP', 'SAP', 'TAP', 'HAM', 'JAM', 'RAM', 'PAL', 'GAS', 'BED', 'FED', 'LED', 'RED', 'WED', 'BEG', 'LEG', 'BET', 'GET', 'JET', 'LET', 'MET', 'NET', 'PET', 'SET', 'VET', 'WET', 'YET', 'DEN', 'HEN', 'MEN', 'PEN', 'TEN', 'YES', 'WEB', 'BIT', 'FIT', 'HIT', 'KIT', 'LIT', 'PIT', 'SIT', 'DID', 'HID', 'KID', 'LID', 'BIG', 'DIG', 'FIG', 'PIG', 'WIG', 'RIG', 'DIM', 'HIM', 'RIM', 'DIP', 'HIP', 'LIP', 'RIP', 'SIP', 'TIP', 'ZIP', 'BIN', 'FIN', 'PIN', 'TIN', 'WIN', 'MIX', 'SIX', 'FIX', 'COT', 'DOT', 'GOT', 'HOT', 'LOT', 'NOT', 'POT', 'ROT', 'COB', 'JOB', 'ROB', 'SOB', 'DOG', 'FOG', 'HOG', 'JOG', 'LOG', 'COP', 'HOP', 'MOP', 'POP', 'TOP', 'BOX', 'FOX', 'ROD', 'MOM', 'CUB', 'RUB', 'SUB', 'TUB', 'BUD', 'MUD', 'BUG', 'DUG', 'HUG', 'JUG', 'MUG', 'RUG', 'TUG', 'GUM', 'HUM', 'SUM', 'BUN', 'FUN', 'GUN', 'RUN', 'SUN', 'BUT', 'CUT', 'HUT', 'NUT', 'PUP', 'CUP', 'BUS'] as const,
  families: ['BAT', 'CAT', 'FAT', 'HAT', 'MAT', 'PAT', 'RAT', 'SAT', 'BAN', 'CAN', 'FAN', 'MAN', 'PAN', 'RAN', 'TAN', 'VAN', 'BIG', 'DIG', 'FIG', 'PIG', 'WIG', 'RIG', 'COP', 'HOP', 'MOP', 'POP', 'TOP', 'BUG', 'DUG', 'HUG', 'JUG', 'MUG', 'RUG', 'TUG'] as const,
  blends: ['SHE', 'SHY', 'ASH', 'SHED', 'SHIP', 'SHOP', 'SHUT', 'SHIN', 'SHAM', 'SHUN', 'SHOT', 'SHOE', 'SHOW', 'SASH', 'WISH', 'FISH', 'DISH', 'CASH', 'MASH', 'RASH', 'LASH', 'DASH', 'BASH', 'MUSH', 'PUSH', 'BUSH', 'RUSH', 'GUSH', 'HUSH', 'WASH', 'POSH', 'CHAT', 'CHIN', 'CHIP', 'CHOP', 'CHAP', 'CHUG', 'CHUM', 'CHEW', 'CHOW', 'CHAR', 'SUCH', 'MUCH', 'RICH', 'INCH', 'ACHE', 'EACH', 'THE', 'THEM', 'THEN', 'THIS', 'THAT', 'THAN', 'THIN', 'THUD', 'THUS', 'WITH', 'BATH', 'PATH', 'MATH', 'MOTH', 'BOTH', 'THAW', 'WHO', 'WHY', 'WHEN', 'WHAT', 'WHIP', 'WHIM', 'WHET', 'BACK', 'PACK', 'SACK', 'TACK', 'RACK', 'LACK', 'JACK', 'DUCK', 'LUCK', 'BUCK', 'PUCK', 'TUCK', 'SICK', 'KICK', 'LICK', 'PICK', 'TICK', 'WICK', 'NICK', 'SOCK', 'LOCK', 'ROCK', 'MOCK', 'DOCK', 'NECK', 'PECK', 'DECK', 'STOP', 'STEP', 'STAR', 'STAY', 'STEM', 'STIR', 'JUST', 'LAST', 'BEST', 'NEST', 'REST', 'LIST', 'MIST', 'MUST', 'FAST', 'PAST', 'WEST', 'COST', 'LOST', 'POST', 'MOST', 'DUST', 'RUST', 'FIST', 'BLUE', 'BLOW', 'BLOT', 'BLOB', 'BLED', 'CLAP', 'CLIP', 'CLOD', 'CLOG', 'CLUB', 'CLAM', 'CLAN', 'CLAW', 'CLAY', 'CLOT', 'FLAG', 'FLAP', 'FLAT', 'FLIP', 'FLOP', 'FLEE', 'FLEA', 'FLAW', 'FLED', 'FLOW', 'PLAN', 'PLAY', 'PLOT', 'PLOP', 'PLUS', 'PLEA', 'PLOD', 'PLUM', 'PLUG', 'SLAP', 'SLIM', 'SLIP', 'SLOP', 'SLOT', 'SLAM', 'SLAT', 'SLED', 'SLOW', 'SLIT', 'BRAT', 'BRIM', 'BRAG', 'BRAN', 'BROW', 'BRED', 'BRAY', 'CRAB', 'CRAM', 'CRIB', 'CROP', 'CROW', 'CREW', 'CRY', 'DRAB', 'DRAG', 'DRIP', 'DROP', 'DRUM', 'DREW', 'DRY', 'FROG', 'FROM', 'FRET', 'FRY', 'GRAB', 'GRAM', 'GRIM', 'GRIN', 'GRIP', 'GRIT', 'GROW', 'GRUB', 'GRAY', 'GREY', 'TRAP', 'TRAY', 'TREE', 'TRIM', 'TRIP', 'TROT', 'TRUE', 'TRY', 'TRAM', 'TREK', 'SWIM', 'SWAB', 'SWAT', 'SWAY', 'SWIG', 'SWUM', 'SMOG', 'SMUG', 'SNAP', 'SNIP', 'SNOB', 'SNUG', 'SNUB', 'SPAN', 'SPIN', 'SPIT', 'SPOT', 'SPUN', 'SPAR', 'SPAT', 'SPED', 'SKIN', 'SKIP', 'SKID', 'SKIM', 'SKIT', 'TWIN', 'TWIG', 'TWO', 'SING', 'RING', 'KING', 'WING', 'DING', 'PING', 'SANG', 'RANG', 'HANG', 'BANG', 'LONG', 'SONG', 'GONG', 'LUNG', 'HUNG', 'RUNG', 'SUNG', 'FANG', 'PANG', 'GANG'] as const,
};

export const PRESET_WEIGHTS: Record<Exclude<LetterPresetId, 'standard'>, WeightMap> = {
  sight: { A:10.00, B:3.11, C:2.02, D:4.54, E:11.05, F:2.29, G:3.20, H:3.92, I:6.01, J:0.29, K:1.38, L:4.29, M:3.45, N:5.59, O:9.07, P:2.92, R:4.10, S:4.72, T:7.28, U:3.87, V:0.76, W:3.29, X:0.29, Y:2.45, Z:0.11 },
  cvc: { A:10.95, B:5.35, C:1.91, D:5.35, E:6.37, F:1.91, G:5.73, H:2.68, I:8.92, J:0.96, K:0.38, L:2.29, M:4.01, N:5.16, O:6.62, P:6.50, R:2.87, S:2.68, T:9.17, U:7.13, V:0.38, W:1.15, X:0.96, Y:0.38, Z:0.19 },
  families: { A:14.75, B:4.21, C:2.73, D:2.64, E:1.27, F:2.73, G:11.35, H:2.89, I:6.49, J:0.98, K:0.08, L:0.46, M:3.94, N:7.30, O:5.24, P:8.36, R:3.71, S:1.32, T:10.46, U:6.91, V:0.86, W:1.01, X:0.19, Y:0.08, Z:0.04 },
  blends: { A:11.29, B:2.39, C:4.99, D:1.95, E:5.60, F:1.48, G:3.59, H:6.06, I:8.19, J:0.16, K:2.79, L:4.31, M:2.47, N:3.59, O:7.18, P:4.31, R:4.87, S:8.34, T:6.34, U:5.75, W:2.99, Y:1.36 },
};

export const PRESET_META: Record<LetterPresetId, { label: string; blurb: string }> = {
  standard: {
    label: 'Standard (by difficulty)',
    blurb: 'Beginner, Easy, and the rest keep their usual letter mix',
  },
  sight: {
    label: 'Sight Words',
    blurb: 'Dolch and Fry words kids see often',
  },
  cvc: {
    label: 'Short Vowels / CVC',
    blurb: 'cat, bed, pig, hop, sun',
  },
  families: {
    label: 'Word Families',
    blurb: '–at, –an, –ig, –op, –ug',
  },
  blends: {
    label: 'Blends & Digraphs',
    blurb: 'sh, ch, th, st, bl…',
  },
};
